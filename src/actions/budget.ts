"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";

import { getDb } from "@/db";
import {
  applyPaymentDebt,
  defaultDebitAccountId,
  generateMonthFromTemplates,
  getOrCreateMonth,
  getPaymentEntry,
  getPaymentTemplate,
  getDebt,
  listAccounts,
  reversePaymentDebt,
} from "@/db/queries";
import {
  accountSnapshots,
  accounts,
  debtPayoffDrops,
  debtPayoffPlans,
  debts,
  incomeEntries,
  incomeTemplates,
  paymentEntries,
  paymentTemplates,
  settings,
} from "@/db/schema";
import {
  clampDay,
  currentYearMonth,
  isBeyondVisibleFuture,
  isValidYearMonth,
  monthPath,
  parseIsoDate,
  todayIsoDate,
  toIsoDate,
} from "@/lib/dates";
import { nextPrincipalCents } from "@/lib/debts";
import type { DebtOptimizeStrategy } from "@/lib/debt-optimize";
import { isIncomeCadence, type IncomeCadence } from "@/lib/income";
import { newId } from "@/lib/ids";
import type { CsvImportTarget, CsvMappedRow } from "@/lib/csv-import";

function refresh() {
  revalidatePath("/");
  revalidatePath("/debts");
  revalidatePath("/settings");
  revalidatePath("/onboarding");
}

function incomeTemplateDates(nextPayDate: string) {
  const date = parseIsoDate(nextPayDate) ?? new Date();
  return {
    nextPayDate: toIsoDate(date),
    dayOfMonth: date.getDate(),
  };
}

export type OnboardingAccountInput = {
  name: string;
  type: "asset" | "liability";
  openingBalanceCents: number;
};

export type OnboardingIncomeInput = {
  label: string;
  accountIndex: number;
  cadence: IncomeCadence;
  nextPayDate: string;
  expectedAmountCents: number;
  notes: string;
};

export type OnboardingDebtInput = {
  creditor: string;
  accountIndex: number | null;
  balanceCents: number;
  monthlyPaymentCents: number;
  dayOfMonth: number;
};

export type OnboardingPaymentInput = {
  label: string;
  accountIndex: number;
  dayOfMonth: number;
  expectedAmountCents: number;
  notes: string;
  debtIndex: number | null;
};

export async function skipOnboarding() {
  getDb()
    .update(settings)
    .set({ onboardingCompleted: true })
    .where(eq(settings.id, 1))
    .run();
  const now = currentYearMonth();
  generateMonthFromTemplates(now.year, now.month);
  refresh();
  redirect("/");
}

export async function completeOnboarding(input: {
  accounts: OnboardingAccountInput[];
  incomes: OnboardingIncomeInput[];
  payments: OnboardingPaymentInput[];
  debts: OnboardingDebtInput[];
}) {
  const db = getDb();
  const now = currentYearMonth();

  const accountIds = input.accounts.map((account) => {
    const id = newId();
    db.insert(accounts)
      .values({
        id,
        name: account.name.trim() || "Compte",
        type: account.type,
        sortOrder: 0,
      })
      .run();
    return id;
  });

  input.accounts.forEach((account, index) => {
    db.update(accounts)
      .set({ sortOrder: index })
      .where(eq(accounts.id, accountIds[index]))
      .run();
    void account;
  });

  const debtIds = input.debts.map((debt) => {
    const id = newId();
    const accountId =
      debt.accountIndex === null ? null : (accountIds[debt.accountIndex] ?? null);
    db.insert(debts)
      .values({
        id,
        creditor: debt.creditor.trim() || "Dette",
        accountId,
        balanceCents: debt.balanceCents,
        principalCents: debt.balanceCents,
        monthlyPaymentCents: debt.monthlyPaymentCents,
        dayOfMonth: clampDay(debt.dayOfMonth),
      })
      .run();
    return id;
  });

  for (const income of input.incomes) {
    const accountId = accountIds[income.accountIndex];
    if (!accountId) continue;
    const dates = incomeTemplateDates(income.nextPayDate);
    db.insert(incomeTemplates)
      .values({
        id: newId(),
        accountId,
        label: income.label.trim() || "Paie",
        cadence: isIncomeCadence(income.cadence) ? income.cadence : "month",
        nextPayDate: dates.nextPayDate,
        dayOfMonth: dates.dayOfMonth,
        expectedAmountCents: income.expectedAmountCents,
        notes: income.notes.trim(),
      })
      .run();
  }

  for (const payment of input.payments) {
    if (payment.debtIndex !== null) continue;
    const accountId = accountIds[payment.accountIndex];
    if (!accountId) continue;
    db.insert(paymentTemplates)
      .values({
        id: newId(),
        accountId,
        label: payment.label.trim() || "Facture",
        dayOfMonth: clampDay(payment.dayOfMonth),
        expectedAmountCents: payment.expectedAmountCents,
        notes: payment.notes.trim(),
        debtId: null,
        fromDebt: false,
      })
      .run();
  }

  const monthRow = generateMonthFromTemplates(now.year, now.month);

  input.accounts.forEach((account, index) => {
    const accountId = accountIds[index];
    db.update(accountSnapshots)
      .set({ openingBalanceCents: account.openingBalanceCents })
      .where(
        and(
          eq(accountSnapshots.accountId, accountId),
          eq(accountSnapshots.monthId, monthRow.id),
        ),
      )
      .run();
  });

  db.update(settings)
    .set({ onboardingCompleted: true })
    .where(eq(settings.id, 1))
    .run();

  refresh();
  redirect("/");
}

export async function reopenOnboarding() {
  getDb()
    .update(settings)
    .set({ onboardingCompleted: false })
    .where(eq(settings.id, 1))
    .run();
  refresh();
  redirect("/onboarding");
}

export async function updateTheme(theme: "light" | "dark" | "system") {
  getDb().update(settings).set({ theme }).where(eq(settings.id, 1)).run();
  refresh();
}

export async function createAccount(name: string, type: "asset" | "liability") {
  const existing = listAccounts();
  getDb()
    .insert(accounts)
    .values({
      id: newId(),
      name: name.trim() || "Compte",
      type,
      sortOrder: existing.length,
    })
    .run();
  const now = currentYearMonth();
  generateMonthFromTemplates(now.year, now.month);
  refresh();
}

export async function updateAccount(
  id: string,
  patch: { name?: string; type?: "asset" | "liability" },
) {
  getDb().update(accounts).set(patch).where(eq(accounts.id, id)).run();
  refresh();
}

export async function deleteAccount(id: string) {
  getDb().delete(accounts).where(eq(accounts.id, id)).run();
  refresh();
}

export async function openHistoryMonth(year: number, month: number) {
  if (!isValidYearMonth(year, month)) return;
  if (isBeyondVisibleFuture({ year, month })) return;
  generateMonthFromTemplates(year, month);
  refresh();
  redirect(monthPath(year, month, { history: "1" }));
}

export async function updateSnapshot(id: string, openingBalanceCents: number) {
  getDb()
    .update(accountSnapshots)
    .set({ openingBalanceCents })
    .where(eq(accountSnapshots.id, id))
    .run();
  refresh();
}

export async function createIncomeTemplate(input: {
  accountId: string;
  label?: string;
  cadence?: IncomeCadence;
  nextPayDate?: string;
  expectedAmountCents?: number;
  notes?: string;
}) {
  const cadence = input.cadence && isIncomeCadence(input.cadence) ? input.cadence : "biweek";
  const dates = incomeTemplateDates(input.nextPayDate || todayIsoDate());
  getDb()
    .insert(incomeTemplates)
    .values({
      id: newId(),
      accountId: input.accountId,
      label: input.label?.trim() || "Paie",
      cadence,
      nextPayDate: dates.nextPayDate,
      dayOfMonth: dates.dayOfMonth,
      expectedAmountCents: input.expectedAmountCents ?? 0,
      notes: input.notes?.trim() ?? "",
    })
    .run();
  const now = currentYearMonth();
  generateMonthFromTemplates(now.year, now.month);
  refresh();
}

export async function updateIncomeTemplate(
  id: string,
  patch: Partial<{
    accountId: string;
    label: string;
    cadence: IncomeCadence;
    nextPayDate: string;
    expectedAmountCents: number;
    notes: string;
  }>,
) {
  const nextPatch: typeof patch & { dayOfMonth?: number } = { ...patch };
  if (nextPatch.cadence !== undefined && !isIncomeCadence(nextPatch.cadence)) {
    delete nextPatch.cadence;
  }
  if (nextPatch.nextPayDate !== undefined) {
    Object.assign(nextPatch, incomeTemplateDates(nextPatch.nextPayDate));
  }
  getDb().update(incomeTemplates).set(nextPatch).where(eq(incomeTemplates.id, id)).run();
  const now = currentYearMonth();
  generateMonthFromTemplates(now.year, now.month);
  refresh();
}

export async function deleteIncomeTemplate(id: string) {
  getDb()
    .delete(incomeEntries)
    .where(and(eq(incomeEntries.templateId, id), eq(incomeEntries.received, false)))
    .run();
  getDb().delete(incomeTemplates).where(eq(incomeTemplates.id, id)).run();
  const now = currentYearMonth();
  generateMonthFromTemplates(now.year, now.month);
  refresh();
}

export async function createPaymentTemplate(input: {
  accountId: string;
  label?: string;
  dayOfMonth?: number;
  expectedAmountCents?: number;
  notes?: string;
  debtId?: string | null;
}) {
  getDb()
    .insert(paymentTemplates)
    .values({
      id: newId(),
      accountId: input.accountId,
      label: input.label?.trim() || "Facture",
      dayOfMonth: input.dayOfMonth !== undefined ? clampDay(input.dayOfMonth) : 1,
      expectedAmountCents: input.expectedAmountCents ?? 0,
      notes: input.notes?.trim() ?? "",
      debtId: input.debtId ?? null,
      fromDebt: false,
    })
    .run();
  refresh();
}

export async function updatePaymentTemplate(
  id: string,
  patch: Partial<{
    accountId: string;
    label: string;
    dayOfMonth: number;
    expectedAmountCents: number;
    notes: string;
    debtId: string | null;
  }>,
) {
  const template = getPaymentTemplate(id);
  if (template?.fromDebt) {
    const lockedPatch: { accountId?: string; notes?: string } = {};
    if (patch.accountId !== undefined) lockedPatch.accountId = patch.accountId;
    if (patch.notes !== undefined) lockedPatch.notes = patch.notes;
    if (Object.keys(lockedPatch).length === 0) return;
    getDb().update(paymentTemplates).set(lockedPatch).where(eq(paymentTemplates.id, id)).run();
    const now = currentYearMonth();
    generateMonthFromTemplates(now.year, now.month);
    refresh();
    return;
  }
  if (patch.dayOfMonth !== undefined) patch.dayOfMonth = clampDay(patch.dayOfMonth);
  getDb().update(paymentTemplates).set(patch).where(eq(paymentTemplates.id, id)).run();
  refresh();
}

export async function deletePaymentTemplate(id: string) {
  const template = getPaymentTemplate(id);
  if (template?.fromDebt) return;
  getDb().delete(paymentTemplates).where(eq(paymentTemplates.id, id)).run();
  refresh();
}

export async function createDebt() {
  getDb()
    .insert(debts)
    .values({
      id: newId(),
      creditor: "Nouvelle dette",
      accountId: null,
      balanceCents: 0,
      principalCents: 0,
      monthlyPaymentCents: 0,
      dayOfMonth: 1,
    })
    .run();
  const now = currentYearMonth();
  generateMonthFromTemplates(now.year, now.month);
  refresh();
}

export async function updateDebt(
  id: string,
  patch: Partial<{
    creditor: string;
    accountId: string | null;
    balanceCents: number;
    principalCents: number;
    payingSince: string;
    monthlyPaymentCents: number;
    dayOfMonth: number;
    annualRateBps: number;
  }>,
) {
  if (patch.dayOfMonth !== undefined) patch.dayOfMonth = clampDay(patch.dayOfMonth);
  if (patch.annualRateBps !== undefined) {
    patch.annualRateBps = Math.max(0, Math.round(patch.annualRateBps));
  }
  if (patch.accountId) {
    getDb()
      .update(debts)
      .set({ accountId: null })
      .where(and(eq(debts.accountId, patch.accountId), ne(debts.id, id)))
      .run();
  }
  if (patch.balanceCents !== undefined && patch.principalCents === undefined) {
    const current = getDebt(id);
    if (current) {
      patch = {
        ...patch,
        principalCents: nextPrincipalCents(current.principalCents, patch.balanceCents),
      };
    }
  }
  getDb().update(debts).set(patch).where(eq(debts.id, id)).run();
  const now = currentYearMonth();
  generateMonthFromTemplates(now.year, now.month);
  refresh();
}

export async function deleteDebt(id: string) {
  getDb().delete(debts).where(eq(debts.id, id)).run();
  const now = currentYearMonth();
  generateMonthFromTemplates(now.year, now.month);
  refresh();
}

function isStrategy(value: string): value is DebtOptimizeStrategy {
  return value === "avalanche" || value === "snowball";
}

export async function updateDebtPayoffPlan(patch: {
  strategy?: DebtOptimizeStrategy;
  extraMonthlyCents?: number;
}) {
  if (patch.strategy !== undefined && !isStrategy(patch.strategy)) return;
  if (patch.extraMonthlyCents !== undefined) {
    patch.extraMonthlyCents = Math.max(0, Math.round(patch.extraMonthlyCents));
  }
  getDb().update(debtPayoffPlans).set(patch).where(eq(debtPayoffPlans.id, 1)).run();
  refresh();
}

export async function upsertDebtPayoffDrop(input: {
  debtId: string;
  amountCents: number;
  redirectDebtId: string | null;
}) {
  const amountCents = Math.max(0, Math.round(input.amountCents));
  const redirectDebtId =
    input.redirectDebtId && input.redirectDebtId !== input.debtId ? input.redirectDebtId : null;
  const db = getDb();
  const existing = db
    .select()
    .from(debtPayoffDrops)
    .where(eq(debtPayoffDrops.debtId, input.debtId))
    .get();

  if (amountCents <= 0 && !redirectDebtId) {
    if (existing) db.delete(debtPayoffDrops).where(eq(debtPayoffDrops.id, existing.id)).run();
    refresh();
    return;
  }

  if (existing) {
    db.update(debtPayoffDrops)
      .set({ amountCents, redirectDebtId })
      .where(eq(debtPayoffDrops.id, existing.id))
      .run();
  } else {
    db.insert(debtPayoffDrops)
      .values({
        id: newId(),
        debtId: input.debtId,
        amountCents,
        redirectDebtId,
      })
      .run();
  }
  refresh();
}

export async function createIncomeEntry(monthId: string, accountId: string) {
  getDb()
    .insert(incomeEntries)
    .values({
      id: newId(),
      monthId,
      accountId,
      templateId: null,
      label: "Paie",
      dayOfMonth: 1,
      expectedAmountCents: 0,
      actualAmountCents: null,
      received: false,
      notes: "",
    })
    .run();
  refresh();
}

export async function updateIncomeEntry(
  id: string,
  patch: Partial<{
    accountId: string;
    label: string;
    dayOfMonth: number;
    expectedAmountCents: number;
    actualAmountCents: number | null;
    received: boolean;
    notes: string;
  }>,
) {
  if (patch.dayOfMonth !== undefined) patch.dayOfMonth = clampDay(patch.dayOfMonth);
  getDb().update(incomeEntries).set(patch).where(eq(incomeEntries.id, id)).run();
  refresh();
}

export async function deleteIncomeEntry(id: string) {
  getDb().delete(incomeEntries).where(eq(incomeEntries.id, id)).run();
  refresh();
}

function persistPaymentPatch(
  id: string,
  patch: Partial<{
    accountId: string;
    label: string;
    dayOfMonth: number;
    expectedAmountCents: number;
    actualAmountCents: number | null;
    paid: boolean;
    notes: string;
    debtId: string | null;
  }>,
) {
  const before = getPaymentEntry(id);
  if (!before) return;
  const template = before.templateId ? getPaymentTemplate(before.templateId) : null;
  if (template?.fromDebt) {
    delete patch.label;
    delete patch.dayOfMonth;
    delete patch.expectedAmountCents;
    delete patch.debtId;
  }
  reversePaymentDebt(before);
  if (patch.dayOfMonth !== undefined) patch.dayOfMonth = clampDay(patch.dayOfMonth);
  getDb().update(paymentEntries).set(patch).where(eq(paymentEntries.id, id)).run();
  const after = getPaymentEntry(id);
  if (after) applyPaymentDebt(after);
}

export async function createPaymentEntry(monthId: string, accountId: string) {
  getDb()
    .insert(paymentEntries)
    .values({
      id: newId(),
      monthId,
      accountId,
      templateId: null,
      debtId: null,
      label: "Paiement",
      dayOfMonth: 1,
      expectedAmountCents: 0,
      actualAmountCents: null,
      paid: false,
      notes: "",
      appliedToDebtAmountCents: 0,
    })
    .run();
  refresh();
}

export async function updatePaymentEntry(
  id: string,
  patch: Partial<{
    accountId: string;
    label: string;
    dayOfMonth: number;
    expectedAmountCents: number;
    actualAmountCents: number | null;
    paid: boolean;
    notes: string;
    debtId: string | null;
  }>,
) {
  persistPaymentPatch(id, patch);
  refresh();
}

export async function deletePaymentEntry(id: string) {
  const entry = getPaymentEntry(id);
  if (entry?.templateId) {
    const template = getPaymentTemplate(entry.templateId);
    if (template?.fromDebt) return;
  }
  if (entry && entry.appliedToDebtAmountCents !== 0) {
    persistPaymentPatch(id, { paid: false, actualAmountCents: null });
  }
  getDb().delete(paymentEntries).where(eq(paymentEntries.id, id)).run();
  refresh();
}

function resolveImportedAccountId(accountName: string, fallbackId: string) {
  const allAccounts = listAccounts();
  const needle = accountName.trim().toLowerCase();
  if (needle) {
    const match = allAccounts.find((account) => account.name.trim().toLowerCase() === needle);
    if (match) return match.id;
  }
  return fallbackId;
}

export async function importCsvRows(input: {
  target: CsvImportTarget;
  monthId?: string;
  year?: number;
  month?: number;
  defaultAccountId?: string;
  rows: CsvMappedRow[];
}) {
  const fallbackAccountId = input.defaultAccountId ?? defaultDebitAccountId();
  if (!fallbackAccountId && input.target !== "debts") {
    return { imported: 0, skipped: input.rows.length };
  }

  const now = currentYearMonth();
  const year = input.year ?? now.year;
  const month = input.month ?? now.month;
  const monthRow =
    input.target === "month-payments" || input.target === "month-incomes"
      ? input.monthId
        ? { id: input.monthId, year, month }
        : getOrCreateMonth(year, month)
      : null;

  const db = getDb();
  const rows = input.rows.slice(0, 400);
  let imported = 0;

  for (const row of rows) {
    if (!row.label.trim()) continue;
    const accountId = resolveImportedAccountId(row.accountName, fallbackAccountId ?? "");
    const dayOfMonth = clampDay(row.dayOfMonth);

    if (input.target === "month-payments" && monthRow) {
      db.insert(paymentEntries)
        .values({
          id: newId(),
          monthId: monthRow.id,
          accountId,
          templateId: null,
          debtId: null,
          label: row.label.trim(),
          dayOfMonth,
          expectedAmountCents: row.amountCents,
          actualAmountCents: null,
          paid: false,
          notes: row.notes,
          appliedToDebtAmountCents: 0,
        })
        .run();
      imported += 1;
      continue;
    }

    if (input.target === "month-incomes" && monthRow) {
      db.insert(incomeEntries)
        .values({
          id: newId(),
          monthId: monthRow.id,
          accountId,
          templateId: null,
          label: row.label.trim(),
          dayOfMonth,
          expectedAmountCents: row.amountCents,
          actualAmountCents: null,
          received: false,
          notes: row.notes,
        })
        .run();
      imported += 1;
      continue;
    }

    if (input.target === "payment-templates") {
      db.insert(paymentTemplates)
        .values({
          id: newId(),
          accountId,
          label: row.label.trim(),
          dayOfMonth,
          expectedAmountCents: row.amountCents,
          notes: row.notes,
          debtId: null,
          fromDebt: false,
        })
        .run();
      imported += 1;
      continue;
    }

    if (input.target === "debts") {
      db.insert(debts)
        .values({
          id: newId(),
          creditor: row.label.trim(),
          balanceCents: row.amountCents,
          principalCents: row.amountCents,
          monthlyPaymentCents: row.monthlyPaymentCents,
          dayOfMonth,
        })
        .run();
      imported += 1;
    }
  }

  generateMonthFromTemplates(year, month);
  refresh();
  return { imported, skipped: Math.max(0, input.rows.length - imported) };
}


import { and, asc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import {
  accountSnapshots,
  accounts,
  debtPayoffDrops,
  debtPayoffPlans,
  debts,
  incomeEntries,
  incomeTemplates,
  months,
  paymentEntries,
  paymentTemplates,
  settings,
  type AccountSnapshot,
  type IncomeEntry,
  type PaymentEntry,
} from "@/db/schema";
import { accountMonthStories } from "@/lib/accounts";
import {
  addMonths,
  clampDay,
  currentYearMonth,
  isBeyondVisibleFuture,
  isPastYearMonth,
  lineDateHasArrived,
} from "@/lib/dates";
import { debtPaymentLabel, paymentDebtEffect } from "@/lib/debts";
import { incomeDaysInMonth, isIncomeCadence } from "@/lib/income";
import { newId } from "@/lib/ids";

export function getSettings() {
  const row = getDb().select().from(settings).where(eq(settings.id, 1)).get();
  if (!row) {
    getDb()
      .insert(settings)
      .values({ id: 1, onboardingCompleted: false, theme: "light" })
      .run();
    return getDb().select().from(settings).where(eq(settings.id, 1)).get()!;
  }
  return row;
}

export function listAccounts() {
  return getDb().select().from(accounts).orderBy(asc(accounts.sortOrder), asc(accounts.name)).all();
}

export function listDebts() {
  return getDb().select().from(debts).orderBy(asc(debts.creditor)).all();
}

export function getDebt(id: string) {
  return getDb().select().from(debts).where(eq(debts.id, id)).get();
}

export function getDebtPayoffPlan() {
  const db = getDb();
  let plan = db.select().from(debtPayoffPlans).where(eq(debtPayoffPlans.id, 1)).get();
  if (!plan) {
    db.insert(debtPayoffPlans)
      .values({ id: 1, strategy: "snowball", extraMonthlyCents: 0 })
      .run();
    plan = db.select().from(debtPayoffPlans).where(eq(debtPayoffPlans.id, 1)).get()!;
  }
  const drops = db.select().from(debtPayoffDrops).orderBy(asc(debtPayoffDrops.debtId)).all();
  return { plan, drops };
}

export function listIncomeTemplates() {
  return getDb().select().from(incomeTemplates).orderBy(asc(incomeTemplates.nextPayDate)).all();
}

export function listPaymentTemplates() {
  return getDb().select().from(paymentTemplates).orderBy(asc(paymentTemplates.dayOfMonth)).all();
}

export function defaultDebitAccountId() {
  const allAccounts = listAccounts();
  return allAccounts.find((account) => account.type === "asset")?.id ?? allAccounts[0]?.id;
}

export function getPaymentTemplate(id: string) {
  return getDb().select().from(paymentTemplates).where(eq(paymentTemplates.id, id)).get();
}

export function syncDebtPaymentTemplates() {
  const db = getDb();
  const accountId = defaultDebitAccountId();
  if (!accountId) return;

  const allDebts = listDebts();
  const templates = listPaymentTemplates();
  const claimed = new Set<string>();

  for (const debt of allDebts) {
    const managed =
      templates.find((row) => row.fromDebt && row.debtId === debt.id) ??
      templates.find((row) => !claimed.has(row.id) && row.debtId === debt.id);
    const values = {
      label: debtPaymentLabel(debt.creditor),
      dayOfMonth: clampDay(debt.dayOfMonth),
      expectedAmountCents: debt.monthlyPaymentCents,
      debtId: debt.id,
      fromDebt: true as const,
    };

    if (managed) {
      claimed.add(managed.id);
      db.update(paymentTemplates).set(values).where(eq(paymentTemplates.id, managed.id)).run();
    } else {
      db.insert(paymentTemplates)
        .values({
          id: newId(),
          accountId,
          notes: "",
          ...values,
        })
        .run();
    }
  }

  for (const row of listPaymentTemplates()) {
    if (!row.fromDebt) continue;
    if (allDebts.some((debt) => debt.id === row.debtId)) continue;
    db.delete(paymentTemplates).where(eq(paymentTemplates.id, row.id)).run();
  }
}

export function findMonth(year: number, month: number) {
  return getDb()
    .select()
    .from(months)
    .where(and(eq(months.year, year), eq(months.month, month)))
    .get();
}

export function listYearMonths() {
  return getDb()
    .select({ year: months.year, month: months.month })
    .from(months)
    .orderBy(asc(months.year), asc(months.month))
    .all();
}

export function getOrCreateMonth(year: number, month: number) {
  const existing = findMonth(year, month);
  if (existing) return existing;
  const created = {
    id: newId(),
    year,
    month,
  };
  getDb().insert(months).values(created).run();
  return created;
}

function monthLedger(monthId: string) {
  const db = getDb();
  return {
    snapshots: db
      .select()
      .from(accountSnapshots)
      .where(eq(accountSnapshots.monthId, monthId))
      .all(),
    incomes: db.select().from(incomeEntries).where(eq(incomeEntries.monthId, monthId)).all(),
    payments: db.select().from(paymentEntries).where(eq(paymentEntries.monthId, monthId)).all(),
  };
}

function monthHasActivity(incomes: IncomeEntry[], payments: PaymentEntry[]) {
  return incomes.some((row) => row.received) || payments.some((row) => row.paid);
}

function closingBalancesByAccount(
  snapshots: AccountSnapshot[],
  incomes: IncomeEntry[],
  payments: PaymentEntry[],
) {
  const stories = accountMonthStories(listAccounts(), snapshots, incomes, payments, listDebts());
  return new Map(stories.map((story) => [story.account.id, story.projectedCents]));
}

function previousClosingByAccount(year: number, month: number) {
  const previous = addMonths(year, month, -1);
  const monthRow = findMonth(previous.year, previous.month);
  if (!monthRow) return new Map<string, number>();
  const ledger = monthLedger(monthRow.id);
  return closingBalancesByAccount(ledger.snapshots, ledger.incomes, ledger.payments);
}

function applyOpeningBalances(monthId: string, openings: Map<string, number>) {
  const db = getDb();
  for (const snapshot of monthLedger(monthId).snapshots) {
    const opening = openings.get(snapshot.accountId);
    if (opening === undefined || snapshot.openingBalanceCents === opening) continue;
    db.update(accountSnapshots)
      .set({ openingBalanceCents: opening })
      .where(eq(accountSnapshots.id, snapshot.id))
      .run();
  }
}

function acceptDueIncomes(monthId: string, year: number, month: number) {
  const db = getDb();
  const incomes = db
    .select()
    .from(incomeEntries)
    .where(eq(incomeEntries.monthId, monthId))
    .all();
  for (const entry of incomes) {
    if (entry.received) continue;
    if (!lineDateHasArrived(year, month, entry.dayOfMonth)) continue;
    db.update(incomeEntries)
      .set({ received: true })
      .where(eq(incomeEntries.id, entry.id))
      .run();
  }
}

export function generateMonthFromTemplates(year: number, month: number) {
  const db = getDb();
  syncDebtPaymentTemplates();
  const monthRow = getOrCreateMonth(year, month);
  const allAccounts = listAccounts();
  const snapshots = db
    .select()
    .from(accountSnapshots)
    .where(eq(accountSnapshots.monthId, monthRow.id))
    .all();
  const carried = previousClosingByAccount(year, month);

  for (const account of allAccounts) {
    if (snapshots.some((snapshot) => snapshot.accountId === account.id)) continue;
    db.insert(accountSnapshots)
      .values({
        id: newId(),
        monthId: monthRow.id,
        accountId: account.id,
        openingBalanceCents: carried.get(account.id) ?? 0,
      })
      .run();
  }

  const ledger = monthLedger(monthRow.id);
  if (!monthHasActivity(ledger.incomes, ledger.payments) && carried.size > 0) {
    applyOpeningBalances(monthRow.id, carried);
  }

  const incomeTpls = listIncomeTemplates();
  const existingIncome = db
    .select()
    .from(incomeEntries)
    .where(eq(incomeEntries.monthId, monthRow.id))
    .all();
  for (const template of incomeTpls) {
    const cadence = isIncomeCadence(template.cadence) ? template.cadence : "month";
    const days = incomeDaysInMonth(cadence, template.nextPayDate, year, month);
    const fromTemplate = existingIncome.filter((entry) => entry.templateId === template.id);

    for (const entry of fromTemplate) {
      if (!entry.received && !days.includes(entry.dayOfMonth)) {
        db.delete(incomeEntries).where(eq(incomeEntries.id, entry.id)).run();
      }
    }

    const remaining = fromTemplate.filter(
      (entry) => entry.received || days.includes(entry.dayOfMonth),
    );
    for (const day of days) {
      if (remaining.some((entry) => entry.dayOfMonth === day)) continue;
      db.insert(incomeEntries)
        .values({
          id: newId(),
          monthId: monthRow.id,
          accountId: template.accountId,
          templateId: template.id,
          label: template.label,
          dayOfMonth: day,
          expectedAmountCents: template.expectedAmountCents,
          actualAmountCents: null,
          received: false,
          notes: template.notes,
        })
        .run();
    }
  }

  acceptDueIncomes(monthRow.id, year, month);

  const paymentTpls = listPaymentTemplates();
  const existingPayments = db
    .select()
    .from(paymentEntries)
    .where(eq(paymentEntries.monthId, monthRow.id))
    .all();
  for (const template of paymentTpls) {
    const matches = existingPayments.filter((entry) => entry.templateId === template.id);
    if (matches.length === 0) {
      db.insert(paymentEntries)
        .values({
          id: newId(),
          monthId: monthRow.id,
          accountId: template.accountId,
          templateId: template.id,
          debtId: template.debtId,
          label: template.label,
          dayOfMonth: template.dayOfMonth,
          expectedAmountCents: template.expectedAmountCents,
          actualAmountCents: null,
          paid: false,
          notes: template.notes,
          appliedToDebtAmountCents: 0,
        })
        .run();
      continue;
    }
    if (!template.fromDebt) continue;
    for (const entry of matches) {
      if (entry.paid) continue;
      db.update(paymentEntries)
        .set({
          label: template.label,
          dayOfMonth: template.dayOfMonth,
          expectedAmountCents: template.expectedAmountCents,
          debtId: template.debtId,
        })
        .where(eq(paymentEntries.id, entry.id))
        .run();
    }
  }

  const next = addMonths(year, month, 1);
  const nextMonth = findMonth(next.year, next.month);
  if (nextMonth) {
    const nextLedger = monthLedger(nextMonth.id);
    if (!monthHasActivity(nextLedger.incomes, nextLedger.payments)) {
      const current = monthLedger(monthRow.id);
      applyOpeningBalances(
        nextMonth.id,
        closingBalancesByAccount(current.snapshots, current.incomes, current.payments),
      );
    }
  }

  return monthRow;
}

export function getMonthView(year: number, month: number) {
  const now = currentYearMonth();
  if (isBeyondVisibleFuture({ year, month }, now)) return null;

  const existing = findMonth(year, month);
  if (!existing && isPastYearMonth({ year, month }, now)) {
    return null;
  }

  const db = getDb();
  const monthRow = generateMonthFromTemplates(year, month);
  const allAccounts = listAccounts();
  const snapshots = db
    .select()
    .from(accountSnapshots)
    .where(eq(accountSnapshots.monthId, monthRow.id))
    .all();
  const incomes = db
    .select()
    .from(incomeEntries)
    .where(eq(incomeEntries.monthId, monthRow.id))
    .orderBy(asc(incomeEntries.dayOfMonth), asc(incomeEntries.label))
    .all();
  const payments = db
    .select()
    .from(paymentEntries)
    .where(eq(paymentEntries.monthId, monthRow.id))
    .orderBy(asc(paymentEntries.dayOfMonth), asc(paymentEntries.label))
    .all();

  return {
    month: monthRow,
    accounts: allAccounts,
    snapshots,
    incomes,
    payments,
    debts: listDebts(),
    debtPaymentTemplateIds: listPaymentTemplates()
      .filter((template) => template.fromDebt)
      .map((template) => template.id),
  };
}

export function reversePaymentDebt(entry: PaymentEntry) {
  const db = getDb();
  if (entry.appliedToDebtAmountCents === 0) return;

  const allDebts = listDebts();
  const chargeDebt = allDebts.find((debt) => debt.accountId === entry.accountId);
  const debtId =
    entry.appliedToDebtAmountCents < 0
      ? (chargeDebt?.id ?? entry.debtId)
      : (entry.debtId ?? chargeDebt?.id);

  if (debtId) {
    db.update(debts)
      .set({
        balanceCents: sql`${debts.balanceCents} + ${entry.appliedToDebtAmountCents}`,
      })
      .where(eq(debts.id, debtId))
      .run();
  }
  db.update(paymentEntries)
    .set({ appliedToDebtAmountCents: 0 })
    .where(eq(paymentEntries.id, entry.id))
    .run();
}

export function applyPaymentDebt(entry: PaymentEntry) {
  const db = getDb();
  const effect = paymentDebtEffect(entry, listDebts());
  const appliedCents = effect?.appliedCents ?? 0;
  if (effect && appliedCents !== 0) {
    db.update(debts)
      .set({
        balanceCents: sql`${debts.balanceCents} - ${appliedCents}`,
        ...(appliedCents < 0
          ? {
              principalCents: sql`MAX(${debts.principalCents}, ${debts.balanceCents} - ${appliedCents})`,
            }
          : {}),
      })
      .where(eq(debts.id, effect.debtId))
      .run();
  }
  db.update(paymentEntries)
    .set({ appliedToDebtAmountCents: appliedCents })
    .where(eq(paymentEntries.id, entry.id))
    .run();
}

export function getPaymentEntry(id: string) {
  return getDb().select().from(paymentEntries).where(eq(paymentEntries.id, id)).get();
}

export function getIncomeEntry(id: string) {
  return getDb().select().from(incomeEntries).where(eq(incomeEntries.id, id)).get();
}

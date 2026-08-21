import {
  compareInboxUrgency,
  lineUrgency,
  paymentTone,
  type InboxUrgency,
  type LineTone,
} from "@/lib/dates";
import type { Account, AccountSnapshot, Debt, IncomeEntry, PaymentEntry } from "@/db/schema";

export function totalsFor(incomes: IncomeEntry[], payments: PaymentEntry[]) {
  const incomeExpected = incomes.reduce((sum, row) => sum + row.expectedAmountCents, 0);
  const incomeReceived = incomes.reduce((sum, row) => {
    if (!row.received) return sum;
    return sum + (row.actualAmountCents ?? row.expectedAmountCents);
  }, 0);
  const incomeForLiving = incomes.reduce((sum, row) => {
    return (
      sum +
      (row.received ? (row.actualAmountCents ?? row.expectedAmountCents) : row.expectedAmountCents)
    );
  }, 0);

  const paymentExpected = payments.reduce((sum, row) => sum + row.expectedAmountCents, 0);
  const paymentActualPaid = payments.reduce((sum, row) => {
    if (!row.paid) return sum;
    return sum + (row.actualAmountCents ?? row.expectedAmountCents);
  }, 0);
  const unpaidExpected = payments.reduce((sum, row) => {
    if (row.paid) return sum;
    return sum + row.expectedAmountCents;
  }, 0);
  const remaining = paymentExpected - paymentActualPaid;
  const leftover = incomeForLiving - unpaidExpected;

  return {
    incomeExpected,
    incomeReceived,
    incomeForLiving,
    paymentExpected,
    paymentActualPaid,
    unpaidExpected,
    remaining,
    leftover,
  };
}

export type MonthLineItem = {
  id: string;
  kind: "income" | "payment";
  label: string;
  dayOfMonth: number;
  amountCents: number;
  tone: LineTone;
  accountId: string;
  accountName: string;
};

export type MonthInboxItem = MonthLineItem & {
  tone: Extract<LineTone, "overdue" | "upcoming">;
  urgency: InboxUrgency;
};

function progressPercent(done: number, total: number) {
  if (total <= 0) return 100;
  return Math.round((done / total) * 100);
}

function cashOnAssetAccounts(
  accounts: Account[],
  snapshots: AccountSnapshot[],
  incomes: IncomeEntry[],
  payments: PaymentEntry[],
) {
  const assetIds = new Set(
    accounts.filter((account) => account.type === "asset").map((account) => account.id),
  );
  const openingCents = snapshots
    .filter((snapshot) => assetIds.has(snapshot.accountId))
    .reduce((sum, snapshot) => sum + snapshot.openingBalanceCents, 0);
  const cash = totalsFor(
    incomes.filter((row) => assetIds.has(row.accountId)),
    payments.filter((row) => assetIds.has(row.accountId)),
  );
  return {
    availableNowCents: openingCents + cash.incomeReceived - cash.paymentActualPaid,
    plannedEndCents:
      openingCents + cash.incomeForLiving - cash.paymentActualPaid - cash.unpaidExpected,
  };
}

export function monthDashboard({
  incomes,
  payments,
  debts,
  accounts,
  snapshots = [],
  year,
  month,
  today = new Date(),
}: {
  incomes: IncomeEntry[];
  payments: PaymentEntry[];
  debts: Debt[];
  accounts: Account[];
  snapshots?: AccountSnapshot[];
  year: number;
  month: number;
  today?: Date;
}) {
  const totals = totalsFor(incomes, payments);
  const cash = cashOnAssetAccounts(accounts, snapshots, incomes, payments);
  const accountName = (accountId: string) =>
    accounts.find((account) => account.id === accountId)?.name ?? "Compte";

  const schedule: MonthLineItem[] = [
    ...incomes.map((row) => ({
      id: row.id,
      kind: "income" as const,
      label: row.label,
      dayOfMonth: row.dayOfMonth,
      amountCents: row.received
        ? (row.actualAmountCents ?? row.expectedAmountCents)
        : row.expectedAmountCents,
      tone: paymentTone({
        done: row.received,
        dayOfMonth: row.dayOfMonth,
        year,
        month,
        today,
      }),
      accountId: row.accountId,
      accountName: accountName(row.accountId),
    })),
    ...payments.map((row) => ({
      id: row.id,
      kind: "payment" as const,
      label: row.label,
      dayOfMonth: row.dayOfMonth,
      amountCents: row.paid
        ? (row.actualAmountCents ?? row.expectedAmountCents)
        : row.expectedAmountCents,
      tone: paymentTone({
        done: row.paid,
        dayOfMonth: row.dayOfMonth,
        year,
        month,
        today,
      }),
      accountId: row.accountId,
      accountName: accountName(row.accountId),
    })),
  ].sort((a, b) => a.dayOfMonth - b.dayOfMonth || a.label.localeCompare(b.label, "fr"));

  const incomeCount = incomes.length;
  const receivedCount = incomes.filter((row) => row.received).length;
  const paymentCount = payments.length;
  const paidCount = payments.filter((row) => row.paid).length;

  const overduePayments = schedule.filter(
    (item) => item.kind === "payment" && item.tone === "overdue",
  );
  const overdueIncomes = schedule.filter(
    (item) => item.kind === "income" && item.tone === "overdue",
  );

  const currentDay = today.getDate();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;

  const inbox = schedule
    .flatMap((item): MonthInboxItem[] => {
      if (item.kind === "income") return [];
      if (item.tone !== "overdue" && item.tone !== "upcoming") return [];
      const urgency = lineUrgency({
        done: false,
        dayOfMonth: item.dayOfMonth,
        year,
        month,
        today,
      });
      if (!urgency) return [];
      if (urgency === "upcoming" && (!isCurrentMonth || item.dayOfMonth > currentDay + 7)) {
        return [];
      }
      return [{ ...item, urgency }];
    })
    .sort((a, b) => {
      const byUrgency = compareInboxUrgency(a.urgency, b.urgency);
      if (byUrgency !== 0) return byUrgency;
      return a.dayOfMonth - b.dayOfMonth || a.label.localeCompare(b.label, "fr");
    });

  const nextPayment =
    schedule.find((item) => item.kind === "payment" && item.tone !== "paid") ?? null;

  const overduePaymentCents = overduePayments.reduce((sum, item) => sum + item.amountCents, 0);

  return {
    ...totals,
    incomeCount,
    receivedCount,
    incomeProgress: progressPercent(receivedCount, incomeCount),
    paymentCount,
    paidCount,
    paymentProgress: progressPercent(paidCount, paymentCount),
    overduePaymentCount: overduePayments.length,
    overdueIncomeCount: overdueIncomes.length,
    overduePaymentCents,
    unpaidCount: paymentCount - paidCount,
    nextPayment,
    availableNowCents: cash.availableNowCents,
    plannedEndCents: cash.plannedEndCents,
    debtTotal: debts.reduce((sum, debt) => sum + debt.balanceCents, 0),
    inbox,
    schedule,
  };
}

import { clampDayForMonth } from "@/lib/dates";
import type { Account, AccountSnapshot, IncomeEntry, PaymentEntry } from "@/db/schema";

/** Cash level that still “works”, but is worth watching. */
export const CASH_WATCH_CENTS = 10_000;

export type CashHealthStatus = "good" | "watch" | "tight";

export type MonthCashHealth = {
  status: CashHealthStatus;
  openingCents: number;
  endingCents: number;
  minCents: number;
  /** 0 = already true at month start; otherwise the calendar day it first happens. */
  firstWatchDay: number | null;
  firstNegativeDay: number | null;
};

type CashMove = {
  dayOfMonth: number;
  kind: "income" | "payment";
  deltaCents: number;
};

function postedAmount(row: {
  expectedAmountCents: number;
  actualAmountCents: number | null;
  done: boolean;
}) {
  return row.done ? (row.actualAmountCents ?? row.expectedAmountCents) : row.expectedAmountCents;
}

function kindRank(kind: CashMove["kind"]) {
  return kind === "income" ? 0 : 1;
}

export function monthCashHealth({
  accounts,
  snapshots,
  incomes,
  payments,
  year,
  month,
}: {
  accounts: Account[];
  snapshots: AccountSnapshot[];
  incomes: IncomeEntry[];
  payments: PaymentEntry[];
  year: number;
  month: number;
}): MonthCashHealth | null {
  const assetIds = new Set(
    accounts.filter((account) => account.type === "asset").map((account) => account.id),
  );
  if (assetIds.size === 0) return null;

  const openingCents = snapshots
    .filter((snapshot) => assetIds.has(snapshot.accountId))
    .reduce((sum, snapshot) => sum + snapshot.openingBalanceCents, 0);

  const moves: CashMove[] = [
    ...incomes.flatMap((row) => {
      if (!assetIds.has(row.accountId)) return [];
      return [
        {
          dayOfMonth: clampDayForMonth(row.dayOfMonth, year, month),
          kind: "income" as const,
          deltaCents: postedAmount({
            expectedAmountCents: row.expectedAmountCents,
            actualAmountCents: row.actualAmountCents,
            done: row.received,
          }),
        },
      ];
    }),
    ...payments.flatMap((row) => {
      if (!assetIds.has(row.accountId)) return [];
      return [
        {
          dayOfMonth: clampDayForMonth(row.dayOfMonth, year, month),
          kind: "payment" as const,
          deltaCents: -postedAmount({
            expectedAmountCents: row.expectedAmountCents,
            actualAmountCents: row.actualAmountCents,
            done: row.paid,
          }),
        },
      ];
    }),
  ].sort(
    (a, b) => a.dayOfMonth - b.dayOfMonth || kindRank(a.kind) - kindRank(b.kind),
  );

  let balance = openingCents;
  let minCents = openingCents;
  let firstWatchDay = openingCents < CASH_WATCH_CENTS ? 0 : null;
  let firstNegativeDay = openingCents < 0 ? 0 : null;

  for (const move of moves) {
    balance += move.deltaCents;
    if (balance < minCents) minCents = balance;
    if (firstWatchDay === null && balance < CASH_WATCH_CENTS) {
      firstWatchDay = move.dayOfMonth;
    }
    if (firstNegativeDay === null && balance < 0) {
      firstNegativeDay = move.dayOfMonth;
    }
  }

  const status: CashHealthStatus =
    firstNegativeDay !== null ? "tight" : firstWatchDay !== null ? "watch" : "good";

  return {
    status,
    openingCents,
    endingCents: balance,
    minCents,
    firstWatchDay,
    firstNegativeDay,
  };
}

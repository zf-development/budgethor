import { totalsFor } from "@/lib/totals";
import type { Account, AccountSnapshot, Debt, IncomeEntry, PaymentEntry } from "@/db/schema";

export const ACCOUNT_TYPE_LABELS = {
  asset: "Argent",
  liability: "Crédit",
} as const;

export function accountTypeDescription(type: Account["type"]) {
  if (type === "liability") {
    return "Carte ou crédit. Les achats passent ici et augmentent la dette liée. Pour rembourser, ajoute un paiement depuis un compte d’argent (ex. Banque).";
  }
  return "Banque, PayPal ou espèces. Les paies arrivent ici, les factures et virements en partent.";
}

export function accountOpeningLabel(type: Account["type"]) {
  return type === "liability" ? "Dû au 1er" : "Solde au 1er";
}

export function accountPaymentsLabel(type: Account["type"]) {
  return type === "liability" ? "Charges ce mois" : "Paiements ce mois";
}

export function accountProjectedLabel(type: Account["type"]) {
  return type === "liability" ? "Dû estimé" : "Il devrait rester";
}

export function accountOptionLabel(account: Pick<Account, "name" | "type">) {
  return `${account.name} · ${ACCOUNT_TYPE_LABELS[account.type]}`;
}

export function paymentFlowLabel({
  account,
  debt,
  debtAccount,
}: {
  account?: Pick<Account, "name"> | null;
  debt?: Pick<Debt, "creditor"> | null;
  debtAccount?: Pick<Account, "name"> | null;
}) {
  const from = account?.name?.trim();
  if (!debt) return from || "Sans compte";
  const to = debtAccount?.name?.trim() || debt.creditor.trim();
  if (from && to && from !== to) return `${from} → ${to}`;
  return to || from || "Dette";
}

export type AccountMonthStory = {
  account: Account;
  snapshot: AccountSnapshot;
  inflowsCents: number;
  outflowsCents: number;
  repaymentCents: number;
  projectedCents: number;
};

export function accountMonthStories(
  accounts: Account[],
  snapshots: AccountSnapshot[],
  incomes: IncomeEntry[],
  payments: PaymentEntry[],
  debts: Debt[] = [],
): AccountMonthStory[] {
  return accounts.flatMap((account) => {
    const snapshot = snapshots.find((row) => row.accountId === account.id);
    if (!snapshot) return [];

    const inflowsCents = totalsFor(
      incomes.filter((row) => row.accountId === account.id),
      [],
    ).incomeForLiving;
    const charges = payments.filter((row) => row.accountId === account.id);
    const paymentTotals = totalsFor([], charges);
    const outflowsCents = paymentTotals.paymentActualPaid + paymentTotals.unpaidExpected;
    const linkedDebt = debts.find((debt) => debt.accountId === account.id);
    const repayments = linkedDebt
      ? payments.filter((row) => row.debtId === linkedDebt.id && row.accountId !== account.id)
      : [];
    const repaymentTotals = totalsFor([], repayments);
    const repaymentCents = repaymentTotals.paymentActualPaid + repaymentTotals.unpaidExpected;
    const opening = snapshot.openingBalanceCents;
    const projectedCents =
      account.type === "liability"
        ? opening + outflowsCents - inflowsCents - repaymentCents
        : opening + inflowsCents - outflowsCents;

    return [
      {
        account,
        snapshot,
        inflowsCents,
        outflowsCents,
        repaymentCents,
        projectedCents,
      },
    ];
  });
}

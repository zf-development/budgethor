import type { Debt, PaymentEntry, PaymentTemplate } from "@/db/schema";
import { inclusiveCalendarMonths, nextRecurringDate, parseIsoDate } from "@/lib/dates";
import { remainingMonths } from "@/lib/money";

export function paidMonthsSince(payingSince: string, today = new Date()) {
  const from = parseIsoDate(payingSince);
  if (!from) return 0;
  return inclusiveCalendarMonths(from, today);
}

export function inferredPrincipalCents({
  balanceCents,
  monthlyPaymentCents,
  payingSince,
  today,
}: {
  balanceCents: number;
  monthlyPaymentCents: number;
  payingSince: string;
  today?: Date;
}) {
  const months = paidMonthsSince(payingSince, today);
  if (months <= 0 || monthlyPaymentCents <= 0) return balanceCents;
  return balanceCents + months * monthlyPaymentCents;
}

export function debtEffectivePrincipal(
  debt: Pick<Debt, "balanceCents" | "principalCents" | "monthlyPaymentCents" | "payingSince">,
) {
  const inferred = debt.payingSince
    ? inferredPrincipalCents({
        balanceCents: debt.balanceCents,
        monthlyPaymentCents: debt.monthlyPaymentCents,
        payingSince: debt.payingSince,
      })
    : 0;
  return Math.max(debt.principalCents, inferred, debt.balanceCents);
}

export function debtProgressPercent(balanceCents: number, principalCents: number) {
  if (balanceCents <= 0) return 100;
  if (principalCents <= 0) return 0;
  const paid = Math.max(0, principalCents - balanceCents);
  return Math.min(100, Math.round((paid / principalCents) * 100));
}

export function formatMonthCount(months: number | null, estimated = false) {
  if (months === null) return null;
  if (months === 0) return "Soldée";
  const base = months === 1 ? "1 mois" : `${months} mois`;
  if (!estimated) return base;
  return months === 1 ? `${base} estimé` : `${base} estimés`;
}

export function debtNextStep(
  debt: Pick<Debt, "balanceCents" | "monthlyPaymentCents" | "dayOfMonth">,
  today = new Date(),
) {
  if (debt.balanceCents <= 0 || debt.monthlyPaymentCents <= 0) return null;
  const amountCents = Math.min(debt.monthlyPaymentCents, debt.balanceCents);
  return {
    amountCents,
    remainingAfterCents: Math.max(0, debt.balanceCents - amountCents),
    ...nextRecurringDate(debt.dayOfMonth, today),
  };
}

export function debtsPayoffSummary(debts: Pick<Debt, "balanceCents" | "monthlyPaymentCents">[]) {
  const balanceCents = debts.reduce((sum, debt) => sum + debt.balanceCents, 0);
  const monthlyPaymentCents = debts.reduce((sum, debt) => sum + debt.monthlyPaymentCents, 0);
  return {
    balanceCents,
    monthlyPaymentCents,
    estimatedMonths: remainingMonths(balanceCents, monthlyPaymentCents),
  };
}

export function nextPrincipalCents(currentPrincipalCents: number, nextBalanceCents: number) {
  return Math.max(currentPrincipalCents, nextBalanceCents);
}

export function debtPaymentLabel(creditor: string) {
  const name = creditor.trim();
  return name || "Mensualité";
}

export function isDebtManagedPayment(template: Pick<PaymentTemplate, "fromDebt">) {
  return Boolean(template.fromDebt);
}

export function debtForAccount(debts: Debt[], accountId: string) {
  return debts.find((debt) => debt.accountId === accountId) ?? null;
}

export function isCreditChargePayment(
  entry: Pick<PaymentEntry, "accountId" | "debtId">,
  debts: Debt[],
) {
  const linked = debtForAccount(debts, entry.accountId);
  if (!linked) return false;
  return entry.debtId !== linked.id;
}

function paidAmountCents(
  entry: Pick<PaymentEntry, "actualAmountCents" | "expectedAmountCents" | "paid">,
) {
  if (!entry.paid) return 0;
  return entry.actualAmountCents ?? entry.expectedAmountCents;
}

/**
 * Positive `appliedCents` is subtracted from the debt (repayment).
 * Negative `appliedCents` is added (charge on the linked credit account).
 */
export function paymentDebtEffect(
  entry: Pick<PaymentEntry, "accountId" | "debtId" | "paid" | "actualAmountCents" | "expectedAmountCents">,
  debts: Debt[],
): { debtId: string; appliedCents: number } | null {
  const amount = paidAmountCents(entry);
  const chargeDebt = debtForAccount(debts, entry.accountId);
  if (chargeDebt && entry.debtId !== chargeDebt.id) {
    return { debtId: chargeDebt.id, appliedCents: -amount };
  }
  if (entry.debtId) {
    return { debtId: entry.debtId, appliedCents: amount };
  }
  return null;
}

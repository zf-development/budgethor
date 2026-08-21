import { Callout } from "@/components/callout";
import { MoneyText } from "@/components/money-text";
import { formatDayMonthLong } from "@/lib/dates";
import { debtNextStep } from "@/lib/debts";
import type { Debt } from "@/db/schema";

type DebtNextStepFields = Pick<Debt, "balanceCents" | "monthlyPaymentCents" | "dayOfMonth">;

export function DebtNextStep({
  debt,
  compact = false,
}: {
  debt: DebtNextStepFields;
  compact?: boolean;
}) {
  const next = debtNextStep(debt);
  if (!next) return null;

  const dateLabel = formatDayMonthLong(next.year, next.month, next.dayOfMonth);
  const paymentLabel = (
    <>
      <MoneyText cents={next.amountCents} /> · {dateLabel}
    </>
  );

  if (compact) {
    return <p className="text-muted-foreground tabular-nums">{paymentLabel}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <Callout title="Prochain paiement">{paymentLabel}</Callout>
      <Callout>
        Après ce paiement : <MoneyText cents={next.remainingAfterCents} /> restant
      </Callout>
    </div>
  );
}

import { MoneyText } from "@/components/money-text";
import { DebtNextStep } from "@/components/debt-next-step";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import {
  debtEffectivePrincipal,
  debtProgressPercent,
  formatMonthCount,
} from "@/lib/debts";
import { remainingMonths } from "@/lib/money";
import type { Debt } from "@/db/schema";

type DebtProgressFields = Pick<
  Debt,
  "balanceCents" | "principalCents" | "monthlyPaymentCents" | "payingSince"
>;

function progressFor(debt: DebtProgressFields) {
  const months = remainingMonths(debt.balanceCents, debt.monthlyPaymentCents);
  const principal = debtEffectivePrincipal(debt);
  return {
    label: formatMonthCount(months, true) ?? "Sans mensualité",
    percent: debtProgressPercent(debt.balanceCents, principal),
  };
}

export function DebtProgress({
  debt,
  compact = false,
}: {
  debt: DebtProgressFields;
  compact?: boolean;
}) {
  const { label, percent } = progressFor(debt);

  return (
    <Progress
      value={percent}
      className={compact ? "gap-1 [&_[data-slot=progress-track]]:h-1.5" : undefined}
    >
      <ProgressLabel className={compact ? "font-normal text-muted-foreground" : undefined}>
        {label}
      </ProgressLabel>
    </Progress>
  );
}

export function DebtProgressRow({
  label,
  balanceCents,
  principalCents,
  monthlyPaymentCents,
  payingSince = "",
  dayOfMonth,
  compact = false,
}: {
  label: string;
  balanceCents: number;
  principalCents: number;
  monthlyPaymentCents: number;
  payingSince?: string;
  dayOfMonth?: number;
  compact?: boolean;
}) {
  const { label: timeLabel, percent } = progressFor({
    balanceCents,
    principalCents,
    monthlyPaymentCents,
    payingSince,
  });

  return (
    <div className={compact ? "flex flex-col gap-1" : "flex flex-col gap-2"}>
      <div className="flex items-center justify-between gap-3">
        <span className="truncate">{label}</span>
        <MoneyText cents={balanceCents} />
      </div>
      <Progress
        value={percent}
        className={compact ? "gap-0 [&_[data-slot=progress-track]]:h-1.5" : undefined}
      >
        {compact ? null : <ProgressLabel>{timeLabel}</ProgressLabel>}
      </Progress>
      {dayOfMonth != null ? (
        <DebtNextStep
          compact={compact}
          debt={{ balanceCents, monthlyPaymentCents, dayOfMonth }}
        />
      ) : null}
    </div>
  );
}

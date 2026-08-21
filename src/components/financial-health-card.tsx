import { HeartPulseIcon } from "@/components/icons";
import { StatCard } from "@/components/stat-card";
import { formatDayMonthLong } from "@/lib/dates";
import {
  CASH_WATCH_CENTS,
  type CashHealthStatus,
  type MonthCashHealth,
} from "@/lib/financial-health";
import { formatCadCompact } from "@/lib/money";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<CashHealthStatus, string> = {
  good: "Bonne",
  watch: "À surveiller",
  tight: "Serrée",
};

function healthMessage(health: MonthCashHealth, year: number, month: number) {
  const watchAmount = formatCadCompact(CASH_WATCH_CENTS);

  if (health.status === "good") {
    return "Votre solde devrait rester positif ce mois-ci.";
  }

  if (health.status === "tight") {
    if (health.firstNegativeDay === 0) {
      return "Votre solde prévu est déjà négatif.";
    }
    if (health.firstNegativeDay != null) {
      return `Votre solde prévu devient négatif le ${formatDayMonthLong(year, month, health.firstNegativeDay)}.`;
    }
  }

  if (health.firstWatchDay === 0) {
    return `Votre solde prévu est déjà sous ${watchAmount}.`;
  }

  if (health.firstWatchDay != null) {
    return `Votre solde prévu descend sous ${watchAmount} le ${formatDayMonthLong(year, month, health.firstWatchDay)}.`;
  }

  return "Votre solde prévu reste à surveiller ce mois-ci.";
}

export function FinancialHealthCard({
  health,
  year,
  month,
}: {
  health: MonthCashHealth;
  year: number;
  month: number;
}) {
  return (
    <StatCard
      label="Situation financière"
      icon={HeartPulseIcon}
      value={
        <span className={cn(health.status === "tight" && "text-destructive")}>
          {STATUS_LABEL[health.status]}
        </span>
      }
      hint={healthMessage(health, year, month)}
    />
  );
}

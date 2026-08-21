import { CalendarDaysIcon, HandCoinsIcon, WalletIcon } from "@/components/icons";

import { MoneyText } from "@/components/money-text";
import { StatCard } from "@/components/stat-card";
import { debtsPayoffSummary, formatMonthCount } from "@/lib/debts";
import type { Debt } from "@/db/schema";

export function DebtPayoffSummary({ debts }: { debts: Debt[] }) {
  if (debts.length === 0) return null;

  const summary = debtsPayoffSummary(debts);
  const duration = formatMonthCount(summary.estimatedMonths) ?? "—";

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard
        label="Dette totale"
        icon={HandCoinsIcon}
        value={<MoneyText cents={summary.balanceCents} />}
      />
      <StatCard
        label="Paiements"
        icon={WalletIcon}
        value={
          <>
            <MoneyText cents={summary.monthlyPaymentCents} /> / mois
          </>
        }
      />
      <StatCard
        label="Durée estimée"
        icon={CalendarDaysIcon}
        value={duration}
        hint="Jusqu’à la dernière dette, sans rediriger les mensualités."
      />
    </div>
  );
}

import Link from "next/link";
import { WalletIcon, ReceiptIcon } from "@/components/icons";

import { DebtProgressRow } from "@/components/debt-progress";
import { MoneyText } from "@/components/money-text";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { StatCard } from "@/components/stat-card";
import { MoneyFlowRow, SummaryRow } from "@/components/summary-row";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Debt } from "@/db/schema";
import { daysInMonth, formatLineDate } from "@/lib/dates";
import { debtsPayoffSummary } from "@/lib/debts";
import type { monthDashboard } from "@/lib/totals";

function paymentCountLabel(count: number) {
  return count === 1 ? "1 paiement" : `${count} paiements`;
}

export function DashboardKpis({
  stats,
  debts,
  year,
  month,
}: {
  stats: ReturnType<typeof monthDashboard>;
  debts: Debt[];
  year: number;
  month: number;
}) {
  const monthEndLabel = formatLineDate(year, month, daysInMonth(year, month));
  const leftoverBadge =
    stats.plannedEndCents < 0 ? (
      <Badge variant="destructive">Déficit</Badge>
    ) : (
      <Badge variant="secondary">Disponible</Badge>
    );
  const rankedDebts = [...debts].sort((a, b) => b.balanceCents - a.balanceCents);
  const previewDebts = rankedDebts.slice(0, 3);
  const extraDebtCount = rankedDebts.length - previewDebts.length;
  const payoff = debtsPayoffSummary(debts);

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <StatCard
        className="lg:col-span-2"
        label={`Après les paiements prévus · ${monthEndLabel}`}
        icon={WalletIcon}
        badge={leftoverBadge}
        dominant
        value={<MoneyText cents={stats.plannedEndCents} />}
        hint="C’est l’argent restant une fois les paies encore à recevoir et les paiements encore dus pris en compte. Les cartes de crédit sont dans tes comptes, plus bas."
      >
        <div className="flex flex-col gap-2">
          <MoneyFlowRow label="Disponible maintenant" cents={stats.availableNowCents} />
          <MoneyFlowRow
            label="Revenus"
            cents={stats.incomeForLiving}
            prefix="+"
            trailing={
              <span className="text-muted-foreground">
                {stats.receivedCount} / {stats.incomeCount} reçues
              </span>
            }
          />
          <MoneyFlowRow
            label="Paiements"
            cents={stats.paymentExpected}
            prefix="−"
            trailing={
              <span className="text-muted-foreground">
                {stats.paidCount} / {stats.paymentCount} payés
              </span>
            }
          />
        </div>
        {stats.unpaidCount > 0 || stats.nextPayment ? (
          <>
            <Separator />
            <div className="flex flex-col gap-2">
              {stats.unpaidCount > 0 ? (
                <SummaryRow label="À payer">
                  <MoneyText cents={stats.unpaidExpected} />
                  {" · "}
                  {paymentCountLabel(stats.unpaidCount)}
                </SummaryRow>
              ) : null}
              {stats.nextPayment ? (
                <SummaryRow label="Prochaine échéance">
                  <span className="inline-flex max-w-full flex-wrap items-center justify-end gap-2">
                    <PaymentStatusBadge tone={stats.nextPayment.tone} />
                    <span>
                      {formatLineDate(year, month, stats.nextPayment.dayOfMonth)} ·{" "}
                      {stats.nextPayment.label} — <MoneyText cents={stats.nextPayment.amountCents} />
                    </span>
                  </span>
                </SummaryRow>
              ) : null}
            </div>
          </>
        ) : null}
      </StatCard>
      <StatCard
        label="Dettes"
        icon={ReceiptIcon}
        badge={
          <Badge render={<Link href="/debts" />} variant="outline">
            Gérer
          </Badge>
        }
        value={<MoneyText cents={stats.debtTotal} />}
        hint={
          rankedDebts.length > 0
            ? undefined
            : "Ajoute un prêt ou une carte pour suivre les soldes ici."
        }
        footer={
          payoff.monthlyPaymentCents > 0 ? (
            <MoneyFlowRow label="Mensualités" cents={payoff.monthlyPaymentCents} />
          ) : null
        }
      >
        {previewDebts.length > 0 ? (
          <>
            <div className="flex flex-col gap-2">
              {previewDebts.map((debt) => (
                <DebtProgressRow
                  key={debt.id}
                  compact
                  label={debt.creditor}
                  balanceCents={debt.balanceCents}
                  principalCents={debt.principalCents}
                  monthlyPaymentCents={debt.monthlyPaymentCents}
                  payingSince={debt.payingSince}
                  dayOfMonth={debt.dayOfMonth}
                />
              ))}
            </div>
            {extraDebtCount > 0 ? (
              <p className="text-muted-foreground">
                {extraDebtCount === 1
                  ? "et 1 autre dette"
                  : `et ${extraDebtCount} autres dettes`}
              </p>
            ) : null}
          </>
        ) : null}
      </StatCard>
    </div>
  );
}

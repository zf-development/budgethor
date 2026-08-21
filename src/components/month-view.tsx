import { AccountMonthCards } from "@/components/account-month-cards";
import { DashboardKpis } from "@/components/dashboard-kpis";
import { HistoryMonthEmpty } from "@/components/history-month-dialog";
import { MonthHeader } from "@/components/month-header";
import { MonthInbox } from "@/components/month-inbox";
import { MonthWorkspace } from "@/components/month-workspace";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { monthDashboard } from "@/lib/totals";
import type { Account, AccountSnapshot, Debt, IncomeEntry, PaymentEntry } from "@/db/schema";
import { currentYearMonth, isPastYearMonth, type YearMonth } from "@/lib/dates";
import { BadgeAlertIcon, CircleHelpIcon } from "@/components/icons";

export function MissingMonthView({
  year,
  month,
  knownMonths,
}: {
  year: number;
  month: number;
  knownMonths: YearMonth[];
}) {
  return (
    <div className="flex flex-col gap-8">
      <MonthHeader year={year} month={month} knownMonths={knownMonths} />
      <HistoryMonthEmpty year={year} month={month} />
    </div>
  );
}

export function MonthView({
  year,
  month,
  monthId,
  accounts,
  snapshots,
  incomes,
  payments,
  debts,
  debtPaymentTemplateIds,
  knownMonths,
  historyMode = false,
}: {
  year: number;
  month: number;
  monthId: string;
  accounts: Account[];
  snapshots: AccountSnapshot[];
  incomes: IncomeEntry[];
  payments: PaymentEntry[];
  debts: Debt[];
  debtPaymentTemplateIds: string[];
  knownMonths: YearMonth[];
  historyMode?: boolean;
}) {
  const stats = monthDashboard({
    incomes,
    payments,
    debts,
    accounts,
    snapshots,
    year,
    month,
  });
  const overdueLabel =
    stats.overduePaymentCount === 1
      ? "1 paiement en retard"
      : `${stats.overduePaymentCount} paiements en retard`;

  return (
    <div className="flex flex-col gap-8">
      <MonthHeader year={year} month={month} knownMonths={knownMonths} />
      {isPastYearMonth({ year, month }, currentYearMonth()) ? (
        <Alert>
          <CircleHelpIcon size={16} />
          <AlertTitle>
            {historyMode ? "Mois d’historique généré" : "Mois d’historique"}
          </AlertTitle>
          <AlertDescription>
            Vérifie les soldes au 1er, puis coche les paies reçues et les paiements vraiment faits
            ce mois-là.
          </AlertDescription>
        </Alert>
      ) : null}
      {stats.overduePaymentCount > 0 ? (
        <Alert variant="destructive">
          <BadgeAlertIcon />
          <AlertTitle>{overdueLabel}</AlertTitle>
          <AlertDescription>
            Consulte « <a href="#a-traiter">À traiter</a> » pour les régulariser.
          </AlertDescription>
        </Alert>
      ) : null}
      <DashboardKpis stats={stats} debts={debts} year={year} month={month} />
      <MonthInbox items={stats.inbox} year={year} month={month} accounts={accounts} />
      <AccountMonthCards
        year={year}
        month={month}
        accounts={accounts}
        snapshots={snapshots}
        incomes={incomes}
        payments={payments}
        debts={debts}
      />
      <MonthWorkspace
        monthId={monthId}
        year={year}
        month={month}
        accounts={accounts}
        incomes={incomes}
        payments={payments}
        debts={debts}
        lockedTemplateIds={debtPaymentTemplateIds}
      />
    </div>
  );
}

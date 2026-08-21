import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { MissingMonthView, MonthView } from "@/components/month-view";
import { getMonthView, getSettings, listYearMonths } from "@/db/queries";
import {
  currentYearMonth,
  isBeyondVisibleFuture,
  isValidYearMonth,
  maxVisibleYearMonth,
  monthPath,
} from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  const settings = getSettings();
  if (!settings.onboardingCompleted) redirect("/onboarding");

  const params = await searchParams;
  const now = currentYearMonth();
  const year = Number(params.year) || now.year;
  const month = Number(params.month) || now.month;

  if (!isValidYearMonth(year, month)) redirect("/");
  if (isBeyondVisibleFuture({ year, month }, now)) {
    const max = maxVisibleYearMonth(now);
    redirect(monthPath(max.year, max.month));
  }
  const data = getMonthView(year, month);
  const knownMonths = listYearMonths();

  if (!data) {
    return (
      <AppShell>
        <MissingMonthView year={year} month={month} knownMonths={knownMonths} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <MonthView
        year={year}
        month={month}
        monthId={data.month.id}
        accounts={data.accounts}
        snapshots={data.snapshots}
        incomes={data.incomes}
        payments={data.payments}
        debts={data.debts}
        debtPaymentTemplateIds={data.debtPaymentTemplateIds}
        knownMonths={knownMonths}
        historyMode={params.history === "1"}
      />
    </AppShell>
  );
}

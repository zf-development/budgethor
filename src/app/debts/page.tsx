import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DebtPayoffSummary } from "@/components/debt-payoff-summary";
import { DebtTable } from "@/components/debt-table";
import { PageHeader } from "@/components/page-header";
import { getSettings, listAccounts, listDebts } from "@/db/queries";

export const dynamic = "force-dynamic";

export default function DebtsPage() {
  const settings = getSettings();
  if (!settings.onboardingCompleted) redirect("/onboarding");
  const debts = listDebts();
  const accounts = listAccounts();

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Dettes"
          description="Suivi des soldes, des mensualités et du temps restant avant d’être à jour."
        />
        <DebtPayoffSummary debts={debts} />
        <DebtTable debts={debts} accounts={accounts} />
      </div>
    </AppShell>
  );
}

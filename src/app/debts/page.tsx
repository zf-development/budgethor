import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DebtsWorkspace } from "@/components/debts-workspace";
import { getDebtPayoffPlan, getSettings, listAccounts, listDebts } from "@/db/queries";

export const dynamic = "force-dynamic";

export default function DebtsPage() {
  const settings = getSettings();
  if (!settings.onboardingCompleted) redirect("/onboarding");
  const debts = listDebts();
  const accounts = listAccounts();
  const { plan, drops } = getDebtPayoffPlan();

  return (
    <AppShell>
      <DebtsWorkspace debts={debts} accounts={accounts} plan={plan} drops={drops} />
    </AppShell>
  );
}

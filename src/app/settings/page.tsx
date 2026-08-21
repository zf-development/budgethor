import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SettingsView } from "@/components/settings-view";
import {
  getSettings,
  listAccounts,
  listDebts,
  listIncomeTemplates,
  listPaymentTemplates,
  syncDebtPaymentTemplates,
} from "@/db/queries";
import { sqliteFilePath } from "@/db";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const settings = getSettings();
  if (!settings.onboardingCompleted) redirect("/onboarding");
  syncDebtPaymentTemplates();

  return (
    <AppShell>
      <SettingsView
        accounts={listAccounts()}
        incomeTemplates={listIncomeTemplates()}
        paymentTemplates={listPaymentTemplates()}
        debts={listDebts()}
        sqlitePath={sqliteFilePath()}
      />
    </AppShell>
  );
}

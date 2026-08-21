"use client";

import { useState } from "react";

import { DebtPayoffSummary } from "@/components/debt-payoff-summary";
import { DebtPlanBoard } from "@/components/debt-plan-board";
import { DebtTable } from "@/components/debt-table";
import { PageHeader } from "@/components/page-header";
import { Toggle } from "@/components/ui/toggle";
import type { Account, Debt, DebtPayoffDrop, DebtPayoffPlan } from "@/db/schema";

export function DebtsWorkspace({
  debts,
  accounts,
  plan,
  drops,
}: {
  debts: Debt[];
  accounts: Account[];
  plan: DebtPayoffPlan;
  drops: DebtPayoffDrop[];
}) {
  const [simulation, setSimulation] = useState(false);
  const canSimulate = debts.some((debt) => debt.balanceCents > 0);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dettes"
        description={
          simulation
            ? "Simulation enregistrée : drops, redirections et temps gagné. Tes soldes réels ne changent pas."
            : "Suivi des soldes, des mensualités et du temps restant avant d’être à jour."
        }
      >
        {canSimulate ? (
          <Toggle
            variant="outline"
            pressed={simulation}
            onPressedChange={setSimulation}
            aria-label="Afficher la simulation"
          >
            Simulation
          </Toggle>
        ) : null}
      </PageHeader>
      <DebtPayoffSummary debts={debts} />
      {simulation ? <DebtPlanBoard debts={debts} plan={plan} drops={drops} /> : null}
      <DebtTable debts={debts} accounts={accounts} />
    </div>
  );
}

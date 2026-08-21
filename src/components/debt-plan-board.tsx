"use client";

import { useMemo, useTransition } from "react";
import { CalendarDaysIcon, HandCoinsIcon, WalletIcon } from "@/components/icons";

import { updateDebtPayoffPlan, upsertDebtPayoffDrop } from "@/actions/budget";
import { DebtPlanPhaseTable } from "@/components/debt-plan-phase-table";
import { MoneyText } from "@/components/money-text";
import { SpreadsheetInput } from "@/components/spreadsheet-input";
import { StatCard } from "@/components/stat-card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Debt, DebtPayoffDrop, DebtPayoffPlan } from "@/db/schema";
import { DEBT_STRATEGIES, type DebtOptimizeStrategy } from "@/lib/debt-optimize";
import { evaluateDebtPlan } from "@/lib/debt-plan";
import { formatMonthCount } from "@/lib/debts";
import { parseMoneyToCents } from "@/lib/money";

function isStrategy(value: string | undefined): value is DebtOptimizeStrategy {
  return value === "avalanche" || value === "snowball";
}

function savedCopy(timing: { monthsSaved: number | null; paidOff: boolean; currentMonths: number | null }) {
  if (!timing.paidOff) return "Trop long à estimer avec ces paiements.";
  if (timing.currentMonths === null) return "Ajoute une mensualité à chaque dette pour comparer.";
  if (timing.monthsSaved === null) return "—";
  if (timing.monthsSaved === 0) return "Même durée qu’aujourd’hui.";
  const label = formatMonthCount(timing.monthsSaved);
  if (!label) return "—";
  return `${label} plus tôt`;
}

export function DebtPlanBoard({
  debts,
  plan,
  drops,
}: {
  debts: Debt[];
  plan: DebtPayoffPlan;
  drops: DebtPayoffDrop[];
}) {
  const [, startTransition] = useTransition();
  const view = useMemo(
    () =>
      evaluateDebtPlan(debts, {
        strategy: plan.strategy,
        extraMonthlyCents: plan.extraMonthlyCents,
        drops: drops.map((drop) => ({
          debtId: drop.debtId,
          amountCents: drop.amountCents,
          redirectDebtId: drop.redirectDebtId,
        })),
      }),
    [debts, drops, plan.extraMonthlyCents, plan.strategy],
  );

  if (debts.every((debt) => debt.balanceCents <= 0)) return null;

  const selected = view.estimate?.plans[plan.strategy] ?? null;
  const timing = view.timing;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-xl tracking-tight">Plan de remboursement</h2>
          <p className="text-muted-foreground text-sm">
            Teste un drop, vois le paiement libéré, et redirige-le. Le plan reste enregistré ici.
          </p>
        </div>

        <FieldGroup className="gap-4 sm:flex-row sm:items-end">
          <Field>
            <FieldLabel>Stratégie</FieldLabel>
            <ToggleGroup
              variant="outline"
              spacing={0}
              className="w-full sm:w-auto"
              value={[plan.strategy]}
              onValueChange={(next) => {
                const value = next[0];
                if (!isStrategy(value)) return;
                startTransition(() => {
                  void updateDebtPayoffPlan({ strategy: value });
                });
              }}
            >
              {(Object.keys(DEBT_STRATEGIES) as DebtOptimizeStrategy[]).map((key) => (
                <ToggleGroupItem key={key} value={key} className="flex-1">
                  {DEBT_STRATEGIES[key].label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          <Field className="sm:max-w-48">
            <FieldLabel htmlFor="debt-plan-extra">Extra / mois</FieldLabel>
            <SpreadsheetInput
              appearance="field"
              id="debt-plan-extra"
              ariaLabel="Montant extra par mois"
              suffix="CAD"
              inputMode="decimal"
              value={String(plan.extraMonthlyCents / 100)}
              onCommit={(next) => {
                const cents = parseMoneyToCents(next);
                if (cents === null) return;
                startTransition(() => {
                  void updateDebtPayoffPlan({ extraMonthlyCents: cents });
                });
              }}
            />
          </Field>
        </FieldGroup>
        <p className="text-muted-foreground text-sm">{DEBT_STRATEGIES[plan.strategy].summary}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Sans redirection"
          icon={CalendarDaysIcon}
          value={formatMonthCount(timing.currentMonths) ?? "—"}
          hint="Temps jusqu’à la dernière dette, en gardant chaque mensualité telle quelle."
        />
        <StatCard
          label="Avec ce plan"
          icon={HandCoinsIcon}
          value={
            timing.paidOff ? (formatMonthCount(timing.planMonths) ?? "—") : "Trop long à estimer"
          }
          hint="Même calcul, avec tes drops et les paiements redirigés."
        />
        <StatCard
          label="Temps gagné"
          icon={WalletIcon}
          value={savedCopy(timing)}
          hint={
            selected && selected.interestSavedCents > 0 ? (
              <>
                Économie d’intérêts estimée : ~<MoneyText cents={selected.interestSavedCents} />
              </>
            ) : (
              "Les mois restants dans les tableaux sont à ce paiement, pas la durée totale."
            )
          }
        />
      </div>

      {view.phases.map((phase) => (
        <DebtPlanPhaseTable
          key={phase.key}
          phase={phase}
          debts={debts}
          onDropChange={
            phase.isStart
              ? (input) => {
                  startTransition(() => {
                    void upsertDebtPayoffDrop(input);
                  });
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}

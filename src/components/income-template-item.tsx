"use client";

import { useTransition } from "react";

import { deleteIncomeTemplate, updateIncomeTemplate } from "@/actions/budget";
import { DeleteRowButton } from "@/components/delete-row-button";
import {
  IncomeTemplateFields,
  type IncomeTemplateValues,
} from "@/components/income-template-fields";
import { MoneyText } from "@/components/money-text";
import { RecurringBadge, RecurringRow } from "@/components/recurring-list";
import { formatMonthlyCadence, parseIsoDate } from "@/lib/dates";
import { INCOME_CADENCES, isIncomeCadence } from "@/lib/income";
import { parseMoneyToCents } from "@/lib/money";
import type { Account, IncomeTemplate } from "@/db/schema";

function incomeSummary(template: IncomeTemplate) {
  const cadence = isIncomeCadence(template.cadence) ? template.cadence : "month";
  if (cadence === "month") {
    const next = parseIsoDate(template.nextPayDate);
    return next ? formatMonthlyCadence(next.getDate()) : INCOME_CADENCES.month;
  }
  return INCOME_CADENCES[cadence];
}

function templateValues(template: IncomeTemplate): IncomeTemplateValues {
  return {
    label: template.label,
    accountId: template.accountId,
    cadence: isIncomeCadence(template.cadence) ? template.cadence : "month",
    nextPayDate: template.nextPayDate,
    amountInput: String(template.expectedAmountCents / 100),
    notes: template.notes,
  };
}

export function IncomeTemplateItem({
  template,
  accounts,
}: {
  template: IncomeTemplate;
  accounts: Account[];
}) {
  const [, startTransition] = useTransition();
  const account = accounts.find((row) => row.id === template.accountId);

  function commit(patch: Partial<IncomeTemplateValues>) {
    const next: Parameters<typeof updateIncomeTemplate>[1] = {};
    if (patch.label !== undefined) next.label = patch.label;
    if (patch.accountId !== undefined) next.accountId = patch.accountId;
    if (patch.cadence !== undefined) next.cadence = patch.cadence;
    if (patch.nextPayDate !== undefined) next.nextPayDate = patch.nextPayDate;
    if (patch.notes !== undefined) next.notes = patch.notes;
    if (patch.amountInput !== undefined) {
      const cents = parseMoneyToCents(patch.amountInput);
      if (cents === null) return;
      next.expectedAmountCents = cents;
    }
    if (Object.keys(next).length === 0) return;
    startTransition(() => {
      void updateIncomeTemplate(template.id, next);
    });
  }

  return (
    <RecurringRow
      title={template.label}
      summary={incomeSummary(template)}
      value={<MoneyText cents={template.expectedAmountCents} />}
      badges={account ? <RecurringBadge>{account.name}</RecurringBadge> : null}
    >
      <IncomeTemplateFields
        idPrefix={`income-${template.id}`}
        accounts={accounts}
        values={templateValues(template)}
        onChange={commit}
      />
      <DeleteRowButton
        appearance="label"
        title={`Supprimer « ${template.label} » ?`}
        description="Cette paie ne remplira plus les mois suivants. Les lignes déjà créées restent."
        onClick={() => {
          startTransition(() => {
            void deleteIncomeTemplate(template.id);
          });
        }}
      />
    </RecurringRow>
  );
}

"use client";

import { useTransition } from "react";

import { deleteIncomeTemplate, updateIncomeTemplate } from "@/actions/budget";
import { AccountSelect } from "@/components/account-select";
import { CadenceSelect } from "@/components/cadence-select";
import { DatePicker } from "@/components/date-picker";
import { DeleteRowButton } from "@/components/delete-row-button";
import { MoneyText } from "@/components/money-text";
import { RecurringBadge, RecurringRow } from "@/components/recurring-list";
import { SpreadsheetInput } from "@/components/spreadsheet-input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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

export function IncomeTemplateItem({
  template,
  accounts,
}: {
  template: IncomeTemplate;
  accounts: Account[];
}) {
  const [, startTransition] = useTransition();
  const account = accounts.find((row) => row.id === template.accountId);

  return (
    <RecurringRow
      title={template.label}
      summary={incomeSummary(template)}
      value={<MoneyText cents={template.expectedAmountCents} />}
      badges={account ? <RecurringBadge>{account.name}</RecurringBadge> : null}
    >
      <FieldGroup className="gap-3 sm:grid sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`income-label-${template.id}`}>Libellé</FieldLabel>
          <SpreadsheetInput
            appearance="field"
            id={`income-label-${template.id}`}
            ariaLabel="Libellé"
            value={template.label}
            onCommit={(label) => {
              startTransition(() => {
                void updateIncomeTemplate(template.id, { label });
              });
            }}
          />
        </Field>
        <Field>
          <FieldLabel>Compte</FieldLabel>
          <AccountSelect
            appearance="field"
            ariaLabel="Compte"
            accounts={accounts}
            className="max-w-none"
            value={template.accountId}
            onChange={(accountId) => {
              startTransition(() => {
                void updateIncomeTemplate(template.id, { accountId });
              });
            }}
          />
        </Field>
        <Field>
          <FieldLabel>Répétition</FieldLabel>
          <CadenceSelect
            ariaLabel="Répétition"
            value={isIncomeCadence(template.cadence) ? template.cadence : "month"}
            onChange={(cadence) => {
              startTransition(() => {
                void updateIncomeTemplate(template.id, { cadence });
              });
            }}
          />
        </Field>
        <Field>
          <FieldLabel>Prochaine paie</FieldLabel>
          <DatePicker
            ariaLabel="Prochaine paie"
            value={template.nextPayDate}
            onChange={(nextPayDate) => {
              startTransition(() => {
                void updateIncomeTemplate(template.id, { nextPayDate });
              });
            }}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`income-amount-${template.id}`}>Montant prévu</FieldLabel>
          <SpreadsheetInput
            appearance="field"
            id={`income-amount-${template.id}`}
            ariaLabel="Montant prévu"
            suffix="CAD"
            inputMode="decimal"
            value={String(template.expectedAmountCents / 100)}
            onCommit={(next) => {
              const cents = parseMoneyToCents(next);
              if (cents === null) return;
              startTransition(() => {
                void updateIncomeTemplate(template.id, { expectedAmountCents: cents });
              });
            }}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`income-notes-${template.id}`}>Notes</FieldLabel>
          <SpreadsheetInput
            appearance="field"
            id={`income-notes-${template.id}`}
            ariaLabel="Notes"
            value={template.notes}
            onCommit={(notes) => {
              startTransition(() => {
                void updateIncomeTemplate(template.id, { notes });
              });
            }}
          />
        </Field>
        <Field className="sm:col-span-2 sm:items-end">
          <DeleteRowButton
            title={`Supprimer « ${template.label} » ?`}
            description="Ce modèle ne remplira plus les mois suivants. Les lignes déjà créées restent."
            onClick={() => {
              startTransition(() => {
                void deleteIncomeTemplate(template.id);
              });
            }}
          />
        </Field>
      </FieldGroup>
    </RecurringRow>
  );
}

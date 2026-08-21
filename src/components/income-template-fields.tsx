"use client";

import { AccountSelect } from "@/components/account-select";
import { CadenceSelect } from "@/components/cadence-select";
import { DatePicker } from "@/components/date-picker";
import { RecurringFields } from "@/components/recurring-list";
import { SpreadsheetInput } from "@/components/spreadsheet-input";
import { Field, FieldLabel } from "@/components/ui/field";
import { isIncomeCadence, type IncomeCadence } from "@/lib/income";
import type { Account } from "@/db/schema";

export type IncomeTemplateValues = {
  label: string;
  accountId: string;
  cadence: IncomeCadence;
  nextPayDate: string;
  amountInput: string;
  notes: string;
};

export function IncomeTemplateFields({
  idPrefix,
  accounts,
  values,
  onChange,
  commitOnChange = false,
}: {
  idPrefix: string;
  accounts: Account[];
  values: IncomeTemplateValues;
  onChange: (patch: Partial<IncomeTemplateValues>) => void;
  commitOnChange?: boolean;
}) {
  return (
    <RecurringFields>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-label`}>Libellé</FieldLabel>
        <SpreadsheetInput
          appearance="field"
          id={`${idPrefix}-label`}
          ariaLabel="Libellé"
          placeholder="Paie"
          autoFocus={commitOnChange}
          commitOnChange={commitOnChange}
          value={values.label}
          onCommit={(label) => onChange({ label })}
        />
      </Field>
      <Field>
        <FieldLabel>Compte</FieldLabel>
        <AccountSelect
          appearance="field"
          ariaLabel="Compte"
          accounts={accounts}
          className="max-w-none"
          value={values.accountId}
          onChange={(accountId) => onChange({ accountId })}
        />
      </Field>
      <Field>
        <FieldLabel>Répétition</FieldLabel>
        <CadenceSelect
          ariaLabel="Répétition"
          value={isIncomeCadence(values.cadence) ? values.cadence : "month"}
          onChange={(cadence) => onChange({ cadence })}
        />
      </Field>
      <Field>
        <FieldLabel>Prochaine paie</FieldLabel>
        <DatePicker
          ariaLabel="Prochaine paie"
          value={values.nextPayDate}
          onChange={(nextPayDate) => onChange({ nextPayDate })}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-amount`}>Montant prévu</FieldLabel>
        <SpreadsheetInput
          appearance="field"
          id={`${idPrefix}-amount`}
          ariaLabel="Montant prévu"
          suffix="CAD"
          inputMode="decimal"
          placeholder="0"
          commitOnChange={commitOnChange}
          value={values.amountInput}
          onCommit={(amountInput) => onChange({ amountInput })}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-notes`}>Notes</FieldLabel>
        <SpreadsheetInput
          appearance="field"
          id={`${idPrefix}-notes`}
          ariaLabel="Notes"
          commitOnChange={commitOnChange}
          value={values.notes}
          onCommit={(notes) => onChange({ notes })}
        />
      </Field>
    </RecurringFields>
  );
}

"use client";

import { AccountSelect, DebtSelect } from "@/components/account-select";
import { MonthDayPicker } from "@/components/month-day-picker";
import { RecurringFields } from "@/components/recurring-list";
import { SpreadsheetInput } from "@/components/spreadsheet-input";
import { Field, FieldLabel } from "@/components/ui/field";
import type { Account, Debt } from "@/db/schema";

export type PaymentTemplateValues = {
  label: string;
  accountId: string;
  dayOfMonth: number;
  amountInput: string;
  notes: string;
  debtId: string | null;
};

export function PaymentTemplateFields({
  idPrefix,
  accounts,
  debts,
  values,
  onChange,
  locked = false,
  commitOnChange = false,
}: {
  idPrefix: string;
  accounts: Account[];
  debts: Debt[];
  values: PaymentTemplateValues;
  onChange: (patch: Partial<PaymentTemplateValues>) => void;
  locked?: boolean;
  commitOnChange?: boolean;
}) {
  return (
    <RecurringFields>
      {locked ? null : (
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-label`}>Libellé</FieldLabel>
          <SpreadsheetInput
            appearance="field"
            id={`${idPrefix}-label`}
            ariaLabel="Libellé"
            placeholder="Facture"
            autoFocus={commitOnChange}
            commitOnChange={commitOnChange}
            value={values.label}
            onCommit={(label) => onChange({ label })}
          />
        </Field>
      )}
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
      {locked ? null : (
        <Field>
          <FieldLabel>Jour du mois</FieldLabel>
          <MonthDayPicker
            appearance="field"
            ariaLabel="Jour du mois"
            dayOfMonth={values.dayOfMonth}
            onChange={(dayOfMonth) => onChange({ dayOfMonth })}
          />
        </Field>
      )}
      {locked ? null : (
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
      )}
      {locked ? null : (
        <Field>
          <FieldLabel>Dette liée</FieldLabel>
          <DebtSelect
            appearance="field"
            ariaLabel="Dette liée (optionnel)"
            className="max-w-none"
            debts={debts}
            value={values.debtId}
            onChange={(debtId) => onChange({ debtId })}
          />
        </Field>
      )}
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

"use client";

import { useTransition } from "react";

import { deletePaymentTemplate, updatePaymentTemplate } from "@/actions/budget";
import { AccountSelect, DebtSelect } from "@/components/account-select";
import { DeleteRowButton } from "@/components/delete-row-button";
import { MonthDayPicker } from "@/components/month-day-picker";
import { MoneyText } from "@/components/money-text";
import { RecurringBadge, RecurringRow } from "@/components/recurring-list";
import { SpreadsheetInput } from "@/components/spreadsheet-input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { paymentFlowLabel } from "@/lib/accounts";
import { formatMonthlyCadence } from "@/lib/dates";
import { isDebtManagedPayment } from "@/lib/debts";
import { parseMoneyToCents } from "@/lib/money";
import type { Account, Debt, PaymentTemplate } from "@/db/schema";

export function PaymentTemplateItem({
  template,
  accounts,
  debts,
}: {
  template: PaymentTemplate;
  accounts: Account[];
  debts: Debt[];
}) {
  const locked = isDebtManagedPayment(template);
  const [, startTransition] = useTransition();
  const account = accounts.find((row) => row.id === template.accountId);
  const debt = debts.find((row) => row.id === template.debtId) ?? null;
  const debtAccount = debt?.accountId
    ? (accounts.find((row) => row.id === debt.accountId) ?? null)
    : null;

  return (
    <RecurringRow
      title={template.label}
      summary={formatMonthlyCadence(template.dayOfMonth)}
      value={<MoneyText cents={template.expectedAmountCents} />}
      badges={
        <>
          <RecurringBadge>{paymentFlowLabel({ account, debt, debtAccount })}</RecurringBadge>
          {debt ? <RecurringBadge>Dette</RecurringBadge> : null}
        </>
      }
    >
      <FieldGroup className="gap-3 sm:grid sm:grid-cols-2">
        {locked ? null : (
          <Field>
            <FieldLabel htmlFor={`payment-label-${template.id}`}>Libellé</FieldLabel>
            <SpreadsheetInput
              appearance="field"
              id={`payment-label-${template.id}`}
              ariaLabel="Libellé"
              value={template.label}
              onCommit={(label) => {
                startTransition(() => {
                  void updatePaymentTemplate(template.id, { label });
                });
              }}
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
            value={template.accountId}
            onChange={(accountId) => {
              startTransition(() => {
                void updatePaymentTemplate(template.id, { accountId });
              });
            }}
          />
        </Field>
        {locked ? null : (
          <Field>
            <FieldLabel>Jour du mois</FieldLabel>
            <MonthDayPicker
              appearance="field"
              ariaLabel="Jour du mois"
              dayOfMonth={template.dayOfMonth}
              onChange={(dayOfMonth) => {
                startTransition(() => {
                  void updatePaymentTemplate(template.id, { dayOfMonth });
                });
              }}
            />
          </Field>
        )}
        {locked ? null : (
          <Field>
            <FieldLabel htmlFor={`payment-amount-${template.id}`}>Montant prévu</FieldLabel>
            <SpreadsheetInput
              appearance="field"
              id={`payment-amount-${template.id}`}
              ariaLabel="Montant prévu"
              suffix="CAD"
              inputMode="decimal"
              value={String(template.expectedAmountCents / 100)}
              onCommit={(next) => {
                const cents = parseMoneyToCents(next);
                if (cents === null) return;
                startTransition(() => {
                  void updatePaymentTemplate(template.id, { expectedAmountCents: cents });
                });
              }}
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
              value={template.debtId}
              onChange={(debtId) => {
                startTransition(() => {
                  void updatePaymentTemplate(template.id, { debtId });
                });
              }}
            />
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor={`payment-notes-${template.id}`}>Notes</FieldLabel>
          <SpreadsheetInput
            appearance="field"
            id={`payment-notes-${template.id}`}
            ariaLabel="Notes"
            value={template.notes}
            onCommit={(notes) => {
              startTransition(() => {
                void updatePaymentTemplate(template.id, { notes });
              });
            }}
          />
        </Field>
        {locked ? null : (
          <Field className="sm:col-span-2 sm:items-end">
            <DeleteRowButton
              title={`Supprimer « ${template.label} » ?`}
              description="Ce modèle ne remplira plus les mois suivants. Les lignes déjà créées restent."
              onClick={() => {
                startTransition(() => {
                  void deletePaymentTemplate(template.id);
                });
              }}
            />
          </Field>
        )}
      </FieldGroup>
    </RecurringRow>
  );
}

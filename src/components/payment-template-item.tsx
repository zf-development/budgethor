"use client";

import { useTransition } from "react";

import { deletePaymentTemplate, updatePaymentTemplate } from "@/actions/budget";
import { DeleteRowButton } from "@/components/delete-row-button";
import { MoneyText } from "@/components/money-text";
import {
  PaymentTemplateFields,
  type PaymentTemplateValues,
} from "@/components/payment-template-fields";
import { RecurringBadge, RecurringRow } from "@/components/recurring-list";
import { paymentFlowLabel } from "@/lib/accounts";
import { formatMonthlyCadence } from "@/lib/dates";
import { isDebtManagedPayment } from "@/lib/debts";
import { parseMoneyToCents } from "@/lib/money";
import type { Account, Debt, PaymentTemplate } from "@/db/schema";

function templateValues(template: PaymentTemplate): PaymentTemplateValues {
  return {
    label: template.label,
    accountId: template.accountId,
    dayOfMonth: template.dayOfMonth,
    amountInput: String(template.expectedAmountCents / 100),
    notes: template.notes,
    debtId: template.debtId,
  };
}

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

  function commit(patch: Partial<PaymentTemplateValues>) {
    const next: Parameters<typeof updatePaymentTemplate>[1] = {};
    if (patch.label !== undefined) next.label = patch.label;
    if (patch.accountId !== undefined) next.accountId = patch.accountId;
    if (patch.dayOfMonth !== undefined) next.dayOfMonth = patch.dayOfMonth;
    if (patch.notes !== undefined) next.notes = patch.notes;
    if (patch.debtId !== undefined) next.debtId = patch.debtId;
    if (patch.amountInput !== undefined) {
      const cents = parseMoneyToCents(patch.amountInput);
      if (cents === null) return;
      next.expectedAmountCents = cents;
    }
    if (Object.keys(next).length === 0) return;
    startTransition(() => {
      void updatePaymentTemplate(template.id, next);
    });
  }

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
      <PaymentTemplateFields
        idPrefix={`payment-${template.id}`}
        accounts={accounts}
        debts={debts}
        values={templateValues(template)}
        locked={locked}
        onChange={commit}
      />
      {locked ? null : (
        <DeleteRowButton
          appearance="label"
          title={`Supprimer « ${template.label} » ?`}
          description="Cette facture ne remplira plus les mois suivants. Les lignes déjà créées restent."
          onClick={() => {
            startTransition(() => {
              void deletePaymentTemplate(template.id);
            });
          }}
        />
      )}
    </RecurringRow>
  );
}

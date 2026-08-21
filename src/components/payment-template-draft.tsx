"use client";

import { useState, useTransition } from "react";

import { DraftRowActions } from "@/components/draft-row-actions";
import {
  PaymentTemplateFields,
  type PaymentTemplateValues,
} from "@/components/payment-template-fields";
import { RecurringDraft } from "@/components/recurring-list";
import { parseMoneyToCents } from "@/lib/money";
import type { Account, Debt } from "@/db/schema";

export function PaymentTemplateDraft({
  accounts,
  debts,
  defaultAccountId,
  onConfirm,
  onCancel,
}: {
  accounts: Account[];
  debts: Debt[];
  defaultAccountId: string;
  onConfirm: (values: {
    accountId: string;
    label: string;
    dayOfMonth: number;
    expectedAmountCents: number;
    notes: string;
    debtId: string | null;
  }) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<PaymentTemplateValues>({
    label: "",
    accountId: defaultAccountId,
    dayOfMonth: 1,
    amountInput: "",
    notes: "",
    debtId: null,
  });

  function confirm() {
    const label = values.label.trim();
    if (!label || !values.accountId) return;
    const cents = parseMoneyToCents(values.amountInput) ?? 0;
    startTransition(async () => {
      await onConfirm({
        accountId: values.accountId,
        label,
        dayOfMonth: values.dayOfMonth,
        expectedAmountCents: cents,
        notes: values.notes.trim(),
        debtId: values.debtId,
      });
      onCancel();
    });
  }

  return (
    <RecurringDraft title="Nouvelle facture récurrente">
      <PaymentTemplateFields
        idPrefix="payment-draft"
        accounts={accounts}
        debts={debts}
        values={values}
        commitOnChange
        onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
      />
      <DraftRowActions
        disabled={!values.label.trim() || !values.accountId}
        pending={pending}
        onConfirm={confirm}
        onCancel={onCancel}
      />
    </RecurringDraft>
  );
}

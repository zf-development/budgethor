"use client";

import { useState, useTransition } from "react";

import { DraftRowActions } from "@/components/draft-row-actions";
import {
  IncomeTemplateFields,
  type IncomeTemplateValues,
} from "@/components/income-template-fields";
import { RecurringDraft } from "@/components/recurring-list";
import { todayIsoDate } from "@/lib/dates";
import { parseMoneyToCents } from "@/lib/money";
import type { Account } from "@/db/schema";
import type { IncomeCadence } from "@/lib/income";

export function IncomeTemplateDraft({
  accounts,
  defaultAccountId,
  onConfirm,
  onCancel,
}: {
  accounts: Account[];
  defaultAccountId: string;
  onConfirm: (values: {
    accountId: string;
    label: string;
    cadence: IncomeCadence;
    nextPayDate: string;
    expectedAmountCents: number;
    notes: string;
  }) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<IncomeTemplateValues>({
    label: "",
    accountId: defaultAccountId,
    cadence: "biweek",
    nextPayDate: todayIsoDate(),
    amountInput: "",
    notes: "",
  });

  function confirm() {
    const label = values.label.trim();
    if (!label || !values.accountId) return;
    const cents = parseMoneyToCents(values.amountInput) ?? 0;
    startTransition(async () => {
      await onConfirm({
        accountId: values.accountId,
        label,
        cadence: values.cadence,
        nextPayDate: values.nextPayDate,
        expectedAmountCents: cents,
        notes: values.notes.trim(),
      });
      onCancel();
    });
  }

  return (
    <RecurringDraft title="Nouvelle paie">
      <IncomeTemplateFields
        idPrefix="income-draft"
        accounts={accounts}
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

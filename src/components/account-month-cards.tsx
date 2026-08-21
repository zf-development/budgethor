"use client";

import { useTransition } from "react";

import { MoneyFlowRow, SummaryRow } from "@/components/summary-row";
import { SpreadsheetInput } from "@/components/spreadsheet-input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { updateSnapshot } from "@/actions/budget";
import {
  ACCOUNT_TYPE_LABELS,
  accountMonthStories,
  accountOpeningLabel,
  accountPaymentsLabel,
  accountProjectedLabel,
  accountTypeDescription,
} from "@/lib/accounts";
import { formatLineDate, paymentTone } from "@/lib/dates";
import { parseMoneyToCents } from "@/lib/money";
import type { Account, AccountSnapshot, Debt, IncomeEntry, PaymentEntry } from "@/db/schema";

export function AccountMonthCards({
  year,
  month,
  accounts,
  snapshots,
  incomes,
  payments,
  debts,
}: {
  year: number;
  month: number;
  accounts: Account[];
  snapshots: AccountSnapshot[];
  incomes: IncomeEntry[];
  payments: PaymentEntry[];
  debts: Debt[];
}) {
  const [, startTransition] = useTransition();
  const stories = accountMonthStories(accounts, snapshots, incomes, payments, debts);

  if (stories.length === 0) return null;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {stories.map((story) => {
        const { account, snapshot } = story;
        const fieldId = `opening-${account.id}`;
        const openingLabel = accountOpeningLabel(account.type);
        const isCredit = account.type === "liability";

        const nextPayment = payments
          .filter(
            (row) =>
              row.accountId === account.id &&
              paymentTone({
                done: row.paid,
                dayOfMonth: row.dayOfMonth,
                year,
                month,
              }) !== "paid",
          )
          .sort((a, b) => a.dayOfMonth - b.dayOfMonth)[0];

        return (
          <Card key={account.id}>
            <CardHeader>
              <CardTitle>{account.name}</CardTitle>
              <CardDescription>{accountTypeDescription(account.type)}</CardDescription>
              <CardAction>
                <Badge variant={isCredit ? "outline" : "secondary"}>
                  {ACCOUNT_TYPE_LABELS[account.type]}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FieldGroup className="gap-3">
                <Field>
                  <FieldLabel htmlFor={fieldId}>{openingLabel}</FieldLabel>
                  <SpreadsheetInput
                    id={fieldId}
                    ariaLabel={`${openingLabel} ${account.name}`}
                    suffix="CAD"
                    value={String(snapshot.openingBalanceCents / 100)}
                    inputMode="decimal"
                    onCommit={(next) => {
                      const cents = parseMoneyToCents(next);
                      if (cents === null) return;
                      startTransition(() => {
                        void updateSnapshot(snapshot.id, cents);
                      });
                    }}
                  />
                </Field>
              </FieldGroup>
              <Separator />
              <div className="flex flex-col gap-2">
                <MoneyFlowRow label="Paies ce mois" cents={story.inflowsCents} prefix="+" />
                <MoneyFlowRow
                  label={accountPaymentsLabel(account.type)}
                  cents={story.outflowsCents}
                  prefix="−"
                />
                {isCredit && story.repaymentCents > 0 ? (
                  <MoneyFlowRow label="Remboursements" cents={story.repaymentCents} prefix="−" />
                ) : null}
                <MoneyFlowRow
                  label={accountProjectedLabel(account.type)}
                  cents={story.projectedCents}
                />
                {nextPayment ? (
                  <SummaryRow label="Prochaine date">
                    {formatLineDate(year, month, nextPayment.dayOfMonth)} · {nextPayment.label}
                  </SummaryRow>
                ) : null}
              </div>
              {isCredit ? (
                <p className="text-muted-foreground">
                  Les achats sur cette carte augmentent le dû. Si une dette est liée, cocher un
                  paiement depuis un compte d’argent (ex. Banque) le diminue.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Estimation = solde au 1er + paies − paiements (prévu si pas encore payé).
                  Ce n’est pas un solde bancaire en temps réel.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

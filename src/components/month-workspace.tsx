"use client";

import { useState } from "react";

import { CsvImportDialog } from "@/components/csv-import-dialog";
import { IncomeTable } from "@/components/income-table";
import { PaymentTable } from "@/components/payment-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { accountTypeDescription } from "@/lib/accounts";
import type { Account, Debt, IncomeEntry, PaymentEntry } from "@/db/schema";

export function MonthWorkspace({
  monthId,
  year,
  month,
  accounts,
  incomes,
  payments,
  debts,
  lockedTemplateIds = [],
}: {
  monthId: string;
  year: number;
  month: number;
  accounts: Account[];
  incomes: IncomeEntry[];
  payments: PaymentEntry[];
  debts: Debt[];
  lockedTemplateIds?: string[];
}) {
  const [accountFilter, setAccountFilter] = useState("all");
  const selectedAccount =
    accountFilter === "all"
      ? accounts.length === 1
        ? accounts[0]
        : undefined
      : accounts.find((account) => account.id === accountFilter);
  const defaultAccountId = selectedAccount?.id ?? accounts[0]?.id;
  const visiblePayments = selectedAccount
    ? payments.filter((row) => row.accountId === selectedAccount.id)
    : payments;

  return (
    <Tabs defaultValue="income" className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="income">Paies</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
        </TabsList>
        {accounts.length > 0 ? (
          <CsvImportDialog
            accounts={accounts}
            monthId={monthId}
            year={year}
            month={month}
            defaultAccountId={defaultAccountId}
          />
        ) : null}
      </div>
      <TabsContent value="income">
        <IncomeTable
          monthId={monthId}
          year={year}
          month={month}
          accounts={accounts}
          rows={incomes}
        />
      </TabsContent>
      <TabsContent value="payments" className="flex flex-col gap-4">
        {accounts.length > 1 ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Compte débité : d’où part l’argent, ou quelle carte est chargée.
            </p>
            <ToggleGroup
              size="sm"
              className="flex-wrap"
              value={[accountFilter]}
              onValueChange={(next) => {
                if (next[0]) setAccountFilter(next[0]);
              }}
            >
              <ToggleGroupItem value="all">Tous</ToggleGroupItem>
              {accounts.map((account) => (
                <ToggleGroupItem key={account.id} value={account.id} className="max-w-40 truncate">
                  {account.name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {selectedAccount ? (
              <p className="text-sm text-muted-foreground">
                {accountTypeDescription(selectedAccount.type)}
              </p>
            ) : null}
          </div>
        ) : null}
        {defaultAccountId ? (
          <PaymentTable
            title={
              selectedAccount
                ? `Paiements · ${selectedAccount.name}`
                : "Tous les paiements"
            }
            description={
              selectedAccount
                ? selectedAccount.type === "liability"
                  ? "Charges sur ce crédit."
                  : "Sorties de ce compte d’argent."
                : "Indique le compte débité sur chaque ligne."
            }
            monthId={monthId}
            year={year}
            month={month}
            accountId={defaultAccountId}
            accounts={accounts}
            debts={debts}
            rows={visiblePayments}
            hideAccount={Boolean(selectedAccount)}
            lockedTemplateIds={lockedTemplateIds}
          />
        ) : null}
      </TabsContent>
    </Tabs>
  );
}

"use client";

import { useTransition } from "react";
import { HandCoinsIcon } from "@/components/icons";

import { AccountSelect } from "@/components/account-select";
import { createDebt, deleteDebt, updateDebt } from "@/actions/budget";
import { DebtDetailsDialog } from "@/components/debt-details-dialog";
import { DebtNextStep } from "@/components/debt-next-step";
import { DebtProgress } from "@/components/debt-progress";
import { DeleteRowButton } from "@/components/delete-row-button";
import { MonthDayPicker } from "@/components/month-day-picker";
import { SpreadsheetEmpty } from "@/components/spreadsheet-empty";
import { SpreadsheetInput } from "@/components/spreadsheet-input";
import { SpreadsheetTable } from "@/components/spreadsheet-table";
import { TableCell, TableRow } from "@/components/ui/table";
import { parseMoneyToCents } from "@/lib/money";
import type { Account, Debt } from "@/db/schema";

const COLUMNS = [
  { key: "creditor", header: "Créancier" },
  { key: "account", header: "Compte lié" },
  { key: "balance", header: "Solde restant" },
  { key: "payment", header: "Paiement / mois" },
  { key: "date", header: "Date", className: "w-40" },
  { key: "progress", header: "Progression", className: "min-w-40" },
  { key: "actions", header: "", className: "w-20" },
];

export function DebtTable({ debts, accounts }: { debts: Debt[]; accounts: Account[] }) {
  const [, startTransition] = useTransition();

  return (
    <SpreadsheetTable
      title="Créanciers"
      description="Compte lié : les charges l’augmentent, un virement la diminue."
      columns={COLUMNS}
      addLabel="Ajouter une dette"
      onAdd={() => {
        startTransition(() => {
          void createDebt();
        });
      }}
    >
      {debts.length === 0 ? (
        <SpreadsheetEmpty
          colSpan={7}
          icon={HandCoinsIcon}
          title="Aucune dette pour l’instant"
          description="Ajoute un créancier pour suivre le solde restant et le temps de remboursement."
        />
      ) : (
        debts.map((debt) => (
          <TableRow key={debt.id}>
            <TableCell>
              <SpreadsheetInput
                ariaLabel="Créancier"
                value={debt.creditor}
                onCommit={(next) => {
                  startTransition(() => {
                    void updateDebt(debt.id, { creditor: next });
                  });
                }}
              />
            </TableCell>
            <TableCell>
              <AccountSelect
                ariaLabel="Compte lié"
                accounts={accounts}
                allowNone
                noneLabel="Aucun"
                className="max-w-none"
                value={debt.accountId ?? ""}
                onChange={(accountId) => {
                  startTransition(() => {
                    void updateDebt(debt.id, { accountId: accountId || null });
                  });
                }}
              />
            </TableCell>
            <TableCell>
              <SpreadsheetInput
                ariaLabel="Solde restant"
                inputMode="decimal"
                value={String(debt.balanceCents / 100)}
                onCommit={(next) => {
                  const cents = parseMoneyToCents(next);
                  if (cents === null) return;
                  startTransition(() => {
                    void updateDebt(debt.id, { balanceCents: cents });
                  });
                }}
              />
            </TableCell>
            <TableCell>
              <SpreadsheetInput
                ariaLabel="Paiement mensuel"
                inputMode="decimal"
                value={String(debt.monthlyPaymentCents / 100)}
                onCommit={(next) => {
                  const cents = parseMoneyToCents(next);
                  if (cents === null) return;
                  startTransition(() => {
                    void updateDebt(debt.id, { monthlyPaymentCents: cents });
                  });
                }}
              />
            </TableCell>
            <TableCell>
              <MonthDayPicker
                ariaLabel="Date de paiement"
                dayOfMonth={debt.dayOfMonth}
                onChange={(dayOfMonth) => {
                  startTransition(() => {
                    void updateDebt(debt.id, { dayOfMonth });
                  });
                }}
              />
            </TableCell>
            <TableCell className="whitespace-normal">
              <div className="flex min-w-40 flex-col gap-1">
                <DebtProgress compact debt={debt} />
                <DebtNextStep compact debt={debt} />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end">
                <DebtDetailsDialog debt={debt} />
                <DeleteRowButton
                  title={`Supprimer « ${debt.creditor} » ?`}
                  description="La dette disparaîtra du suivi. Les mensualités générées automatiquement seront aussi retirées."
                  onClick={() => {
                    startTransition(() => {
                      void deleteDebt(debt.id);
                    });
                  }}
                />
              </div>
            </TableCell>
          </TableRow>
        ))
      )}
    </SpreadsheetTable>
  );
}

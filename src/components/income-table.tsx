"use client";

import { useTransition } from "react";
import { CircleDollarSignIcon } from "@/components/icons";

import {
  createIncomeEntry,
  deleteIncomeEntry,
  updateIncomeEntry,
} from "@/actions/budget";
import { AccountSelect } from "@/components/account-select";
import { DeleteRowButton } from "@/components/delete-row-button";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { SpreadsheetEmpty } from "@/components/spreadsheet-empty";
import { MonthDayPicker } from "@/components/month-day-picker";
import { SpreadsheetInput } from "@/components/spreadsheet-input";
import { SpreadsheetTable } from "@/components/spreadsheet-table";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableFooter, TableRow } from "@/components/ui/table";
import { MoneyText } from "@/components/money-text";
import { paymentTone, rowToneClass } from "@/lib/dates";
import { parseMoneyToCents } from "@/lib/money";
import type { Account, IncomeEntry } from "@/db/schema";

export function IncomeTable({
  monthId,
  year,
  month,
  accounts,
  rows,
}: {
  monthId: string;
  year: number;
  month: number;
  accounts: Account[];
  rows: IncomeEntry[];
}) {
  const [, startTransition] = useTransition();
  const defaultAccountId = accounts[0]?.id;
  const expected = rows.reduce((sum, row) => sum + row.expectedAmountCents, 0);
  const actual = rows.reduce((sum, row) => {
    if (!row.received) return sum;
    return sum + (row.actualAmountCents ?? row.expectedAmountCents);
  }, 0);

  return (
    <SpreadsheetTable
      title="Paies"
      description="Les dates sont générées par la répétition de la paie. Tu peux aussi ajouter une paie hors cycle."
      columns={[
        { key: "received", header: "Reçu", className: "w-16" },
        { key: "day", header: "Date", className: "w-40" },
        { key: "label", header: "Libellé" },
        { key: "account", header: "Compte" },
        { key: "expected", header: "Prévu" },
        { key: "actual", header: "Réel" },
        { key: "notes", header: "Notes" },
        { key: "status", header: "Statut" },
        { key: "actions", header: "", className: "w-12" },
      ]}
      addLabel="Ajouter une paie"
      onAdd={
        defaultAccountId
          ? () => {
              startTransition(() => {
                void createIncomeEntry(monthId, defaultAccountId);
              });
            }
          : undefined
      }
      footer={
        rows.length === 0 ? undefined : (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4}>Totaux</TableCell>
              <TableCell>
                <MoneyText cents={expected} />
              </TableCell>
              <TableCell>
                <MoneyText cents={actual} />
              </TableCell>
              <TableCell colSpan={3} />
            </TableRow>
          </TableFooter>
        )
      }
    >
      {rows.length === 0 ? (
        <SpreadsheetEmpty
          colSpan={9}
          icon={CircleDollarSignIcon}
          title="Aucune paie ce mois-ci"
          description="Ajoute une paie ou vérifie tes paies récurrentes."
        />
      ) : (
        rows.map((row) => {
          const tone = paymentTone({
            done: row.received,
            dayOfMonth: row.dayOfMonth,
            year,
            month,
          });
          return (
            <TableRow key={row.id} className={rowToneClass(tone)}>
              <TableCell>
                <Checkbox
                  checked={row.received}
                  onCheckedChange={(checked) => {
                    startTransition(() => {
                      void updateIncomeEntry(row.id, { received: Boolean(checked) });
                    });
                  }}
                />
              </TableCell>
              <TableCell>
                <MonthDayPicker
                  ariaLabel="Date de paie"
                  year={year}
                  month={month}
                  dayOfMonth={row.dayOfMonth}
                  onChange={(day) => {
                    startTransition(() => {
                      void updateIncomeEntry(row.id, { dayOfMonth: day });
                    });
                  }}
                />
              </TableCell>
              <TableCell>
                <SpreadsheetInput
                  ariaLabel="Libellé"
                  value={row.label}
                  onCommit={(next) => {
                    startTransition(() => {
                      void updateIncomeEntry(row.id, { label: next });
                    });
                  }}
                />
              </TableCell>
              <TableCell>
                <AccountSelect
                  ariaLabel="Compte crédité"
                  accounts={accounts}
                  value={row.accountId}
                  onChange={(accountId) => {
                    startTransition(() => {
                      void updateIncomeEntry(row.id, { accountId });
                    });
                  }}
                />
              </TableCell>
              <TableCell>
                <SpreadsheetInput
                  ariaLabel="Montant prévu"
                  inputMode="decimal"
                  value={String(row.expectedAmountCents / 100)}
                  onCommit={(next) => {
                    const cents = parseMoneyToCents(next);
                    if (cents === null) return;
                    startTransition(() => {
                      void updateIncomeEntry(row.id, { expectedAmountCents: cents });
                    });
                  }}
                />
              </TableCell>
              <TableCell>
                <SpreadsheetInput
                  ariaLabel="Montant réel"
                  inputMode="decimal"
                  value={
                    row.actualAmountCents === null ? "" : String(row.actualAmountCents / 100)
                  }
                  placeholder="—"
                  onCommit={(next) => {
                    const cents = next.trim() === "" ? null : parseMoneyToCents(next);
                    if (cents === null && next.trim() !== "") return;
                    startTransition(() => {
                      void updateIncomeEntry(row.id, { actualAmountCents: cents });
                    });
                  }}
                />
              </TableCell>
              <TableCell>
                <SpreadsheetInput
                  ariaLabel="Notes"
                  value={row.notes}
                  onCommit={(next) => {
                    startTransition(() => {
                      void updateIncomeEntry(row.id, { notes: next });
                    });
                  }}
                />
              </TableCell>
              <TableCell>
                <PaymentStatusBadge kind="income" tone={tone} />
              </TableCell>
              <TableCell>
                <DeleteRowButton
                  title={`Supprimer « ${row.label} » ?`}
                  description="Cette ligne sera retirée de ce mois."
                  onClick={() => {
                    startTransition(() => {
                      void deleteIncomeEntry(row.id);
                    });
                  }}
                />
              </TableCell>
            </TableRow>
          );
        })
      )}
    </SpreadsheetTable>
  );
}

"use client";

import { useTransition } from "react";
import { ReceiptIcon } from "@/components/icons";

import {
  createPaymentEntry,
  deletePaymentEntry,
  updatePaymentEntry,
} from "@/actions/budget";
import { AccountSelect, DebtSelect } from "@/components/account-select";
import { Badge } from "@/components/ui/badge";
import { DeleteRowButton } from "@/components/delete-row-button";
import { MoneyText } from "@/components/money-text";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { SpreadsheetEmpty } from "@/components/spreadsheet-empty";
import { MonthDayPicker } from "@/components/month-day-picker";
import { SpreadsheetInput } from "@/components/spreadsheet-input";
import { SpreadsheetTable } from "@/components/spreadsheet-table";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableFooter, TableRow } from "@/components/ui/table";
import { paymentTone, rowToneClass, formatLineDate } from "@/lib/dates";
import { isCreditChargePayment } from "@/lib/debts";
import { parseMoneyToCents } from "@/lib/money";
import type { Account, Debt, PaymentEntry } from "@/db/schema";

export function PaymentTable({
  title,
  description,
  monthId,
  year,
  month,
  accountId,
  accounts,
  debts,
  rows,
  hideAccount,
  lockedTemplateIds = [],
}: {
  title: string;
  description?: React.ReactNode;
  monthId: string;
  year: number;
  month: number;
  accountId: string;
  accounts: Account[];
  debts: Debt[];
  rows: PaymentEntry[];
  hideAccount?: boolean;
  lockedTemplateIds?: string[];
}) {
  const [, startTransition] = useTransition();
  const expected = rows.reduce((sum, row) => sum + row.expectedAmountCents, 0);
  const actualPaid = rows.reduce((sum, row) => {
    if (!row.paid) return sum;
    return sum + (row.actualAmountCents ?? row.expectedAmountCents);
  }, 0);
  const remaining = expected - actualPaid;
  const colCount = hideAccount ? 9 : 10;
  const labelSpan = hideAccount ? 3 : 4;
  const trailingSpan = hideAccount ? 4 : 4;

  return (
    <SpreadsheetTable
      title={title}
      description={
        <>
          {description ? <>{description} </> : null}
          Reste à cocher : <MoneyText cents={remaining} className="text-foreground" />
        </>
      }
      columns={[
        { key: "paid", header: "Payé", className: "w-16" },
        { key: "day", header: "Date", className: "w-40" },
        { key: "label", header: "Libellé" },
        ...(hideAccount ? [] : [{ key: "account", header: "Compte" }]),
        { key: "expected", header: "Prévu" },
        { key: "actual", header: "Réel" },
        { key: "notes", header: "Notes" },
        { key: "debt", header: "Dette", className: "w-40" },
        { key: "status", header: "Statut" },
        { key: "actions", header: "", className: "w-12" },
      ]}
      addLabel="Ajouter un paiement"
      onAdd={() => {
        startTransition(() => {
          void createPaymentEntry(monthId, accountId);
        });
      }}
      footer={
        rows.length === 0 ? undefined : (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={labelSpan}>Totaux</TableCell>
              <TableCell>
                <MoneyText cents={expected} />
              </TableCell>
              <TableCell>
                <MoneyText cents={actualPaid} />
              </TableCell>
              <TableCell colSpan={trailingSpan} />
            </TableRow>
          </TableFooter>
        )
      }
    >
      {rows.length === 0 ? (
        <SpreadsheetEmpty
          colSpan={colCount}
          icon={ReceiptIcon}
          title="Aucun paiement"
          description="Ajoute une ligne pour ce compte."
        />
      ) : (
        rows.map((row) => {
          const tone = paymentTone({
            done: row.paid,
            dayOfMonth: row.dayOfMonth,
            year,
            month,
          });
          const locked = Boolean(row.templateId && lockedTemplateIds.includes(row.templateId));
          const isCharge = isCreditChargePayment(row, debts);
          return (
            <TableRow key={row.id} className={rowToneClass(tone)}>
              <TableCell>
                <Checkbox
                  checked={row.paid}
                  onCheckedChange={(checked) => {
                    startTransition(() => {
                      void updatePaymentEntry(row.id, { paid: Boolean(checked) });
                    });
                  }}
                />
              </TableCell>
              <TableCell>
                {locked ? (
                  formatLineDate(year, month, row.dayOfMonth)
                ) : (
                  <MonthDayPicker
                    ariaLabel="Date de paiement"
                    year={year}
                    month={month}
                    dayOfMonth={row.dayOfMonth}
                    onChange={(day) => {
                      startTransition(() => {
                        void updatePaymentEntry(row.id, { dayOfMonth: day });
                      });
                    }}
                  />
                )}
              </TableCell>
              <TableCell>
                {locked ? (
                  row.label
                ) : (
                  <SpreadsheetInput
                    ariaLabel="Libellé"
                    value={row.label}
                    onCommit={(next) => {
                      startTransition(() => {
                        void updatePaymentEntry(row.id, { label: next });
                      });
                    }}
                  />
                )}
              </TableCell>
              {hideAccount ? null : (
                <TableCell>
                  <AccountSelect
                    ariaLabel="Compte débité"
                    accounts={accounts}
                    value={row.accountId}
                    onChange={(nextAccountId) => {
                      startTransition(() => {
                        void updatePaymentEntry(row.id, { accountId: nextAccountId });
                      });
                    }}
                  />
                </TableCell>
              )}
              <TableCell>
                {locked ? (
                  <MoneyText cents={row.expectedAmountCents} />
                ) : (
                  <SpreadsheetInput
                    ariaLabel="Montant prévu"
                    inputMode="decimal"
                    value={String(row.expectedAmountCents / 100)}
                    onCommit={(next) => {
                      const cents = parseMoneyToCents(next);
                      if (cents === null) return;
                      startTransition(() => {
                        void updatePaymentEntry(row.id, { expectedAmountCents: cents });
                      });
                    }}
                  />
                )}
              </TableCell>
              <TableCell>
                <SpreadsheetInput
                  ariaLabel="Montant réel"
                  inputMode="decimal"
                  placeholder="—"
                  value={
                    row.actualAmountCents === null ? "" : String(row.actualAmountCents / 100)
                  }
                  onCommit={(next) => {
                    const cents = next.trim() === "" ? null : parseMoneyToCents(next);
                    if (cents === null && next.trim() !== "") return;
                    startTransition(() => {
                      void updatePaymentEntry(row.id, { actualAmountCents: cents });
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
                      void updatePaymentEntry(row.id, { notes: next });
                    });
                  }}
                />
              </TableCell>
              <TableCell>
                {isCharge ? (
                  <Badge variant="outline">Charge</Badge>
                ) : (
                  <DebtSelect
                    ariaLabel="Dette liée"
                    debts={debts}
                    value={row.debtId}
                    disabled={locked}
                    onChange={(debtId) => {
                      startTransition(() => {
                        void updatePaymentEntry(row.id, { debtId });
                      });
                    }}
                  />
                )}
              </TableCell>
              <TableCell>
                <PaymentStatusBadge tone={tone} />
              </TableCell>
              <TableCell>
                {locked ? null : (
                  <DeleteRowButton
                    title={`Supprimer « ${row.label} » ?`}
                    description="Cette ligne sera retirée de ce mois."
                    onClick={() => {
                      startTransition(() => {
                        void deletePaymentEntry(row.id);
                      });
                    }}
                  />
                )}
              </TableCell>
            </TableRow>
          );
        })
      )}
    </SpreadsheetTable>
  );
}

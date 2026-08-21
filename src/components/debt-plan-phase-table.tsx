"use client";

import { DebtSelect } from "@/components/account-select";
import { MoneyText } from "@/components/money-text";
import { SpreadsheetInput } from "@/components/spreadsheet-input";
import { SpreadsheetTable } from "@/components/spreadsheet-table";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Debt } from "@/db/schema";
import type { DebtPlanPhase, DebtPlanPhaseRow } from "@/lib/debt-plan";
import { formatRemainingMonths, parseMoneyToCents } from "@/lib/money";
import { cn } from "@/lib/utils";

const START_COLUMNS = [
  { key: "creditor", header: "Créancier" },
  { key: "drop", header: "Drop" },
  { key: "redirect", header: "Rediriger vers" },
  { key: "amount", header: "Montant" },
  { key: "payment", header: "Paiement mensuel" },
  { key: "months", header: "Nombre de mois", className: "w-36" },
];

const PHASE_COLUMNS = [
  { key: "creditor", header: "Créancier" },
  { key: "amount", header: "Montant" },
  { key: "payment", header: "Paiement mensuel" },
  { key: "months", header: "Nombre de mois", className: "w-36" },
];

function PaymentCell({ row }: { row: DebtPlanPhaseRow }) {
  const delta = row.paymentCents - row.originalPaymentCents;
  return (
    <div className="flex flex-col gap-1">
      <MoneyText
        cents={row.paymentCents}
        className={cn(delta > 0 && "font-medium")}
      />
      {delta > 0 ? (
        <span className="text-muted-foreground text-xs">
          +<MoneyText cents={delta} />
          {row.rolledFrom.length > 0 ? ` · ${row.rolledFrom.join(", ")}` : null}
        </span>
      ) : null}
    </div>
  );
}

export function DebtPlanPhaseTable({
  phase,
  debts,
  onDropChange,
}: {
  phase: DebtPlanPhase;
  debts: Debt[];
  onDropChange?: (input: {
    debtId: string;
    amountCents: number;
    redirectDebtId: string | null;
  }) => void;
}) {
  return (
    <SpreadsheetTable
      title={phase.title}
      description={phase.subtitle}
      columns={phase.isStart ? START_COLUMNS : PHASE_COLUMNS}
    >
      {phase.rows.map((row) => (
        <TableRow key={row.id} className={cn(row.balanceCents <= 0 && "opacity-60")}>
          <TableCell>
            <div className="flex items-center gap-2">
              <span className="truncate">{row.creditor}</span>
              {row.isFocus && row.balanceCents > 0 ? (
                <Badge variant="secondary">Focus</Badge>
              ) : null}
              {row.balanceCents <= 0 ? <Badge variant="outline">Soldée</Badge> : null}
            </div>
          </TableCell>
          {phase.isStart ? (
            <>
              <TableCell>
                <SpreadsheetInput
                  ariaLabel={`Drop sur ${row.creditor}`}
                  inputMode="decimal"
              value={row.dropCents ? String(row.dropCents / 100) : "0"}
                  onCommit={(next) => {
                    const cents = parseMoneyToCents(next);
                    if (cents === null) return;
                    onDropChange?.({
                      debtId: row.id,
                      amountCents: cents,
                      redirectDebtId: row.redirectDebtId,
                    });
                  }}
                />
              </TableCell>
              <TableCell>
                <DebtSelect
                  ariaLabel={`Rediriger ${row.creditor}`}
                  debts={debts}
                  excludeIds={[row.id]}
                  noneLabel="Selon la stratégie"
                  className="max-w-none"
                  value={row.redirectDebtId}
                  onChange={(redirectDebtId) => {
                    onDropChange?.({
                      debtId: row.id,
                      amountCents: row.dropCents,
                      redirectDebtId,
                    });
                  }}
                />
              </TableCell>
            </>
          ) : null}
          <TableCell>
            <MoneyText cents={row.balanceCents} />
          </TableCell>
          <TableCell>
            <PaymentCell row={row} />
          </TableCell>
          <TableCell>{formatRemainingMonths(row.months)}</TableCell>
        </TableRow>
      ))}
    </SpreadsheetTable>
  );
}

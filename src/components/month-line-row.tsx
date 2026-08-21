"use client";

import { useEffect, useState, useTransition } from "react";

import { updateIncomeEntry, updatePaymentEntry } from "@/actions/budget";
import { AccountSelect } from "@/components/account-select";
import { ChevronDownIcon } from "@/components/icons";
import { MoneyText } from "@/components/money-text";
import { MonthDayPicker } from "@/components/month-day-picker";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { SpreadsheetInput } from "@/components/spreadsheet-input";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import type { Account } from "@/db/schema";
import { formatLineDate } from "@/lib/dates";
import { parseMoneyToCents } from "@/lib/money";
import type { MonthLineItem } from "@/lib/totals";
import { cn } from "@/lib/utils";

export function MonthLineRow({
  item,
  year,
  month,
  accounts,
}: {
  item: MonthLineItem;
  year: number;
  month: number;
  accounts: Account[];
}) {
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const done = item.tone === "paid";
  const isIncome = item.kind === "income";
  const markLabel = isIncome ? "Marquer comme reçu" : "Marquer comme payé";

  function setDone(next: boolean) {
    startTransition(() => {
      if (isIncome) {
        void updateIncomeEntry(item.id, { received: next });
      } else {
        void updatePaymentEntry(item.id, { paid: next });
      }
    });
    setExpanded(false);
  }

  return (
    <>
      <div className="group/line flex flex-col gap-3 py-3">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={done}
            disabled={pending}
            aria-label={`Marquer ${item.label}`}
            onCheckedChange={(checked) => {
              setDone(Boolean(checked));
            }}
          />
          <button
            type="button"
            aria-expanded={expanded}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left text-sm text-inherit outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
            onClick={() => setExpanded((current) => !current)}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate font-medium">{item.label}</span>
              <span className="truncate text-muted-foreground">
                {formatLineDate(year, month, item.dayOfMonth)} · {item.accountName}
              </span>
            </div>
            <MoneyText cents={item.amountCents} />
            <PaymentStatusBadge
              kind={isIncome ? "income" : "payment"}
              tone={item.tone}
            />
            <ChevronDownIcon
              size={16}
              aria-hidden
              className={cn(
                "shrink-0 text-muted-foreground opacity-0 transition-all",
                "group-hover/line:opacity-100 group-focus-within/line:opacity-100",
                expanded && "rotate-180 opacity-100",
              )}
            />
          </button>
        </div>
        {expanded ? (
          <ButtonGroup className="w-full pl-7">
            <Button
              size="sm"
              className="flex-1"
              disabled={pending || done}
              onClick={() => {
                setDone(true);
              }}
            >
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {markLabel}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setEditing(true);
              }}
            >
              Modifier
            </Button>
          </ButtonGroup>
        ) : null}
      </div>
      <MonthLineEditDialog
        item={item}
        year={year}
        month={month}
        accounts={accounts}
        open={editing}
        onOpenChange={setEditing}
      />
    </>
  );
}

function MonthLineEditDialog({
  item,
  year,
  month,
  accounts,
  open,
  onOpenChange,
}: {
  item: MonthLineItem;
  year: number;
  month: number;
  accounts: Account[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState(item.label);
  const [dayOfMonth, setDayOfMonth] = useState(item.dayOfMonth);
  const [accountId, setAccountId] = useState(item.accountId);
  const [amountDraft, setAmountDraft] = useState(String(item.amountCents / 100));

  useEffect(() => {
    if (!open) return;
    setLabel(item.label);
    setDayOfMonth(item.dayOfMonth);
    setAccountId(item.accountId);
    setAmountDraft(String(item.amountCents / 100));
  }, [item.accountId, item.amountCents, item.dayOfMonth, item.label, open]);

  function save() {
    const amountCents = parseMoneyToCents(amountDraft);
    const patch = {
      label: label.trim() || item.label,
      dayOfMonth,
      accountId,
      expectedAmountCents: amountCents ?? item.amountCents,
    };
    startTransition(() => {
      if (item.kind === "income") {
        void updateIncomeEntry(item.id, patch);
      } else {
        void updatePaymentEntry(item.id, patch);
      }
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier {item.label}</DialogTitle>
          <DialogDescription>
            Ajuste cette ligne ici, sans ouvrir le tableau complet.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor={`line-label-${item.id}`}>Libellé</FieldLabel>
            <SpreadsheetInput
              appearance="field"
              id={`line-label-${item.id}`}
              ariaLabel="Libellé"
              value={label}
              onCommit={setLabel}
            />
          </Field>
          <Field>
            <FieldLabel>Échéance</FieldLabel>
            <MonthDayPicker
              appearance="field"
              year={year}
              month={month}
              dayOfMonth={dayOfMonth}
              onChange={setDayOfMonth}
              ariaLabel="Échéance"
            />
          </Field>
          <Field>
            <FieldLabel>Compte</FieldLabel>
            <AccountSelect
              appearance="field"
              accounts={accounts}
              value={accountId}
              onChange={setAccountId}
              ariaLabel="Compte"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`line-amount-${item.id}`}>Montant</FieldLabel>
            <SpreadsheetInput
              appearance="field"
              id={`line-amount-${item.id}`}
              ariaLabel="Montant"
              suffix="CAD"
              inputMode="decimal"
              value={amountDraft}
              onCommit={setAmountDraft}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Annuler</DialogClose>
          <Button disabled={pending} onClick={save}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

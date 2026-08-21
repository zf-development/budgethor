"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { SettingsIcon } from "@/components/icons";

import { updateDebt } from "@/actions/budget";
import { DatePicker } from "@/components/date-picker";
import { DebtNextStep } from "@/components/debt-next-step";
import { SpreadsheetInput } from "@/components/spreadsheet-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  debtEffectivePrincipal,
  debtProgressPercent,
  inferredPrincipalCents,
  paidMonthsSince,
} from "@/lib/debts";
import { parseMoneyToCents, parsePercentToBps, formatBpsAsPercent } from "@/lib/money";
import { MoneyText } from "@/components/money-text";
import type { Debt } from "@/db/schema";

export function DebtDetailsDialog({ debt }: { debt: Debt }) {
  const [open, setOpen] = useState(false);
  const [payingSince, setPayingSince] = useState(debt.payingSince);
  const [principalDraft, setPrincipalDraft] = useState(String(debt.principalCents / 100));
  const [rateDraft, setRateDraft] = useState(formatBpsAsPercent(debt.annualRateBps));
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setPayingSince(debt.payingSince);
    setPrincipalDraft(String(debt.principalCents / 100));
    setRateDraft(formatBpsAsPercent(debt.annualRateBps));
  }, [debt.annualRateBps, debt.payingSince, debt.principalCents, open]);

  const inferred = useMemo(
    () =>
      inferredPrincipalCents({
        balanceCents: debt.balanceCents,
        monthlyPaymentCents: debt.monthlyPaymentCents,
        payingSince,
      }),
    [debt.balanceCents, debt.monthlyPaymentCents, payingSince],
  );
  const monthsPaid = paidMonthsSince(payingSince);
  const previewPrincipal = Math.max(
    parseMoneyToCents(principalDraft) ?? 0,
    payingSince ? inferred : 0,
    debt.balanceCents,
  );
  const previewPercent = debtProgressPercent(debt.balanceCents, previewPrincipal);

  function applyPayingSince(next: string) {
    setPayingSince(next);
    if (!next || debt.monthlyPaymentCents <= 0) return;
    const nextPrincipal = inferredPrincipalCents({
      balanceCents: debt.balanceCents,
      monthlyPaymentCents: debt.monthlyPaymentCents,
      payingSince: next,
    });
    setPrincipalDraft(String(nextPrincipal / 100));
  }

  function save() {
    const principalCents = parseMoneyToCents(principalDraft);
    const annualRateBps = parsePercentToBps(rateDraft);
    startTransition(() => {
      void updateDebt(debt.id, {
        payingSince,
        annualRateBps: annualRateBps ?? 0,
        principalCents:
          principalCents === null
            ? debtEffectivePrincipal({ ...debt, payingSince })
            : Math.max(principalCents, debt.balanceCents),
      });
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Détails ${debt.creditor}`} />}
      >
        <SettingsIcon size={16} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Détails — {debt.creditor}</DialogTitle>
          <DialogDescription>
            Infos de suivi, sans encombrer le tableau. La date de début sert à estimer le vrai
            progrès.
          </DialogDescription>
        </DialogHeader>
        <DebtNextStep debt={debt} />
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel>Je paie depuis</FieldLabel>
            <DatePicker
              allowEmpty
              disableFuture
              emptyLabel="Pas encore indiqué"
              ariaLabel="Date de début des paiements"
              value={payingSince}
              onChange={applyPayingSince}
            />
            <FieldDescription>
              {payingSince && monthsPaid > 0
                ? `${monthsPaid} mois de paiements, soit environ ${previewPercent} % du chemin.`
                : "Indique le premier mois où tu as commencé à rembourser."}
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor={`principal-${debt.id}`}>Montant de départ</FieldLabel>
            <SpreadsheetInput
              appearance="field"
              id={`principal-${debt.id}`}
              ariaLabel="Montant de départ"
              suffix="CAD"
              inputMode="decimal"
              value={principalDraft}
              onCommit={setPrincipalDraft}
            />
            <FieldDescription>
              Ce que tu devais au début. Progrès actuel :{" "}
              <MoneyText cents={debt.balanceCents} /> restant sur{" "}
              <MoneyText cents={previewPrincipal} />.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor={`rate-${debt.id}`}>Taux d’intérêt annuel</FieldLabel>
            <SpreadsheetInput
              appearance="field"
              id={`rate-${debt.id}`}
              ariaLabel="Taux d’intérêt annuel"
              suffix="%"
              inputMode="decimal"
              value={rateDraft}
              onCommit={setRateDraft}
            />
            <FieldDescription>
              Sert à Avalanche et à l’économie d’intérêts. Laisse 0 si tu ne le connais pas.
            </FieldDescription>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Annuler</DialogClose>
          <Button onClick={save}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

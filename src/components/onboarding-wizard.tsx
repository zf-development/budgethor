"use client";

import { useMemo, useState, useTransition } from "react";
import { PlusIcon, CircleHelpIcon } from "@/components/icons";

import {
  completeOnboarding,
  skipOnboarding,
  type OnboardingAccountInput,
  type OnboardingDebtInput,
  type OnboardingIncomeInput,
  type OnboardingPaymentInput,
} from "@/actions/budget";
import { AccountTypeSelect } from "@/components/account-select";
import { CadenceSelect } from "@/components/cadence-select";
import { DatePicker } from "@/components/date-picker";
import { MonthDayPicker } from "@/components/month-day-picker";
import { SpreadsheetInput } from "@/components/spreadsheet-input";
import { ThemeToggle } from "@/components/theme-toggle";
import { WizardShell, WizardStep } from "@/components/wizard-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { parseMoneyToCents } from "@/lib/money";
import { todayIsoDate } from "@/lib/dates";
import { ACCOUNT_TYPE_LABELS, accountOpeningLabel, accountOptionLabel } from "@/lib/accounts";

type AccountDraft = OnboardingAccountInput;
type IncomeDraft = OnboardingIncomeInput;
type PaymentDraft = OnboardingPaymentInput;
type DebtDraft = OnboardingDebtInput;

const TOTAL_STEPS = 7;

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [accounts, setAccounts] = useState<AccountDraft[]>([
    { name: "Banque", type: "asset", openingBalanceCents: 0 },
    { name: "Mastercard", type: "liability", openingBalanceCents: 0 },
  ]);
  const [incomes, setIncomes] = useState<IncomeDraft[]>([
    {
      label: "Paie",
      accountIndex: 0,
      cadence: "biweek",
      nextPayDate: todayIsoDate(),
      expectedAmountCents: 0,
      notes: "",
    },
  ]);
  const [payments, setPayments] = useState<PaymentDraft[]>([
    {
      label: "Loyer",
      accountIndex: 0,
      dayOfMonth: 1,
      expectedAmountCents: 0,
      notes: "",
      debtIndex: null,
    },
    {
      label: "Électricité",
      accountIndex: 0,
      dayOfMonth: 1,
      expectedAmountCents: 0,
      notes: "",
      debtIndex: null,
    },
  ]);
  const [debts, setDebts] = useState<DebtDraft[]>([]);
  const [isPending, startTransition] = useTransition();

  const accountItems = useMemo(
    () =>
      Object.fromEntries(
        accounts.map((account, index) => [
          String(index),
          accountOptionLabel({
            name: account.name || `Compte ${index + 1}`,
            type: account.type,
          }),
        ]),
      ),
    [accounts],
  );

  const title = useMemo(() => {
    return [
      "Bienvenue",
      "Tes comptes",
      "Soldes au 1er",
      "Paies récurrentes",
      "Paiements récurrents",
      "Dettes",
      "Récapitulatif",
    ][step - 1];
  }, [step]);

  const description = useMemo(() => {
    return [
      "Budgethor reprend ton tableur : paies, comptes, prévu/réel, dettes. Tu pourras tout modifier après.",
      "Crée tes poches d’argent. Argent = banque, PayPal, espèces. Crédit = carte : les charges vont dessus, le paiement de la carte se fait depuis un compte d’argent.",
      "Solde au 1er pour un compte d’argent, dû au 1er pour une carte. Ce n’est pas un solde live.",
      "Tes revenus : répétition (semaine, 2 semaines ou mois) et date de la prochaine paie.",
      "Loyer, électricité, internet : factures du mois, compte débité et date. Les dettes viennent après.",
      "Prêts et cartes à solde. Tu peux lier une dette à un compte (ex. Mastercard) : les charges dessus l’augmentent, la mensualité depuis la banque la diminue.",
      "On génère le mois courant à partir de tes modèles. Tu pourras relancer cet assistant dans les réglages.",
    ][step - 1];
  }, [step]);

  function finish() {
    startTransition(() => {
      void completeOnboarding({
        accounts: accounts.filter((account) => account.name.trim()),
        incomes: incomes.filter((row) => row.label.trim()),
        payments: payments.filter((row) => row.label.trim()),
        debts: debts.filter((row) => row.creditor.trim()),
      });
    });
  }

  return (
    <div className="min-h-full bg-background px-4">
      <div className="mx-auto flex max-w-2xl items-center justify-between pt-6">
        <p className="font-heading text-lg">Budgethor</p>
        <ThemeToggle />
      </div>
      <WizardShell
        title={title}
        description={description}
        step={step}
        total={TOTAL_STEPS}
        footer={
          <>
            <div className="flex gap-2">
              {step > 1 ? (
                <Button variant="outline" disabled={isPending} onClick={() => setStep(step - 1)}>
                  Retour
                </Button>
              ) : null}
              <Button
                variant="ghost"
                disabled={isPending}
                onClick={() => {
                  startTransition(() => {
                    void skipOnboarding();
                  });
                }}
              >
                Passer
              </Button>
            </div>
            {step < TOTAL_STEPS ? (
              <Button disabled={isPending} onClick={() => setStep(step + 1)}>
                Continuer
              </Button>
            ) : (
              <Button disabled={isPending} onClick={finish}>
                {isPending ? <Spinner data-icon="inline-start" /> : null}
                Générer le mois
              </Button>
            )}
          </>
        }
      >
        {step === 1 ? (
          <WizardStep>
            <Alert>
              <CircleHelpIcon />
              <AlertTitle>À savoir</AlertTitle>
              <AlertDescription>
                <p>Les impayés restent collés à leur mois d’origine.</p>
                <p>Cocher un paiement lié à une dette diminue le solde de cette dette.</p>
                <p>Devise : dollar canadien, interface en français.</p>
              </AlertDescription>
            </Alert>
          </WizardStep>
        ) : null}

        {step === 2 ? (
          <WizardStep>
            <Alert>
              <CircleHelpIcon />
              <AlertTitle>Deux sortes de comptes</AlertTitle>
              <AlertDescription>
                <p>
                  <strong>Argent</strong> : banque, PayPal, espèces. Les paies arrivent ici, les
                  paiements en partent.
                </p>
                <p>
                  <strong>Crédit</strong> : carte. Les lignes sont des charges. Pour payer la
                  carte, tu crées un paiement depuis un compte d’argent, pas sur la carte.
                </p>
              </AlertDescription>
            </Alert>
            <FieldGroup className="gap-3">
              {accounts.map((account, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[1fr_160px_auto] sm:items-end">
                  <Field>
                    <FieldLabel>Nom</FieldLabel>
                    <SpreadsheetInput
                      appearance="field"
                      ariaLabel="Nom du compte"
                      value={account.name}
                      onCommit={(name) => {
                        setAccounts((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, name } : row,
                          ),
                        );
                      }}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Type</FieldLabel>
                    <AccountTypeSelect
                      appearance="field"
                      size="default"
                      ariaLabel="Type de compte"
                      value={account.type}
                      onChange={(type) => {
                        setAccounts((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, type } : row,
                          ),
                        );
                      }}
                    />
                  </Field>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setAccounts((current) => current.filter((_, rowIndex) => rowIndex !== index))
                    }
                  >
                    Retirer
                  </Button>
                </div>
              ))}
            </FieldGroup>
            <Button
              variant="outline"
              onClick={() =>
                setAccounts((current) => [
                  ...current,
                  { name: "", type: "asset", openingBalanceCents: 0 },
                ])
              }
            >
              <PlusIcon size={16} data-icon="inline-start" />
              Ajouter un compte
            </Button>
          </WizardStep>
        ) : null}

        {step === 3 ? (
          <WizardStep>
            <FieldGroup className="gap-3">
              {accounts.map((account, index) => (
                <Field key={index}>
                  <FieldLabel>
                    {account.name || `Compte ${index + 1}`} · {ACCOUNT_TYPE_LABELS[account.type]}
                  </FieldLabel>
                  <FieldDescription>{accountOpeningLabel(account.type)}</FieldDescription>
                  <SpreadsheetInput
                    appearance="field"
                    ariaLabel={`${accountOpeningLabel(account.type)} ${account.name}`}
                    inputMode="decimal"
                    suffix="CAD"
                    value={String(account.openingBalanceCents / 100)}
                    onCommit={(next) => {
                      const cents = parseMoneyToCents(next);
                      if (cents === null) return;
                      setAccounts((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, openingBalanceCents: cents } : row,
                        ),
                      );
                    }}
                  />
                </Field>
              ))}
            </FieldGroup>
          </WizardStep>
        ) : null}

        {step === 4 ? (
          <WizardStep>
            <FieldGroup className="gap-3">
              {incomes.map((income, index) => (
                <div key={index} className="flex flex-col gap-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Field>
                      <FieldLabel>Libellé</FieldLabel>
                      <SpreadsheetInput
                      appearance="field"
                        ariaLabel="Libellé paie"
                        value={income.label}
                        onCommit={(label) =>
                          setIncomes((current) =>
                            current.map((row, rowIndex) =>
                              rowIndex === index ? { ...row, label } : row,
                            ),
                          )
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Compte crédité</FieldLabel>
                      <Select
                        value={String(income.accountIndex)}
                        items={accountItems}
                        onValueChange={(value) => {
                          if (!value) return;
                          setIncomes((current) =>
                            current.map((row, rowIndex) =>
                              rowIndex === index ? { ...row, accountIndex: Number(value) } : row,
                            ),
                          );
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {accounts.map((account, accountIndex) => (
                              <SelectItem key={accountIndex} value={String(accountIndex)}>
                                {accountOptionLabel({
                                  name: account.name || `Compte ${accountIndex + 1}`,
                                  type: account.type,
                                })}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel>Montant prévu</FieldLabel>
                      <SpreadsheetInput
                      appearance="field"
                        ariaLabel="Montant prévu"
                        inputMode="decimal"
                        suffix="CAD"
                        value={String(income.expectedAmountCents / 100)}
                        onCommit={(next) => {
                          const cents = parseMoneyToCents(next);
                          if (cents === null) return;
                          setIncomes((current) =>
                            current.map((row, rowIndex) =>
                              rowIndex === index ? { ...row, expectedAmountCents: cents } : row,
                            ),
                          );
                        }}
                      />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel>Répétition</FieldLabel>
                    <CadenceSelect
                      variant="toggle"
                      ariaLabel="Répétition"
                      value={income.cadence}
                      onChange={(cadence) =>
                        setIncomes((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, cadence } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Prochaine paie</FieldLabel>
                    <DatePicker
                      ariaLabel="Prochaine paie"
                      value={income.nextPayDate}
                      onChange={(nextPayDate) =>
                        setIncomes((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, nextPayDate } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                </div>
              ))}
            </FieldGroup>
            <Button
              variant="outline"
              onClick={() =>
                setIncomes((current) => [
                  ...current,
                  {
                    label: "Paie",
                    accountIndex: 0,
                    cadence: "biweek",
                    nextPayDate: todayIsoDate(),
                    expectedAmountCents: 0,
                    notes: "",
                  },
                ])
              }
            >
              <PlusIcon size={16} data-icon="inline-start" />
              Ajouter une paie
            </Button>
          </WizardStep>
        ) : null}

        {step === 5 ? (
          <WizardStep>
            <FieldGroup className="gap-3">
              {payments.map((payment, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-4">
                  <Field>
                    <FieldLabel>Libellé</FieldLabel>
                    <SpreadsheetInput
                      appearance="field"
                      ariaLabel="Libellé paiement"
                      value={payment.label}
                      onCommit={(label) =>
                        setPayments((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, label } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Compte débité</FieldLabel>
                    <Select
                      value={String(payment.accountIndex)}
                      items={accountItems}
                      onValueChange={(value) => {
                        if (!value) return;
                        setPayments((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, accountIndex: Number(value) } : row,
                          ),
                        );
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {accounts.map((account, accountIndex) => (
                            <SelectItem key={accountIndex} value={String(accountIndex)}>
                              {accountOptionLabel({
                                name: account.name || `Compte ${accountIndex + 1}`,
                                type: account.type,
                              })}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Date chaque mois</FieldLabel>
                    <MonthDayPicker
                      appearance="field"
                      ariaLabel="Date de paiement chaque mois"
                      dayOfMonth={payment.dayOfMonth}
                      onChange={(dayOfMonth) =>
                        setPayments((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, dayOfMonth } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Montant prévu</FieldLabel>
                    <SpreadsheetInput
                      appearance="field"
                      ariaLabel="Montant prévu"
                      inputMode="decimal"
                      suffix="CAD"
                      value={String(payment.expectedAmountCents / 100)}
                      onCommit={(next) => {
                        const cents = parseMoneyToCents(next);
                        if (cents === null) return;
                        setPayments((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, expectedAmountCents: cents } : row,
                          ),
                        );
                      }}
                    />
                  </Field>
                </div>
              ))}
            </FieldGroup>
            <Alert>
              <CircleHelpIcon />
              <AlertTitle>Factures du mois</AlertTitle>
              <AlertDescription>
                Loyer, électricité, téléphone, abonnements : ce n’est pas une dette. Les prêts
                (solde à rembourser) se saisissent à l’étape suivante ; leur mensualité s’ajoute
                automatiquement ici.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              onClick={() =>
                setPayments((current) => [
                  ...current,
                  {
                    label: "Facture",
                    accountIndex: 0,
                    dayOfMonth: 1,
                    expectedAmountCents: 0,
                    notes: "",
                    debtIndex: null,
                  },
                ])
              }
            >
              <PlusIcon size={16} data-icon="inline-start" />
              Ajouter une facture
            </Button>
          </WizardStep>
        ) : null}

        {step === 6 ? (
          <WizardStep>
            <FieldGroup className="gap-3">
              {debts.map((debt, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-2">
                  <Field>
                    <FieldLabel className="sr-only">Créancier</FieldLabel>
                    <SpreadsheetInput
                      appearance="field"
                      ariaLabel="Créancier"
                      value={debt.creditor}
                      onCommit={(creditor) =>
                        setDebts((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, creditor } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel className="sr-only">Compte lié</FieldLabel>
                    <Select
                      value={debt.accountIndex === null ? "none" : String(debt.accountIndex)}
                      items={{ none: "Aucun compte", ...accountItems }}
                      onValueChange={(next) =>
                        setDebts((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index
                              ? {
                                  ...row,
                                  accountIndex: !next || next === "none" ? null : Number(next),
                                }
                              : row,
                          ),
                        )
                      }
                    >
                      <SelectTrigger size="sm" className="w-full" aria-label="Compte lié">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="none">Aucun compte</SelectItem>
                          {accounts.map((account, accountIndex) => (
                            <SelectItem key={accountIndex} value={String(accountIndex)}>
                              {accountOptionLabel({
                                name: account.name || `Compte ${accountIndex + 1}`,
                                type: account.type,
                              })}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel className="sr-only">Solde</FieldLabel>
                    <SpreadsheetInput
                      appearance="field"
                      ariaLabel="Solde"
                      inputMode="decimal"
                      suffix="CAD"
                      value={String(debt.balanceCents / 100)}
                      onCommit={(next) => {
                        const cents = parseMoneyToCents(next);
                        if (cents === null) return;
                        setDebts((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, balanceCents: cents } : row,
                          ),
                        );
                      }}
                    />
                  </Field>
                  <Field>
                    <FieldLabel className="sr-only">Paiement mensuel</FieldLabel>
                    <SpreadsheetInput
                      appearance="field"
                      ariaLabel="Paiement mensuel"
                      inputMode="decimal"
                      suffix="CAD"
                      value={String(debt.monthlyPaymentCents / 100)}
                      onCommit={(next) => {
                        const cents = parseMoneyToCents(next);
                        if (cents === null) return;
                        setDebts((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, monthlyPaymentCents: cents } : row,
                          ),
                        );
                      }}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Date de paiement</FieldLabel>
                    <MonthDayPicker
                      appearance="field"
                      ariaLabel="Date de paiement"
                      dayOfMonth={debt.dayOfMonth}
                      onChange={(dayOfMonth) =>
                        setDebts((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, dayOfMonth } : row,
                          ),
                        )
                      }
                    />
                  </Field>
                </div>
              ))}
            </FieldGroup>
            <Button
              variant="outline"
              onClick={() =>
                setDebts((current) => [
                  ...current,
                  { creditor: "", accountIndex: null, balanceCents: 0, monthlyPaymentCents: 0, dayOfMonth: 1 },
                ])
              }
            >
              <PlusIcon size={16} data-icon="inline-start" />
              Ajouter une dette
            </Button>
          </WizardStep>
        ) : null}

        {step === 7 ? (
          <WizardStep>
            <Card>
              <CardHeader>
                <CardTitle>Prêt à générer</CardTitle>
                <CardDescription>
                  Ces modèles seront copiés dans le mois en cours.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p>{accounts.filter((row) => row.name.trim()).length} compte(s)</p>
                <p>{incomes.filter((row) => row.label.trim()).length} paie(s) récurrente(s)</p>
                <p>
                  {payments.filter((row) => row.label.trim()).length} facture(s) récurrente(s)
                </p>
                <p>{debts.filter((row) => row.creditor.trim()).length} dette(s)</p>
              </CardContent>
            </Card>
          </WizardStep>
        ) : null}
      </WizardShell>
    </div>
  );
}

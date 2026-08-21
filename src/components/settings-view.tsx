"use client";

import { useState, useTransition } from "react";
import { CircleHelpIcon, RefreshCcwIcon } from "@/components/icons";

import {
  createAccount,
  createIncomeTemplate,
  createPaymentTemplate,
  deleteAccount,
  reopenOnboarding,
  updateAccount,
} from "@/actions/budget";
import { AccountDraftRow } from "@/components/account-draft-row";
import { AccountTypeSelect } from "@/components/account-select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CsvImportDialog } from "@/components/csv-import-dialog";
import { DeleteRowButton } from "@/components/delete-row-button";
import { IncomeTemplateDraft } from "@/components/income-template-draft";
import { IncomeTemplateItem } from "@/components/income-template-item";
import { PageHeader } from "@/components/page-header";
import { PaymentTemplateDraft } from "@/components/payment-template-draft";
import { PaymentTemplateItem } from "@/components/payment-template-item";
import { RecurringList } from "@/components/recurring-list";
import { SpreadsheetInput } from "@/components/spreadsheet-input";
import { SpreadsheetTable } from "@/components/spreadsheet-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Account, Debt, IncomeTemplate, PaymentTemplate } from "@/db/schema";

export function SettingsView({
  accounts,
  incomeTemplates,
  paymentTemplates,
  debts,
  sqlitePath,
}: {
  accounts: Account[];
  incomeTemplates: IncomeTemplate[];
  paymentTemplates: PaymentTemplate[];
  debts: Debt[];
  sqlitePath: string;
}) {
  const [, startTransition] = useTransition();
  const [accountDraft, setAccountDraft] = useState(false);
  const [incomeDraft, setIncomeDraft] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState(false);
  const firstAccountId = accounts[0]?.id;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Réglages"
        description="Comptes d’argent ou de crédit, paies et factures récurrentes, base locale."
      />

      <SpreadsheetTable
        title="Comptes"
        description="Argent (banque, PayPal) ou crédit (carte). Une paie ou un paiement est toujours rattaché à un compte."
        columns={[
          { key: "name", header: "Nom" },
          { key: "type", header: "Type" },
          { key: "actions", header: "", className: "w-px whitespace-nowrap" },
        ]}
        addLabel="Ajouter un compte"
        addDisabled={accountDraft}
        onAdd={() => setAccountDraft(true)}
        leading={
          accountDraft ? (
            <AccountDraftRow
              onConfirm={(name, type) => createAccount(name, type)}
              onCancel={() => setAccountDraft(false)}
            />
          ) : null
        }
      >
        {accounts.map((account) => (
          <TableRow key={account.id}>
            <TableCell>
              <SpreadsheetInput
                ariaLabel="Nom du compte"
                value={account.name}
                onCommit={(name) => {
                  startTransition(() => {
                    void updateAccount(account.id, { name });
                  });
                }}
              />
            </TableCell>
            <TableCell>
              <AccountTypeSelect
                ariaLabel="Type de compte"
                value={account.type}
                onChange={(type) => {
                  startTransition(() => {
                    void updateAccount(account.id, { type });
                  });
                }}
              />
            </TableCell>
            <TableCell>
              <DeleteRowButton
                title={`Supprimer « ${account.name} » ?`}
                description="Les paies et paiements liés à ce compte seront aussi supprimés."
                onClick={() => {
                  startTransition(() => {
                    void deleteAccount(account.id);
                  });
                }}
              />
            </TableCell>
          </TableRow>
        ))}
      </SpreadsheetTable>

      <RecurringList
        title="Paies récurrentes"
        description="Répétition et prochaine paie : le mois se remplit tout seul (une ligne par date)."
        addLabel="Ajouter une paie"
        addDisabled={incomeDraft || !firstAccountId}
        emptyTitle="Aucune paie récurrente"
        emptyDescription="Ajoute une paie pour remplir les mois suivants automatiquement."
        onAdd={firstAccountId ? () => setIncomeDraft(true) : undefined}
        draft={
          incomeDraft && firstAccountId ? (
            <IncomeTemplateDraft
              accounts={accounts}
              defaultAccountId={firstAccountId}
              onConfirm={(values) => createIncomeTemplate(values)}
              onCancel={() => setIncomeDraft(false)}
            />
          ) : null
        }
      >
        {incomeTemplates.map((row) => (
          <IncomeTemplateItem key={row.id} template={row} accounts={accounts} />
        ))}
      </RecurringList>

      <RecurringList
        title="Paiements récurrents"
        description="Loyer, électricité, abonnements. Déplie une ligne pour modifier. Les mensualités de dettes s’ajoutent toutes seules."
        addLabel="Ajouter une facture"
        addDisabled={paymentDraft || !firstAccountId}
        emptyTitle="Aucune facture récurrente"
        emptyDescription="Ajoute un loyer, un abonnement ou une facture qui revient chaque mois."
        onAdd={firstAccountId ? () => setPaymentDraft(true) : undefined}
        draft={
          paymentDraft && firstAccountId ? (
            <PaymentTemplateDraft
              accounts={accounts}
              debts={debts}
              defaultAccountId={firstAccountId}
              onConfirm={(values) => createPaymentTemplate(values)}
              onCancel={() => setPaymentDraft(false)}
            />
          ) : null
        }
      >
        {paymentTemplates.map((row) => (
          <PaymentTemplateItem
            key={row.id}
            template={row}
            accounts={accounts}
            debts={debts}
          />
        ))}
      </RecurringList>

      <Card>
        <CardHeader>
          <CardTitle>Données locales</CardTitle>
          <CardDescription>Assistant d’accueil, import CSV et fichier SQLite sur cette machine.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CsvImportDialog accounts={accounts} />
          <Alert>
            <CircleHelpIcon />
            <AlertTitle>Fichier SQLite</AlertTitle>
            <AlertDescription className="font-mono">{sqlitePath}</AlertDescription>
          </Alert>
          <ConfirmDialog
            title="Relancer l’assistant ?"
            description="Tu reviendras à l’accueil. Tes comptes et lignes actuelles restent en place, tu pourras les revoir."
            confirmLabel="Relancer"
            onConfirm={() => {
              startTransition(() => {
                void reopenOnboarding();
              });
            }}
            trigger={<Button variant="outline" />}
          >
            <RefreshCcwIcon size={16} data-icon="inline-start" />
            Relancer l’assistant
          </ConfirmDialog>
        </CardContent>
      </Card>
    </div>
  );
}

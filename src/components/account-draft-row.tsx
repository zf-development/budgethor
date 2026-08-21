"use client";

import { useState, useTransition } from "react";

import { AccountTypeSelect } from "@/components/account-select";
import { DraftRowActions } from "@/components/draft-row-actions";
import { SpreadsheetInput } from "@/components/spreadsheet-input";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Account } from "@/db/schema";

export function AccountDraftRow({
  onConfirm,
  onCancel,
}: {
  onConfirm: (name: string, type: Account["type"]) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [type, setType] = useState<Account["type"]>("asset");

  function confirm() {
    const nextName = name.trim();
    if (!nextName) return;
    startTransition(async () => {
      await onConfirm(nextName, type);
      onCancel();
    });
  }

  return (
    <TableRow className="bg-muted/40 hover:bg-muted/40">
      <TableCell>
        <SpreadsheetInput
          appearance="field"
          ariaLabel="Nom du compte"
          placeholder="Nouveau compte"
          autoFocus
          commitOnChange
          value={name}
          onCommit={setName}
        />
      </TableCell>
      <TableCell>
        <AccountTypeSelect
          appearance="field"
          ariaLabel="Type de compte"
          value={type}
          onChange={setType}
        />
      </TableCell>
      <TableCell>
        <DraftRowActions
          disabled={!name.trim()}
          pending={pending}
          onConfirm={confirm}
          onCancel={onCancel}
        />
      </TableCell>
    </TableRow>
  );
}

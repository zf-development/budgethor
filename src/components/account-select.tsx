"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fieldAppearanceClassName,
  fieldControlClassName,
  type FieldAppearance,
} from "@/components/field-appearance";
import { ACCOUNT_TYPE_LABELS, accountOptionLabel } from "@/lib/accounts";
import type { Account, Debt } from "@/db/schema";
import { cn } from "@/lib/utils";

export const ACCOUNT_TYPE_ITEMS = ACCOUNT_TYPE_LABELS;

export function AccountTypeSelect({
  value,
  onChange,
  ariaLabel,
  className,
  size = "sm",
  appearance = "plain",
}: {
  value: Account["type"];
  onChange: (type: Account["type"]) => void;
  ariaLabel: string;
  className?: string;
  size?: "sm" | "default";
  appearance?: FieldAppearance;
}) {
  return (
    <div className="block w-full min-w-0">
      <Select
        value={value}
        items={ACCOUNT_TYPE_ITEMS}
        onValueChange={(next) => {
          if (next !== "asset" && next !== "liability") return;
          onChange(next);
        }}
      >
        <SelectTrigger
          size={size}
          className={fieldControlClassName(
            appearance,
            cn("justify-between", className),
          )}
          aria-label={ariaLabel}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="asset">{ACCOUNT_TYPE_ITEMS.asset}</SelectItem>
            <SelectItem value="liability">{ACCOUNT_TYPE_ITEMS.liability}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export function AccountSelect({
  accounts,
  value,
  onChange,
  ariaLabel,
  className,
  allowNone = false,
  noneLabel = "Aucun",
  appearance = "plain",
}: {
  accounts: Account[];
  value: string;
  onChange: (accountId: string) => void;
  ariaLabel: string;
  className?: string;
  allowNone?: boolean;
  noneLabel?: string;
  appearance?: FieldAppearance;
}) {
  const items = {
    ...(allowNone ? { none: noneLabel } : {}),
    ...Object.fromEntries(
      accounts.map((account) => [account.id, accountOptionLabel(account)]),
    ),
  };

  return (
    <Select
      value={value || "none"}
      items={items}
      onValueChange={(next) => {
        if (!next || next === "none") {
          if (allowNone) onChange("");
          return;
        }
        onChange(next);
      }}
    >
      <SelectTrigger
        size="sm"
        className={fieldAppearanceClassName(appearance, cn("w-full min-w-28 max-w-44", className))}
        aria-label={ariaLabel}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {allowNone ? <SelectItem value="none">{noneLabel}</SelectItem> : null}
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              {accountOptionLabel(account)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function DebtSelect({
  debts,
  value,
  onChange,
  ariaLabel,
  disabled,
  className,
  appearance = "plain",
  noneLabel = "Pas une dette",
  excludeIds = [],
}: {
  debts: Debt[];
  value: string | null;
  onChange: (debtId: string | null) => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  appearance?: FieldAppearance;
  noneLabel?: string;
  excludeIds?: string[];
}) {
  const options = debts.filter((debt) => !excludeIds.includes(debt.id));
  const items = {
    none: noneLabel,
    ...Object.fromEntries(options.map((debt) => [debt.id, debt.creditor])),
  };

  return (
    <Select
      value={value ?? "none"}
      items={items}
      disabled={disabled}
      onValueChange={(next) => {
        if (!next || next === "none") onChange(null);
        else onChange(next);
      }}
    >
      <SelectTrigger
        size="sm"
        disabled={disabled}
        className={fieldAppearanceClassName(appearance, cn("w-full min-w-28 max-w-44", className))}
        aria-label={ariaLabel}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="none">{noneLabel}</SelectItem>
          {options.map((debt) => (
            <SelectItem key={debt.id} value={debt.id}>
              {debt.creditor}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

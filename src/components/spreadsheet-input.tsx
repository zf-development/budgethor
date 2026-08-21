"use client";

import { useEffect, useRef, useState } from "react";

import { fieldAppearanceClassName, type FieldAppearance } from "@/components/field-appearance";
import { MoneyText } from "@/components/money-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { parseMoneyToCents } from "@/lib/money";
import { cn } from "@/lib/utils";

export function SpreadsheetInput({
  id,
  value,
  onCommit,
  className,
  placeholder,
  inputMode,
  ariaLabel,
  suffix,
  appearance = "plain",
  commitOnChange = false,
  autoFocus = false,
}: {
  id?: string;
  value: string;
  onCommit: (next: string) => void;
  className?: string;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  ariaLabel: string;
  suffix?: string;
  appearance?: FieldAppearance;
  commitOnChange?: boolean;
  autoFocus?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(appearance === "field");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (appearance === "field" || !editing) return;
    const node = inputRef.current;
    if (!node) return;
    node.focus();
    node.select();
  }, [appearance, editing]);

  function commit(next = draft) {
    if (next !== value) onCommit(next);
    if (appearance === "plain") setEditing(false);
  }

  function cancel() {
    setDraft(value);
    if (appearance === "plain") setEditing(false);
  }

  const controlClassName = cn(
    "h-8 w-full min-w-0 rounded-3xl px-3 text-sm font-normal",
    className,
  );

  const shared = {
    id,
    ref: inputRef,
    autoFocus,
    "aria-label": ariaLabel,
    value: draft,
    placeholder,
    inputMode,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setDraft(next);
      if (commitOnChange) onCommit(next);
    },
    onBlur: () => {
      if (!commitOnChange) commit();
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") event.currentTarget.blur();
      if (event.key === "Escape") {
        event.preventDefault();
        cancel();
      }
    },
  };

  if (appearance === "plain" && !editing) {
    const money = inputMode === "decimal" ? parseMoneyToCents(value) : null;
    const empty = value.trim() === "";
    return (
      <div className="block w-full min-w-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={ariaLabel}
          className={fieldAppearanceClassName(
            "plain",
            cn(
              "flex max-w-full shrink justify-start",
              controlClassName,
              empty && "text-muted-foreground",
            ),
          )}
          onClick={() => setEditing(true)}
        >
          {empty ? (
            (placeholder ?? "—")
          ) : money !== null ? (
            <MoneyText cents={money} />
          ) : (
            <span className="truncate">{value}</span>
          )}
        </Button>
      </div>
    );
  }

  if (suffix && appearance === "field") {
    return (
      <InputGroup className={className}>
        <InputGroupInput {...shared} />
        <InputGroupAddon align="inline-end">
          <InputGroupText>{suffix}</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    );
  }

  return (
    <div className="block w-full min-w-0">
      <Input className={controlClassName} {...shared} />
    </div>
  );
}

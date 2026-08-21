"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { INCOME_CADENCES, isIncomeCadence, type IncomeCadence } from "@/lib/income";
import { cn } from "@/lib/utils";

const CADENCE_ITEMS = { ...INCOME_CADENCES };

export function CadenceSelect({
  value,
  onChange,
  ariaLabel,
  variant = "select",
  className,
}: {
  value: IncomeCadence;
  onChange: (cadence: IncomeCadence) => void;
  ariaLabel: string;
  variant?: "select" | "toggle";
  className?: string;
}) {
  if (variant === "toggle") {
    return (
      <ToggleGroup
        size="sm"
        className={cn("flex-wrap", className)}
        value={[value]}
        onValueChange={(next) => {
          const cadence = next[0];
          if (cadence && isIncomeCadence(cadence)) onChange(cadence);
        }}
      >
        {(Object.keys(INCOME_CADENCES) as IncomeCadence[]).map((cadence) => (
          <ToggleGroupItem key={cadence} value={cadence}>
            {INCOME_CADENCES[cadence]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    );
  }

  return (
    <Select
      value={value}
      items={CADENCE_ITEMS}
      onValueChange={(next) => {
        if (next && isIncomeCadence(next)) onChange(next);
      }}
    >
      <SelectTrigger size="sm" className={cn("w-full min-w-36", className)} aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {(Object.keys(INCOME_CADENCES) as IncomeCadence[]).map((cadence) => (
            <SelectItem key={cadence} value={cadence}>
              {INCOME_CADENCES[cadence]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

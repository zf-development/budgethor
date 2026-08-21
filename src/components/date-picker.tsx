"use client";

import { CalendarDaysIcon } from "@/components/icons";

import { AppCalendar } from "@/components/app-calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatFullDate, parseIsoDate, toIsoDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function DatePicker({
  value,
  onChange,
  ariaLabel,
  className,
  allowEmpty = false,
  emptyLabel = "Choisir une date",
  disableFuture = false,
}: {
  value: string;
  onChange: (isoDate: string) => void;
  ariaLabel: string;
  className?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  disableFuture?: boolean;
}) {
  const selected = parseIsoDate(value) ?? undefined;
  const label = selected ? formatFullDate(selected) : emptyLabel;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label={ariaLabel}
            data-empty={!selected}
            className={cn(
              "w-full min-w-36 justify-start font-normal data-[empty=true]:text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarDaysIcon size={16} data-icon="inline-start" />
        {label}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto gap-0 p-0">
        <PopoverTitle className="sr-only">{ariaLabel}</PopoverTitle>
        <AppCalendar
          mode="single"
          selected={selected}
          month={selected}
          disabled={disableFuture ? { after: new Date() } : undefined}
          onSelect={(date) => {
            if (!date) return;
            onChange(toIsoDate(date));
          }}
        />
        {allowEmpty && selected ? (
          <div className="border-t p-2">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => onChange("")}>
              Effacer
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

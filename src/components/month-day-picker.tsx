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
import { fieldAppearanceClassName, type FieldAppearance } from "@/components/field-appearance";
import {
  currentYearMonth,
  formatDayOfMonth,
  formatLineDate,
  lineDate,
  monthEnd,
  monthStart,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

export function MonthDayPicker({
  dayOfMonth,
  onChange,
  year,
  month,
  ariaLabel,
  className,
  appearance = "plain",
}: {
  dayOfMonth: number;
  onChange: (dayOfMonth: number) => void;
  year?: number;
  month?: number;
  ariaLabel: string;
  className?: string;
  appearance?: FieldAppearance;
}) {
  const locked = year !== undefined && month !== undefined;
  const view = locked ? { year, month } : currentYearMonth();
  const selected = lineDate(view.year, view.month, dayOfMonth);
  const start = monthStart(view.year, view.month);
  const end = monthEnd(view.year, view.month);
  const label = locked
    ? formatLineDate(view.year, view.month, dayOfMonth)
    : formatDayOfMonth(dayOfMonth);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant={appearance === "plain" ? "ghost" : "outline"}
            size="sm"
            aria-label={ariaLabel}
            className={fieldAppearanceClassName(
              appearance,
              cn("w-full min-w-32 justify-start font-normal", className),
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
          month={start}
          selected={selected}
          startMonth={start}
          endMonth={end}
          hideNavigation={locked}
          showOutsideDays={false}
          disabled={{ before: start, after: end }}
          onSelect={(date) => {
            if (!date) return;
            onChange(date.getDate());
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

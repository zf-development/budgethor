import {
  clampDayForMonth,
  monthEnd,
  monthStart,
  addCalendarDays,
  parseIsoDate,
  lineDate,
} from "@/lib/dates";

export const INCOME_CADENCES = {
  week: "Chaque semaine",
  biweek: "Toutes les 2 semaines",
  month: "Chaque mois",
} as const;

export type IncomeCadence = keyof typeof INCOME_CADENCES;

export function isIncomeCadence(value: string): value is IncomeCadence {
  return value === "week" || value === "biweek" || value === "month";
}

export function incomeDaysInMonth(
  cadence: IncomeCadence,
  nextPayIso: string,
  year: number,
  month: number,
) {
  const start = monthStart(year, month);
  const end = monthEnd(year, month);
  const anchor = parseIsoDate(nextPayIso) ?? lineDate(year, month, 1);

  if (cadence === "month") {
    return [clampDayForMonth(anchor.getDate(), year, month)];
  }

  const step = cadence === "week" ? 7 : 14;
  let cursor = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  while (cursor > start) {
    cursor = addCalendarDays(cursor, -step);
  }
  while (cursor < start) {
    cursor = addCalendarDays(cursor, step);
  }

  const days: number[] = [];
  while (cursor <= end) {
    days.push(cursor.getDate());
    cursor = addCalendarDays(cursor, step);
  }
  return days;
}

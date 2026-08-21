export type YearMonth = { year: number; month: number };

export function currentYearMonth(now = new Date()): YearMonth {
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function addMonths(year: number, month: number, delta: number): YearMonth {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function isValidYearMonth(year: number, month: number) {
  return Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12;
}

export function compareYearMonth(a: YearMonth, b: YearMonth) {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

export function isPastYearMonth(target: YearMonth, now = currentYearMonth()) {
  return compareYearMonth(target, now) < 0;
}

export const VISIBLE_FUTURE_MONTHS = 1;

export function maxVisibleYearMonth(now = currentYearMonth()) {
  return addMonths(now.year, now.month, VISIBLE_FUTURE_MONTHS);
}

export function isBeyondVisibleFuture(target: YearMonth, now = currentYearMonth()) {
  return compareYearMonth(target, maxVisibleYearMonth(now)) > 0;
}

export function hasYearMonth(months: YearMonth[], year: number, month: number) {
  return months.some((row) => row.year === year && row.month === month);
}

export function canOpenMonth(
  year: number,
  month: number,
  knownMonths: YearMonth[],
  now = currentYearMonth(),
) {
  if (isBeyondVisibleFuture({ year, month }, now)) return false;
  if (!isPastYearMonth({ year, month }, now)) return true;
  return hasYearMonth(knownMonths, year, month);
}

export function monthPath(year: number, month: number, extra?: Record<string, string>) {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
    ...extra,
  });
  return `/?${params.toString()}`;
}

const DATE_LOCALE = "fr-CA";

export function clampDay(dayOfMonth: number) {
  if (!Number.isFinite(dayOfMonth)) return 1;
  return Math.min(31, Math.max(1, Math.round(dayOfMonth)));
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function clampDayForMonth(dayOfMonth: number, year: number, month: number) {
  return Math.min(clampDay(dayOfMonth), daysInMonth(year, month));
}

export function monthStart(year: number, month: number) {
  return new Date(year, month - 1, 1);
}

export function monthEnd(year: number, month: number) {
  return new Date(year, month - 1, daysInMonth(year, month));
}

export function lineDate(year: number, month: number, dayOfMonth: number) {
  return new Date(year, month - 1, clampDayForMonth(dayOfMonth, year, month));
}

export function startOfToday(today = new Date()) {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

export function lineDateHasArrived(
  year: number,
  month: number,
  dayOfMonth: number,
  today = new Date(),
) {
  return lineDate(year, month, dayOfMonth) <= startOfToday(today);
}

export function formatMonthTitle(year: number, month: number) {
  const label = new Intl.DateTimeFormat(DATE_LOCALE, {
    month: "long",
    year: "numeric",
  }).format(monthStart(year, month));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatLineDate(year: number, month: number, dayOfMonth: number) {
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    day: "numeric",
    month: "short",
  }).format(lineDate(year, month, dayOfMonth));
}

export function formatDayMonthLong(year: number, month: number, dayOfMonth: number) {
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    day: "numeric",
    month: "long",
  }).format(lineDate(year, month, dayOfMonth));
}

/** Next occurrence of a monthly day, including today. */
export function nextRecurringDate(dayOfMonth: number, today = new Date()) {
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const thisMonth = lineDate(year, month, dayOfMonth);
  const todayStart = new Date(year, month - 1, today.getDate());
  if (thisMonth >= todayStart) {
    return { year, month, dayOfMonth: thisMonth.getDate() };
  }
  const next = addMonths(year, month, 1);
  return {
    year: next.year,
    month: next.month,
    dayOfMonth: clampDayForMonth(dayOfMonth, next.year, next.month),
  };
}

export function formatDayOfMonth(dayOfMonth: number) {
  return `Le ${clampDay(dayOfMonth)}`;
}

export function formatMonthlyCadence(dayOfMonth: number) {
  const day = clampDay(dayOfMonth);
  if (day === 1) return "1er de chaque mois";
  return `Le ${day} de chaque mois`;
}

export function addCalendarDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Inclusive calendar months from `from` to `to` (March to August = 6). */
export function inclusiveCalendarMonths(from: Date, to: Date) {
  const months =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (months < 0) return 0;
  return months + 1;
}

export function todayIsoDate(now = new Date()) {
  return toIsoDate(now);
}

export type LineTone = "paid" | "overdue" | "upcoming" | "unpaid";

export function paymentTone(args: {
  done: boolean;
  dayOfMonth: number;
  year: number;
  month: number;
  today?: Date;
}): LineTone {
  if (args.done) return "paid";
  const today = args.today ?? new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  const dueDay = clampDayForMonth(args.dayOfMonth, args.year, args.month);
  const isPastMonth =
    args.year < currentYear || (args.year === currentYear && args.month < currentMonth);
  const isCurrentMonth = args.year === currentYear && args.month === currentMonth;
  if (isPastMonth) return "overdue";
  if (isCurrentMonth && dueDay <= currentDay) return "overdue";
  if (isCurrentMonth) return "upcoming";
  return "unpaid";
}

export type InboxUrgency = "overdue" | "today" | "upcoming";

const INBOX_URGENCY_RANK: Record<InboxUrgency, number> = {
  overdue: 0,
  today: 1,
  upcoming: 2,
};

export function compareInboxUrgency(a: InboxUrgency, b: InboxUrgency) {
  return INBOX_URGENCY_RANK[a] - INBOX_URGENCY_RANK[b];
}

/** Same due date as `paymentTone`, but splits “due today” from past-due. */
export function lineUrgency(args: {
  done: boolean;
  dayOfMonth: number;
  year: number;
  month: number;
  today?: Date;
}): InboxUrgency | null {
  if (args.done) return null;
  const today = args.today ?? new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  const dueDay = clampDayForMonth(args.dayOfMonth, args.year, args.month);
  const isPastMonth =
    args.year < currentYear || (args.year === currentYear && args.month < currentMonth);
  const isCurrentMonth = args.year === currentYear && args.month === currentMonth;
  if (isPastMonth || (isCurrentMonth && dueDay < currentDay)) return "overdue";
  if (isCurrentMonth && dueDay === currentDay) return "today";
  if (isCurrentMonth && dueDay > currentDay) return "upcoming";
  return null;
}

export function rowToneClass(tone: LineTone) {
  switch (tone) {
    case "paid":
      return "bg-primary/5 hover:bg-primary/10";
    case "overdue":
      return "bg-destructive/10 hover:bg-destructive/15";
    case "upcoming":
      return "bg-secondary hover:bg-secondary/80";
    default:
      return "bg-destructive/5 hover:bg-destructive/10";
  }
}

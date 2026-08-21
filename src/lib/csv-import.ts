import { clampDay, parseIsoDate, toIsoDate } from "@/lib/dates";
import { parseMoneyToCents } from "@/lib/money";

export const CSV_IMPORT_TARGETS = {
  "month-payments": "Paiements du mois",
  "month-incomes": "Paies du mois",
  "payment-templates": "Paiements récurrents",
  debts: "Dettes",
} as const;

export type CsvImportTarget = keyof typeof CSV_IMPORT_TARGETS;

export const CSV_FIELD_KEYS = ["label", "amount", "date", "account", "notes", "monthly"] as const;
export type CsvFieldKey = (typeof CSV_FIELD_KEYS)[number];

export const CSV_FIELD_LABELS: Record<CsvFieldKey, string> = {
  label: "Libellé",
  amount: "Montant",
  date: "Date ou jour",
  account: "Compte",
  notes: "Notes",
  monthly: "Mensualité (dettes)",
};

const FIELD_ALIASES: Record<CsvFieldKey, string[]> = {
  label: ["libelle", "libellé", "label", "description", "nom", "name", "detail", "marchand"],
  amount: ["montant", "amount", "debit", "débit", "credit", "crédit", "somme"],
  date: ["date", "jour", "day", "echeance", "échéance"],
  account: ["compte", "account", "from"],
  notes: ["notes", "note", "memo", "commentaire"],
  monthly: ["mensuel", "mensualite", "mensualité", "monthly"],
};

export type CsvColumnMap = Partial<Record<CsvFieldKey, number>>;

export type CsvMappedRow = {
  label: string;
  amountCents: number;
  dayOfMonth: number;
  accountName: string;
  notes: string;
  monthlyPaymentCents: number;
  nextPayIso: string | null;
};

export const SAMPLE_CSV = `\uFEFFlibellé;montant;date;compte;notes
Loyer;1450;1;Banque;
Électricité;92,40;15;Banque;Hydro-Québec
Internet;75;20;Banque;
`;

export function normalizeHeader(header: string) {
  return header
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function guessColumnMap(headers: string[]): CsvColumnMap {
  const map: CsvColumnMap = {};
  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    for (const field of CSV_FIELD_KEYS) {
      if (map[field] !== undefined) continue;
      if (FIELD_ALIASES[field].some((alias) => normalizeHeader(alias) === normalized)) {
        map[field] = index;
      }
    }
  });
  return map;
}

export function parseImportedDate(raw: string): { dayOfMonth: number; iso: string | null } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^\d{1,2}$/.test(trimmed)) {
    return { dayOfMonth: clampDay(Number(trimmed)), iso: null };
  }
  const iso = parseIsoDate(trimmed);
  if (iso) return { dayOfMonth: iso.getDate(), iso: toIsoDate(iso) };
  const dmy = /^(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})$/.exec(trimmed);
  if (!dmy) return null;
  const day = Number(dmy[1]);
  const month = Number(dmy[2]);
  let year = Number(dmy[3]);
  if (year < 100) year += 2000;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return { dayOfMonth: clampDay(day), iso: null };
  }
  return { dayOfMonth: date.getDate(), iso: toIsoDate(date) };
}

export function mapCsvRows(
  rows: string[][],
  columns: CsvColumnMap,
): { rows: CsvMappedRow[]; skipped: number } {
  const mapped: CsvMappedRow[] = [];
  let skipped = 0;
  for (const row of rows) {
    const label = cell(row, columns.label).trim();
    const amountRaw = cell(row, columns.amount);
    const cents = parseMoneyToCents(amountRaw);
    if (!label || cents === null) {
      skipped += 1;
      continue;
    }
    const parsedDate = parseImportedDate(cell(row, columns.date));
    const monthly = parseMoneyToCents(cell(row, columns.monthly));
    mapped.push({
      label,
      amountCents: Math.abs(cents),
      dayOfMonth: parsedDate?.dayOfMonth ?? 1,
      accountName: cell(row, columns.account).trim(),
      notes: cell(row, columns.notes).trim(),
      monthlyPaymentCents: monthly === null ? 0 : Math.abs(monthly),
      nextPayIso: parsedDate?.iso ?? null,
    });
  }
  return { rows: mapped, skipped };
}

function cell(row: string[], index: number | undefined) {
  if (index === undefined) return "";
  return row[index] ?? "";
}

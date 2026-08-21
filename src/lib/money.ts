export function formatCad(cents: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
}

export function formatCadCompact(cents: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export function parseMoneyToCents(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let s = trimmed.replace(/CAD/gi, "").replace(/\$/g, "").replace(/\s/g, "");
  const negative = s.startsWith("-") || s.startsWith("−");
  s = s.replace(/^[-−]/, "");
  if (!s) return null;

  if (s.includes(",") && s.includes(".")) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }

  const value = Number(s);
  if (!Number.isFinite(value)) return null;
  const cents = Math.round(value * 100);
  return negative ? -cents : cents;
}

export function parsePercentToBps(raw: string): number | null {
  const parsed = parseMoneyToCents(raw);
  if (parsed === null) return null;
  return Math.max(0, parsed);
}

export function formatBpsAsPercent(bps: number) {
  return (bps / 100).toFixed(2);
}

export function remainingMonths(balanceCents: number, monthlyPaymentCents: number) {
  if (monthlyPaymentCents <= 0) return null;
  if (balanceCents <= 0) return 0;
  return Math.ceil(balanceCents / monthlyPaymentCents);
}

export function remainingMonthsExact(balanceCents: number, monthlyPaymentCents: number) {
  if (balanceCents <= 0) return 0;
  if (monthlyPaymentCents <= 0) return null;
  return balanceCents / monthlyPaymentCents;
}

export function formatRemainingMonths(months: number | null) {
  if (months === null) return "—";
  if (months === 0) return "Soldée";
  const label = new Intl.NumberFormat("fr-CA", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(months);
  return months === 1 ? `${label} mois` : `${label} mois`;
}

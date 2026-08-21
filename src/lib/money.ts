export function formatCad(cents: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
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

export function remainingMonths(balanceCents: number, monthlyPaymentCents: number) {
  if (monthlyPaymentCents <= 0) return null;
  if (balanceCents <= 0) return 0;
  return Math.ceil(balanceCents / monthlyPaymentCents);
}

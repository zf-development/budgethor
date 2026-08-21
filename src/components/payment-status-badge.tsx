import { Badge } from "@/components/ui/badge";
import type { LineTone } from "@/lib/dates";

const PAYMENT_LABELS: Record<LineTone, string> = {
  paid: "Payé",
  overdue: "Dû",
  upcoming: "À venir",
  unpaid: "Impayé",
};

const INCOME_LABELS: Record<LineTone, string> = {
  paid: "Reçu",
  overdue: "En retard",
  upcoming: "À venir",
  unpaid: "En attente",
};

export function PaymentStatusBadge({
  tone,
  kind = "payment",
}: {
  tone: LineTone;
  kind?: "payment" | "income";
}) {
  const labels = kind === "income" ? INCOME_LABELS : PAYMENT_LABELS;

  if (tone === "paid") {
    return <Badge>{labels[tone]}</Badge>;
  }
  if (tone === "upcoming") {
    return <Badge variant="secondary">{labels[tone]}</Badge>;
  }
  return <Badge variant="destructive">{labels[tone]}</Badge>;
}

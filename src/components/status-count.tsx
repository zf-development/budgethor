import type { InboxUrgency } from "@/lib/dates";
import { cn } from "@/lib/utils";

const DOT_CLASS: Record<InboxUrgency, string> = {
  overdue: "bg-destructive",
  today: "bg-primary",
  upcoming: "bg-muted-foreground/40",
};

export function StatusCount({
  urgency,
  count,
  label,
}: {
  urgency: InboxUrgency;
  count: number;
  label: string;
}) {
  if (count <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", DOT_CLASS[urgency])} />
      <span>
        {count} {label}
      </span>
    </span>
  );
}

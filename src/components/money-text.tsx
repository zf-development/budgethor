import { formatCad } from "@/lib/money";
import { cn } from "@/lib/utils";

export function MoneyText({
  cents,
  className,
}: {
  cents: number;
  className?: string;
}) {
  return (
    <span className={cn("tabular-nums tracking-tight", className)}>
      {formatCad(cents)}
    </span>
  );
}

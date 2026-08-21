import { MoneyText } from "@/components/money-text";
import { cn } from "@/lib/utils";

export function SummaryRow({
  label,
  children,
  emphasize = false,
}: {
  label: string;
  children: React.ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={cn(emphasize ? "text-foreground" : "text-muted-foreground")}>{label}</span>
      <span className={cn("min-w-0 text-right tabular-nums", emphasize && "font-medium")}>
        {children}
      </span>
    </div>
  );
}

export function MoneyFlowRow({
  label,
  cents,
  prefix = null,
  trailing,
  emphasize = false,
}: {
  label: string;
  cents: number;
  prefix?: "+" | "−" | null;
  trailing?: React.ReactNode;
  emphasize?: boolean;
}) {
  return (
    <SummaryRow label={label} emphasize={emphasize}>
      <span className="inline-flex items-center justify-end gap-2">
        {trailing}
        <span>
          {prefix ? `${prefix} ` : null}
          <MoneyText cents={cents} />
        </span>
      </span>
    </SummaryRow>
  );
}

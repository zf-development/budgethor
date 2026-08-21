import { cn } from "@/lib/utils";

export function Callout({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-l-2 border-border pl-3", className)}>
      {title ? <p className="text-muted-foreground">{title}</p> : null}
      <div>{children}</div>
    </div>
  );
}

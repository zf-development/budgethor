import { cn } from "@/lib/utils";

export function WizardShell({
  title,
  description,
  step,
  total,
  children,
  footer,
}: {
  title: string;
  description: string;
  step: number;
  total: number;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-10">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Étape {step} / {total}
        </p>
        <div className="flex gap-1">
          {Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                index < step ? "bg-foreground" : "bg-muted",
              )}
            />
          ))}
        </div>
        <h1 className="font-heading text-3xl tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {children}
      <div className="flex flex-wrap items-center justify-between gap-2">{footer}</div>
    </div>
  );
}

export function WizardStep({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>;
}

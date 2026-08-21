import type { AppIcon } from "@/components/icons";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  badge,
  progress,
  progressLabel,
  dominant = false,
  children,
  footer,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  hint?: React.ReactNode;
  icon?: AppIcon;
  badge?: React.ReactNode;
  progress?: number;
  progressLabel?: string;
  dominant?: boolean;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const hasBody = hint || progress != null || children;

  return (
    <Card size="sm" className={className}>
      <CardHeader>
        {value != null ? (
          dominant ? (
            <>
              <CardTitle className="text-3xl tracking-tight tabular-nums">{value}</CardTitle>
              <CardDescription>{label}</CardDescription>
            </>
          ) : (
            <>
              <CardDescription>{label}</CardDescription>
              <CardTitle>{value}</CardTitle>
            </>
          )
        ) : (
          <CardTitle>{label}</CardTitle>
        )}
        {badge || Icon ? (
          <CardAction>
            <div className="flex items-center gap-2">
              {badge}
              {Icon ? <Icon size={16} /> : null}
            </div>
          </CardAction>
        ) : null}
      </CardHeader>
      {hasBody ? (
        <CardContent className="flex flex-col gap-3">
          {children}
          {progress != null ? (
            <Progress value={progress}>
              {progressLabel ? <ProgressLabel>{progressLabel}</ProgressLabel> : null}
              <ProgressValue />
            </Progress>
          ) : null}
          {hint ? <p className="text-muted-foreground">{hint}</p> : null}
        </CardContent>
      ) : null}
      {footer ? <CardFooter className="w-full border-t *:w-full">{footer}</CardFooter> : null}
    </Card>
  );
}

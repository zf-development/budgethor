"use client";

import { Children, isValidElement, useState } from "react";
import { ChevronDownIcon, PlusIcon } from "@/components/icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { FieldGroup } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function RecurringList({
  title,
  description,
  onAdd,
  addLabel,
  addDisabled,
  emptyTitle,
  emptyDescription,
  draft,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  addDisabled?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  draft?: React.ReactNode;
  children: React.ReactNode;
}) {
  const items = Children.toArray(children).filter(Boolean);

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b pt-(--card-spacing)">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {onAdd ? (
          <CardAction>
            <Button variant="outline" size="sm" disabled={addDisabled} onClick={onAdd}>
              <PlusIcon size={16} data-icon="inline-start" />
              {addLabel ?? "Ajouter"}
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      {items.length === 0 && !draft ? (
        <Empty className="border-0 py-6">
          <EmptyHeader>
            <EmptyTitle>{emptyTitle}</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col">
          {draft ? (
            <>
              {draft}
              {items.length > 0 ? <Separator /> : null}
            </>
          ) : null}
          {items.map((child, index) => (
            <div key={isValidElement(child) && child.key != null ? String(child.key) : index}>
              {index > 0 ? <Separator /> : null}
              {child}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function RecurringRow({
  title,
  summary,
  value,
  badges,
  children,
}: {
  title: string;
  summary: React.ReactNode;
  value?: React.ReactNode;
  badges?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <RecurringItem
        title={title}
        summary={summary}
        value={value}
        badges={badges}
        expanded={open}
        aria-expanded={open}
        onClick={() => setOpen((next) => !next)}
      />
      {open ? (
        <div className="flex flex-col items-start gap-4 px-(--card-spacing) pt-5 pb-4">{children}</div>
      ) : null}
    </div>
  );
}

export function RecurringItem({
  title,
  summary,
  value,
  badges,
  expanded = false,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "value"> & {
  title: string;
  summary: React.ReactNode;
  value?: React.ReactNode;
  badges?: React.ReactNode;
  expanded?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "h-auto w-full items-center justify-between gap-3 rounded-none px-(--card-spacing) py-2.5 whitespace-normal",
        className,
      )}
      {...props}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className="truncate font-medium">{title}</span>
        <span className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-normal text-muted-foreground">
          {summary}
          {badges}
        </span>
      </span>
      {value ? <span className="shrink-0 text-sm font-medium">{value}</span> : null}
      <ChevronDownIcon
        size={16}
        className={cn(
          "shrink-0 text-muted-foreground transition-transform",
          expanded && "rotate-180",
        )}
      />
    </Button>
  );
}

export function RecurringBadge({ children }: { children: React.ReactNode }) {
  return <Badge variant="secondary">{children}</Badge>;
}

export function RecurringFields({ children }: { children: React.ReactNode }) {
  return (
    <FieldGroup className="gap-6 sm:grid sm:grid-cols-2 [&_[data-slot=field]]:gap-1.5">{children}</FieldGroup>
  );
}

export function RecurringDraft({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-4 bg-muted/40 px-(--card-spacing) pt-5 pb-4">
      <p className="text-sm font-medium">{title}</p>
      {children}
    </div>
  );
}

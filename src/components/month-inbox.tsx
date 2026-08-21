"use client";

import { useState } from "react";

import { CalendarDaysIcon, ChevronDownIcon } from "@/components/icons";
import { MonthLineRow } from "@/components/month-line-row";
import { StatusCount } from "@/components/status-count";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import type { Account } from "@/db/schema";
import type { MonthInboxItem } from "@/lib/totals";
import { cn } from "@/lib/utils";

const PREVIEW_LIMIT = 4;

function countNoun(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

export function MonthInbox({
  items,
  year,
  month,
  accounts,
}: {
  items: MonthInboxItem[];
  year: number;
  month: number;
  accounts: Account[];
}) {
  const [expanded, setExpanded] = useState(false);
  const overdueCount = items.filter((item) => item.urgency === "overdue").length;
  const todayCount = items.filter((item) => item.urgency === "today").length;
  const upcomingCount = items.filter((item) => item.urgency === "upcoming").length;
  const canCollapse = items.length > PREVIEW_LIMIT;
  const visibleItems = expanded || !canCollapse ? items : items.slice(0, PREVIEW_LIMIT);

  return (
    <Card id="a-traiter" className="h-full scroll-mt-24">
      <CardHeader>
        <CardTitle>À traiter</CardTitle>
        <CardDescription>
          {items.length === 0
            ? "Retards et échéances des 7 prochains jours."
            : `${items.length} ${countNoun(items.length, "élément", "éléments")}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {items.length === 0 ? (
          <Empty className="border-0 p-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarDaysIcon size={16} />
              </EmptyMedia>
              <EmptyTitle>Rien à traiter</EmptyTitle>
              <EmptyDescription>
                Aucun paiement en retard ni échéance proche. Les paies sont reçues automatiquement.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <StatusCount urgency="overdue" count={overdueCount} label="en retard" />
              <StatusCount urgency="today" count={todayCount} label="aujourd’hui" />
              <StatusCount urgency="upcoming" count={upcomingCount} label="à venir" />
            </div>
            <MonthInboxList
              items={visibleItems}
              year={year}
              month={month}
              accounts={accounts}
            />
          </>
        )}
      </CardContent>
      {canCollapse ? (
        <CardFooter className="border-t">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded
              ? "Réduire la liste"
              : `Afficher les ${items.length} ${countNoun(items.length, "élément", "éléments")}`}
            <ChevronDownIcon
              data-icon="inline-end"
              className={cn("transition-transform", expanded && "rotate-180")}
            />
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}

function MonthInboxList({
  items,
  year,
  month,
  accounts,
}: {
  items: MonthInboxItem[];
  year: number;
  month: number;
  accounts: Account[];
}) {
  return (
    <div className="flex flex-col">
      {items.map((item, index) => (
        <div key={`${item.kind}-${item.id}`}>
          {index > 0 ? <Separator /> : null}
          <MonthLineRow item={item} year={year} month={month} accounts={accounts} />
        </div>
      ))}
    </div>
  );
}

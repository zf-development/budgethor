"use client";

import { CalendarDaysIcon } from "@/components/icons";

import { MonthLineRow } from "@/components/month-line-row";
import {
  Card,
  CardContent,
  CardDescription,
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
  return (
    <Card id="a-traiter" className="h-full scroll-mt-24">
      <CardHeader>
        <CardTitle>À traiter</CardTitle>
        <CardDescription>
          Retards et échéances des 7 prochains jours. Coche pour marquer reçu ou payé.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <Empty className="border-0 p-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarDaysIcon size={16} />
              </EmptyMedia>
              <EmptyTitle>Rien à traiter</EmptyTitle>
              <EmptyDescription>
                Aucun retard ni échéance proche pour ce mois.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col">
            {items.map((item, index) => (
              <div key={`${item.kind}-${item.id}`}>
                {index > 0 ? <Separator /> : null}
                <MonthLineRow
                  item={item}
                  year={year}
                  month={month}
                  accounts={accounts}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

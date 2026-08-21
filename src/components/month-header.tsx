"use client";

import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

import { HistoryMonthDialog } from "@/components/history-month-dialog";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  addMonths,
  canOpenMonth,
  currentYearMonth,
  formatMonthTitle,
  isBeyondVisibleFuture,
  monthPath,
  type YearMonth,
} from "@/lib/dates";

function MonthNavButton({
  direction,
  year,
  month,
  knownMonths,
}: {
  direction: -1 | 1;
  year: number;
  month: number;
  knownMonths: YearMonth[];
}) {
  const now = currentYearMonth();
  const target = addMonths(year, month, direction);
  const label = direction < 0 ? "Mois précédent" : "Mois suivant";
  const Icon = direction < 0 ? ChevronLeftIcon : ChevronRightIcon;

  if (canOpenMonth(target.year, target.month, knownMonths, now)) {
    return (
      <Button
        nativeButton={false}
        render={<Link href={monthPath(target.year, target.month)} />}
        variant="outline"
        size="icon"
        aria-label={label}
      >
        <Icon size={16} />
      </Button>
    );
  }

  if (isBeyondVisibleFuture(target, now)) {
    return (
      <Button
        variant="outline"
        size="icon"
        aria-label="Le futur est limité au mois prochain"
        disabled
      >
        <Icon size={16} />
      </Button>
    );
  }

  return (
    <HistoryMonthDialog
      year={target.year}
      month={target.month}
      trigger={
        <Button variant="outline" size="icon" aria-label={label}>
          <Icon size={16} />
        </Button>
      }
    />
  );
}

export function MonthHeader({
  year,
  month,
  knownMonths,
}: {
  year: number;
  month: number;
  knownMonths: YearMonth[];
}) {
  return (
    <PageHeader
      title={formatMonthTitle(year, month)}
      description="Tableau de bord : solde disponible après paiements, échéances, paies et comptes."
    >
      <ButtonGroup>
        <MonthNavButton direction={-1} year={year} month={month} knownMonths={knownMonths} />
        <Button nativeButton={false} render={<Link href="/" />} variant="outline">
          Aujourd’hui
        </Button>
        <MonthNavButton direction={1} year={year} month={month} knownMonths={knownMonths} />
      </ButtonGroup>
    </PageHeader>
  );
}

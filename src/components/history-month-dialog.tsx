"use client";

import { useTransition } from "react";
import { CalendarDaysIcon } from "@/components/icons";

import { openHistoryMonth } from "@/actions/budget";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { formatMonthTitle } from "@/lib/dates";

export function historyMonthDescription(monthTitle: string) {
  return `${monthTitle} n’a pas encore été saisi. Tu peux le générer à partir de tes récurrences, puis valider les soldes au 1er et cocher les paies et paiements réellement faits.`;
}

export function useOpenHistoryMonth(year: number, month: number) {
  const [isPending, startTransition] = useTransition();
  return {
    isPending,
    open: () => {
      startTransition(() => {
        void openHistoryMonth(year, month);
      });
    },
  };
}

export function HistoryMonthDialog({
  year,
  month,
  trigger,
}: {
  year: number;
  month: number;
  trigger: React.ReactElement;
}) {
  const monthTitle = formatMonthTitle(year, month);
  const { isPending, open } = useOpenHistoryMonth(year, month);

  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter {monthTitle} à l’historique</DialogTitle>
          <DialogDescription>{historyMonthDescription(monthTitle)}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Annuler</DialogClose>
          <Button disabled={isPending} onClick={open}>
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            Générer le mois
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function HistoryMonthEmpty({ year, month }: { year: number; month: number }) {
  const monthTitle = formatMonthTitle(year, month);
  const { isPending, open } = useOpenHistoryMonth(year, month);

  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CalendarDaysIcon size={16} />
        </EmptyMedia>
        <EmptyTitle>{monthTitle} n’est pas encore saisi</EmptyTitle>
        <EmptyDescription>{historyMonthDescription(monthTitle)}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button disabled={isPending} onClick={open}>
          {isPending ? <Spinner data-icon="inline-start" /> : null}
          Générer le mois
        </Button>
      </EmptyContent>
    </Empty>
  );
}

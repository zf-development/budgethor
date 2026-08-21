"use client";

import type { AppIcon } from "@/components/icons";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { TableCell, TableRow } from "@/components/ui/table";

export function SpreadsheetEmpty({
  colSpan,
  icon: Icon,
  title,
  description,
}: {
  colSpan: number;
  icon: AppIcon;
  title: string;
  description?: string;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="p-6">
        <Empty className="border-0 p-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon size={16} />
            </EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            {description ? <EmptyDescription>{description}</EmptyDescription> : null}
          </EmptyHeader>
        </Empty>
      </TableCell>
    </TableRow>
  );
}

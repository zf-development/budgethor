"use client";

import { PlusIcon } from "@/components/icons";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type SpreadsheetColumn = {
  key: string;
  header: string;
  className?: string;
};

export function SpreadsheetTable({
  title,
  description,
  columns,
  children,
  footer,
  onAdd,
  addLabel,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  columns: SpreadsheetColumn[];
  children: React.ReactNode;
  footer?: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
}) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b pt-(--card-spacing)">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {onAdd ? (
          <CardAction>
            <Button variant="outline" size="sm" onClick={onAdd}>
              <PlusIcon size={16} data-icon="inline-start" />
              {addLabel ?? "Ajouter une ligne"}
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn("text-muted-foreground", column.className)}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>{children}</TableBody>
        {footer}
      </Table>
    </Card>
  );
}

export { TableFooter, TableRow };

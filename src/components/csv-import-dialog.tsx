"use client";

import { useMemo, useState, useTransition } from "react";
import { DownloadIcon, UploadIcon } from "@/components/icons";
import { toast } from "sonner";

import { importCsvRows } from "@/actions/budget";
import { AccountSelect } from "@/components/account-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { parseCsv } from "@/lib/csv";
import {
  CSV_FIELD_KEYS,
  CSV_FIELD_LABELS,
  CSV_IMPORT_TARGETS,
  SAMPLE_CSV,
  guessColumnMap,
  mapCsvRows,
  type CsvColumnMap,
  type CsvImportTarget,
} from "@/lib/csv-import";
import { formatCad } from "@/lib/money";
import type { Account } from "@/db/schema";

const NONE = "none";

export function CsvImportDialog({
  accounts,
  monthId,
  year,
  month,
  defaultAccountId,
}: {
  accounts: Account[];
  monthId?: string;
  year?: number;
  month?: number;
  defaultAccountId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<CsvImportTarget>(
    monthId ? "month-payments" : "payment-templates",
  );
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [columns, setColumns] = useState<CsvColumnMap>({});
  const [accountId, setAccountId] = useState(defaultAccountId ?? accounts[0]?.id ?? "");
  const [fileName, setFileName] = useState("");
  const [isPending, startTransition] = useTransition();

  const targets = useMemo(() => {
    const entries = Object.entries(CSV_IMPORT_TARGETS) as [CsvImportTarget, string][];
    if (monthId) return entries;
    return entries.filter(([key]) => key !== "month-payments" && key !== "month-incomes");
  }, [monthId]);

  const mapped = useMemo(() => mapCsvRows(rawRows, columns), [columns, rawRows]);
  const preview = mapped.rows.slice(0, 5);
  const headerItems = useMemo(
    () => ({
      [NONE]: "Ignorer",
      ...Object.fromEntries(headers.map((header, index) => [String(index), header || `Colonne ${index + 1}`])),
    }),
    [headers],
  );

  function resetFile() {
    setHeaders([]);
    setRawRows([]);
    setColumns({});
    setFileName("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetFile();
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <UploadIcon size={16} data-icon="inline-start" />
        Importer CSV
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer un CSV</DialogTitle>
          <DialogDescription>
            Fichier Excel ou banque, virgule ou point-virgule. Colonnes typiques : libellé, montant,
            date, compte.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel>Destination</FieldLabel>
            <ToggleGroup
              size="sm"
              className="flex-wrap"
              value={[target]}
              onValueChange={(next) => {
                const value = next[0];
                if (value && value in CSV_IMPORT_TARGETS) setTarget(value as CsvImportTarget);
              }}
            >
              {targets.map(([value, label]) => (
                <ToggleGroupItem key={value} value={value}>
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          <Field>
            <FieldLabel htmlFor="csv-file">Fichier</FieldLabel>
            <Input
              id="csv-file"
              type="file"
              accept=".csv,text/csv,text/plain"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  resetFile();
                  return;
                }
                setFileName(file.name);
                void file.text().then((text) => {
                  const parsed = parseCsv(text);
                  setHeaders(parsed.headers);
                  setRawRows(parsed.rows);
                  setColumns(guessColumnMap(parsed.headers));
                });
              }}
            />
            {fileName ? <p className="text-muted-foreground">{fileName}</p> : null}
          </Field>
          {target !== "debts" && accounts.length > 0 ? (
            <Field>
              <FieldLabel>Compte par défaut</FieldLabel>
              <AccountSelect
                appearance="field"
                ariaLabel="Compte par défaut"
                accounts={accounts}
                value={accountId}
                onChange={setAccountId}
                className="max-w-none"
              />
            </Field>
          ) : null}
          {headers.length > 0 ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {CSV_FIELD_KEYS.filter((field) => target === "debts" || field !== "monthly").map(
                  (field) => (
                    <Field key={field}>
                      <FieldLabel>{CSV_FIELD_LABELS[field]}</FieldLabel>
                      <ColumnSelect
                        items={headerItems}
                        value={columns[field]}
                        onChange={(index) => {
                          setColumns((current) => ({ ...current, [field]: index }));
                        }}
                      />
                    </Field>
                  ),
                )}
              </div>
              <div className="max-h-56 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Libellé</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Jour</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, index) => (
                      <TableRow key={`${row.label}-${index}`}>
                        <TableCell>{row.label}</TableCell>
                        <TableCell>{formatCad(row.amountCents)}</TableCell>
                        <TableCell>{row.dayOfMonth}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-muted-foreground">
                {mapped.rows.length} ligne(s) prête(s)
                {mapped.skipped > 0 ? ` · ${mapped.skipped} ignorée(s)` : ""}.
              </p>
            </>
          ) : null}
        </FieldGroup>
        <DialogFooter>
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE_CSV)}`}
                download="budgethor-exemple.csv"
              />
            }
          >
            <DownloadIcon size={16} data-icon="inline-start" />
            Exemple
          </Button>
          <Button
            disabled={isPending || mapped.rows.length === 0 || (!accountId && target !== "debts")}
            onClick={() => {
              startTransition(async () => {
                const result = await importCsvRows({
                  target,
                  monthId,
                  year,
                  month,
                  defaultAccountId: accountId,
                  rows: mapped.rows,
                });
                if (result.imported > 0) {
                  toast.success(`${result.imported} ligne(s) importée(s).`);
                  setOpen(false);
                  resetFile();
                } else {
                  toast.error("Aucune ligne importée. Vérifie le mapping des colonnes.");
                }
              });
            }}
          >
            {isPending ? <Spinner data-icon="inline-start" /> : null}
            Importer {mapped.rows.length > 0 ? `(${mapped.rows.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ColumnSelect({
  items,
  value,
  onChange,
}: {
  items: Record<string, string>;
  value: number | undefined;
  onChange: (index: number | undefined) => void;
}) {
  return (
    <Select
      value={value === undefined ? NONE : String(value)}
      items={items}
      onValueChange={(next) => {
        if (!next || next === NONE) onChange(undefined);
        else onChange(Number(next));
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {Object.entries(items).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

"use client";

import { useState } from "react";

import { BadgeAlertIcon, DeleteIcon } from "@/components/icons";
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

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  onConfirm,
  trigger,
  children,
  variant = "danger",
}: {
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  trigger: React.ReactElement;
  children?: React.ReactNode;
  variant?: "default" | "danger";
}) {
  const [open, setOpen] = useState(false);
  const isDanger = variant === "danger";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger}>{children}</DialogTrigger>
      <DialogContent showCloseButton={!isDanger} className={isDanger ? "sm:max-w-sm" : undefined}>
        <div className="flex flex-col gap-4">
          {isDanger ? (
            <div
              data-icon-hover=""
              className="flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
            >
              <BadgeAlertIcon />
            </div>
          ) : null}
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className={isDanger ? "grid grid-cols-2 sm:grid" : undefined}>
          <DialogClose render={<Button variant="outline" />}>{cancelLabel}</DialogClose>
          <Button
            variant={isDanger ? "destructive" : "default"}
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            {isDanger ? <DeleteIcon data-icon="inline-start" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

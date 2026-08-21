"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { DeleteIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function DeleteRowButton({
  onClick,
  label = "Supprimer",
  title = "Supprimer ?",
  description = "Cette action est définitive.",
  confirmLabel = "Supprimer",
  appearance = "icon",
}: {
  onClick: () => void;
  label?: string;
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  appearance?: "icon" | "label";
}) {
  const isLabel = appearance === "label";

  return (
    <ConfirmDialog
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      onConfirm={onClick}
      trigger={
        <Button
          variant="ghost"
          size={isLabel ? "sm" : "icon-sm"}
          aria-label={label}
          className={isLabel ? "text-destructive hover:bg-destructive/10 hover:text-destructive" : undefined}
        />
      }
    >
      <DeleteIcon size={16} data-icon={isLabel ? "inline-start" : undefined} />
      {isLabel ? label : null}
    </ConfirmDialog>
  );
}

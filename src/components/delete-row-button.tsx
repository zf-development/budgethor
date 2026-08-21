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
}: {
  onClick: () => void;
  label?: string;
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
}) {
  return (
    <ConfirmDialog
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      onConfirm={onClick}
      trigger={<Button variant="ghost" size="icon-sm" aria-label={label} />}
    >
      <DeleteIcon size={16} />
    </ConfirmDialog>
  );
}

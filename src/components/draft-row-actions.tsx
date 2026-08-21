"use client";

import { CheckIcon, XIcon } from "@/components/icons";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Spinner } from "@/components/ui/spinner";

export function DraftRowActions({
  confirmLabel = "Ajouter",
  disabled,
  pending,
  onConfirm,
  onCancel,
}: {
  confirmLabel?: string;
  disabled?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ButtonGroup>
      <Button
        type="button"
        size="sm"
        disabled={disabled || pending}
        onClick={onConfirm}
      >
        {pending ? <Spinner /> : <CheckIcon size={16} data-icon="inline-start" />}
        {confirmLabel}
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onCancel}>
        <XIcon size={16} data-icon="inline-start" />
        Annuler
      </Button>
    </ButtonGroup>
  );
}

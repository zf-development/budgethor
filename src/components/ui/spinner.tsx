"use client";

import { LoaderCircleIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

function Spinner({ className }: { className?: string }) {
  return (
    <LoaderCircleIcon
      size={16}
      animateOnHover={false}
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("animate-spin", className)}
    />
  );
}

export { Spinner };

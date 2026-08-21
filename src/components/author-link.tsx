"use client";

import { type AppIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function AuthorLink({
  href,
  label,
  icon: Icon,
  showLabel = true,
  variant = "outline",
  size = "sm",
  className,
}: {
  href: string;
  label: string;
  icon: AppIcon;
  showLabel?: boolean;
  variant?: "outline" | "ghost";
  size?: "sm" | "icon-xs" | "icon-sm";
  className?: string;
}) {
  return (
    <Button
      nativeButton={false}
      render={<a href={href} target="_blank" rel="noreferrer" />}
      variant={variant}
      size={size}
      aria-label={label}
      className={className}
    >
      <Icon data-icon={showLabel ? "inline-start" : undefined} />
      {showLabel ? label : null}
    </Button>
  );
}

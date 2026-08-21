import Image from "next/image";

import { cn } from "@/lib/utils";

export function AppLogo({
  size = 32,
  className,
  alt = "Budgethor",
}: {
  size?: number;
  className?: string;
  alt?: string;
}) {
  return (
    <Image
      src="/budgethor-logo.jpg"
      alt={alt}
      width={size}
      height={size}
      priority
      className={cn("rounded-lg", className)}
    />
  );
}

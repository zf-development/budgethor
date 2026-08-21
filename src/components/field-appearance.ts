import { cn } from "@/lib/utils";

export type FieldAppearance = "plain" | "field";

export function fieldAppearanceClassName(
  appearance: FieldAppearance,
  className?: string,
) {
  return cn(
    appearance === "plain" &&
      "border border-dashed border-transparent bg-transparent shadow-none hover:border-border hover:bg-transparent aria-expanded:border-border aria-expanded:bg-transparent [&_svg]:opacity-0 hover:[&_svg]:opacity-40 focus-visible:[&_svg]:opacity-40 aria-expanded:[&_svg]:opacity-40",
    className,
  );
}

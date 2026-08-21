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

/** Same box for hover (button) and edit (input) so the dashed frame does not jump. */
export function fieldControlClassName(
  appearance: FieldAppearance,
  className?: string,
) {
  return fieldAppearanceClassName(
    appearance,
    cn(
      "box-border h-8 w-full min-w-0 max-w-none rounded-3xl px-3 py-0 text-sm font-normal",
      appearance === "field" && "bg-input/50",
      className,
    ),
  );
}

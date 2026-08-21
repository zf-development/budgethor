"use client";

import { useTheme } from "@/components/theme-provider";
import { MoonIcon, SunIcon } from "@/components/icons";

import { updateTheme } from "@/actions/budget";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Basculer le thème"
      onClick={() => {
        const next = resolvedTheme === "dark" ? "light" : "dark";
        setTheme(next);
        void updateTheme(next);
      }}
    >
      {resolvedTheme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
    </Button>
  );
}

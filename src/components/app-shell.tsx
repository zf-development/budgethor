"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HandCoinsIcon, LayoutGridIcon, SettingsIcon } from "@/components/icons";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/", label: "Vue d’ensemble", icon: LayoutGridIcon },
  { href: "/debts", label: "Dettes", icon: HandCoinsIcon },
  { href: "/settings", label: "Réglages", icon: SettingsIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="font-heading text-lg tracking-tight">
            Budgethor
          </Link>
          <nav className="flex items-center gap-1">
            {LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Button
                  key={link.href}
                  nativeButton={false}
                  render={<Link href={link.href} />}
                  variant={active ? "default" : "ghost"}
                  size="sm"
                >
                  <Icon size={16} data-icon="inline-start" />
                  {link.label}
                </Button>
              );
            })}
          </nav>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        {children}
      </main>
    </div>
  );
}

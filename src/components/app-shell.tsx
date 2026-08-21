"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HandCoinsIcon, LayoutGridIcon, SettingsIcon } from "@/components/icons";

import { AppFooter } from "@/components/app-footer";
import { AppLogo } from "@/components/app-logo";
import { AuthorHelp } from "@/components/author-help";
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
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-sans text-lg font-bold tracking-tight">
            <AppLogo size={32} />
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
          <div className="flex items-center gap-1">
            <AuthorHelp />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}

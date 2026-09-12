"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { RoseIcon } from "@/components/rose-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/lib/site-config";

/**
 * One header for every route. The source artboards hand-copied this nav per
 * page and the copies had already drifted — the homepage logo linked to
 * "#top", the RSVP logo to a file path.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const linkClass = (href: string) =>
    pathname === href
      ? "text-mulberry-strong"
      : "text-muted-foreground transition-colors hover:text-mulberry-strong";

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="flex h-full items-center gap-4 px-6 md:px-8">
        <Link
          href="/"
          aria-label="Home"
          className="flex shrink-0 items-center text-mulberry"
        >
          <RoseIcon />
        </Link>

        <nav
          aria-label="Main"
          className="hidden flex-1 items-center gap-6 font-sans text-[13px] uppercase tracking-[0.04em] md:flex"
        >
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={linkClass(item.href)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <ThemeToggle />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label="Open menu"
              className="border border-border p-2 text-muted-foreground transition-colors hover:border-mulberry hover:text-mulberry-strong md:hidden"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="size-4"
                aria-hidden="true"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </SheetTrigger>
            <SheetContent side="right" className="border-border bg-background">
              {/* Visually hidden, but the dialog primitive needs an
                  accessible name or it warns at runtime. */}
              <SheetTitle className="sr-only">Main menu</SheetTitle>
              <nav
                aria-label="Mobile"
                className="mt-12 flex flex-col gap-6 px-6 font-sans text-sm uppercase tracking-[0.04em]"
              >
                {siteConfig.nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className={linkClass(item.href)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

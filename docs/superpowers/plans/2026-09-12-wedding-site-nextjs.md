# Wedding Site Next.js Port — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the Julie & Nick Claude Design canvas export into a working Next.js site with a faithful Mulberry theme, a validated RSVP form, and WIP stubs for the four unbuilt nav destinations.

**Architecture:** Next.js App Router with a root layout that owns fonts, theme provider, header and footer, so the per-artboard duplication in the source disappears. The Mulberry palette is expressed as shadcn/ui's CSS-variable contract in `app/globals.css`, so every shadcn component inherits the theme without per-component overrides. RSVP validation lives in one zod schema imported by both the client resolver and the Server Action.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS v4, shadcn/ui, next-themes, react-hook-form, zod v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-12-wedding-site-nextjs-design.md`

## Global Constraints

- **Border radius is zero everywhere.** `--radius: 0rem`. Mulberry mandates hairlines and square corners; never add a rounded utility.
- **Fonts:** Cormorant Garamond (display, weight 300, often italic) and Inter (UI). No other families. JetBrains Mono from the source theme document is deliberately dropped.
- **Theme:** dark by default, `enableSystem={false}`. Both modes must be complete; no color may be defined only inside `.dark`.
- **Button fill is `#7b2e5e` in both modes** with `#ffffff` text (7.7:1). Dark-mode hover lifts to `#ac6284`; light-mode hover deepens to `#3d1e37`.
- **Accent-colored text below 18px uses `--mulberry-strong`, never `--mulberry`.** `--mulberry` is for rules, icon strokes and borders only.
- **Content is verbatim from the artboards.** Julie & Nick · January 14th, 2027 · The Social Chapel, 12355 Fort Caroline Rd, Jacksonville, FL 32225 · RSVP deadline December 14, 2026 · Herb-Roasted Chicken, Pan-Seared Salmon, Garden Vegetable Risotto. All of it lives in `lib/site-config.ts`; never retype a fact into a component.
- **Every route must render without horizontal body scroll at 400px.**
- **Package manager: npm.** Node v24.16.0 is installed.

---

### Task 1: Scaffold the project

**Files:**
- Create: the Next.js app at the repository root, plus `vitest.config.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: nothing
- Produces: a buildable Next.js 15 app with Tailwind v4, shadcn/ui initialized, and `npm test` wired to Vitest. All later tasks assume `@/` resolves to the repository root.

- [ ] **Step 1: Scaffold Next.js into the existing directory**

The repository already contains `docs/`, `.gitignore`, and the source zip, so scaffold in place with `.` as the target.

```bash
npx --yes create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --turbopack --no-git
```

Answer `yes` if it asks to proceed in a non-empty directory. It must not reinitialize git.

- [ ] **Step 2: Verify the scaffold builds**

Run: `npm run build`
Expected: build completes, `Compiled successfully`.

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx --yes shadcn@latest init --defaults --yes
```

This writes `components.json`, `lib/utils.ts`, and rewrites `app/globals.css` with a token block. Task 2 replaces those token values with Mulberry.

- [ ] **Step 4: Add the shadcn components this build needs**

```bash
npx --yes shadcn@latest add button input textarea select checkbox radio-group label form sheet --yes
```

- [ ] **Step 5: Install runtime and test dependencies**

```bash
npm install next-themes@^0.4 zod@^4 react-hook-form@^7 @hookform/resolvers@^5
npm install --save-dev vitest@^3 @vitejs/plugin-react@^5
```

`@hookform/resolvers` v5 is required — v4 and earlier do not support zod v4.

- [ ] **Step 6: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 7: Add scripts to package.json**

In the `"scripts"` block, add:

```json
"test": "vitest run",
"test:watch": "vitest",
"typecheck": "tsc --noEmit"
```

- [ ] **Step 8: Verify the toolchain**

Run: `npm run typecheck && npm run build`
Expected: both succeed. `npm test` will report "No test files found" until Task 2 — that is expected here.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 + Tailwind v4 + shadcn/ui + Vitest"
```

---

### Task 2: Mulberry theme tokens and fonts

**Files:**
- Modify: `app/globals.css`, `app/layout.tsx`
- Test: `tests/theme.test.ts`

**Interfaces:**
- Consumes: the scaffold from Task 1
- Produces: CSS variables `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--primary-foreground`, `--secondary`, `--muted`, `--muted-foreground`, `--accent`, `--destructive`, `--success`, `--border`, `--input`, `--ring`, `--mulberry`, `--mulberry-strong`, `--radius` in both `:root` and `.dark`. Tailwind utilities `font-display`, `font-sans`, `text-mulberry`, `bg-mulberry`, `border-mulberry`, `text-mulberry-strong`, `text-success` become available to all later tasks.

- [ ] **Step 1: Write the failing test**

The theme is the contract every later task depends on, and a single mistyped hex is invisible until someone eyeballs it in the wrong mode. This test asserts the full token set exists in both scopes with exact values.

Create `tests/theme.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const css = readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf8");

function tokensIn(selector: string): Record<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`No "${selector}" block found in globals.css`);
  const out: Record<string, string> = {};
  for (const line of match[1].split(";")) {
    const [name, ...rest] = line.split(":");
    if (!name?.trim().startsWith("--")) continue;
    out[name.trim()] = rest.join(":").trim();
  }
  return out;
}

const LIGHT = {
  "--background": "#f5edf1",
  "--foreground": "#17151a",
  "--card": "#ece0e7",
  "--popover": "#ece0e7",
  "--primary": "#7b2e5e",
  "--primary-foreground": "#ffffff",
  "--secondary": "#ece0e7",
  "--muted": "#ece0e7",
  "--muted-foreground": "#7d576b",
  "--accent": "#ece0e7",
  "--destructive": "#b23b47",
  "--success": "#2f7d5f",
  "--border": "#ddd0d8",
  "--input": "#ddd0d8",
  "--ring": "#7b2e5e",
  "--mulberry": "#7b2e5e",
  "--mulberry-strong": "#7b2e5e",
};

const DARK = {
  "--background": "#17151a",
  "--foreground": "#f2e7ec",
  "--card": "#3d1e37",
  "--popover": "#3d1e37",
  "--primary": "#7b2e5e",
  "--primary-foreground": "#ffffff",
  "--secondary": "#3d1e37",
  "--muted": "#3d1e37",
  "--muted-foreground": "#c398ae",
  "--accent": "#3d1e37",
  "--destructive": "#d96b6b",
  "--success": "#5fa98c",
  "--border": "#4a3344",
  "--input": "#4a3344",
  "--ring": "#ac6284",
  "--mulberry": "#ac6284",
  "--mulberry-strong": "#c78ba8",
};

describe("Mulberry theme tokens", () => {
  it("defines every light-mode token on :root", () => {
    const root = tokensIn(":root");
    for (const [name, value] of Object.entries(LIGHT)) {
      expect(root[name], `:root ${name}`).toBe(value);
    }
  });

  it("defines every dark-mode token on .dark", () => {
    const dark = tokensIn(".dark");
    for (const [name, value] of Object.entries(DARK)) {
      expect(dark[name], `.dark ${name}`).toBe(value);
    }
  });

  it("overrides the same token names in both modes", () => {
    expect(Object.keys(tokensIn(".dark")).sort()).toEqual(
      Object.keys(tokensIn(":root")).sort(),
    );
  });

  it("sets a zero border radius", () => {
    expect(tokensIn(":root")["--radius"]).toBe("0rem");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/theme.test.ts`
Expected: FAIL — shadcn's default tokens are oklch values, not these hexes.

- [ ] **Step 3: Replace app/globals.css**

Replace the entire file:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0rem;
  --background: #f5edf1;
  --foreground: #17151a;
  --card: #ece0e7;
  --card-foreground: #17151a;
  --popover: #ece0e7;
  --popover-foreground: #17151a;
  --primary: #7b2e5e;
  --primary-foreground: #ffffff;
  --primary-hover: #3d1e37;
  --secondary: #ece0e7;
  --secondary-foreground: #17151a;
  --muted: #ece0e7;
  --muted-foreground: #7d576b;
  --accent: #ece0e7;
  --accent-foreground: #17151a;
  --destructive: #b23b47;
  --destructive-foreground: #f5edf1;
  --success: #2f7d5f;
  --border: #ddd0d8;
  --input: #ddd0d8;
  --ring: #7b2e5e;
  --mulberry: #7b2e5e;
  --mulberry-strong: #7b2e5e;
}

.dark {
  --radius: 0rem;
  --background: #17151a;
  --foreground: #f2e7ec;
  --card: #3d1e37;
  --card-foreground: #f2e7ec;
  --popover: #3d1e37;
  --popover-foreground: #f2e7ec;
  --primary: #7b2e5e;
  --primary-foreground: #ffffff;
  --primary-hover: #ac6284;
  --secondary: #3d1e37;
  --secondary-foreground: #f2e7ec;
  --muted: #3d1e37;
  --muted-foreground: #c398ae;
  --accent: #3d1e37;
  --accent-foreground: #f2e7ec;
  --destructive: #d96b6b;
  --destructive-foreground: #17151a;
  --success: #5fa98c;
  --border: #4a3344;
  --input: #4a3344;
  --ring: #ac6284;
  --mulberry: #ac6284;
  --mulberry-strong: #c78ba8;
}

@theme inline {
  --radius-sm: var(--radius);
  --radius-md: var(--radius);
  --radius-lg: var(--radius);
  --radius-xl: var(--radius);

  --font-display: var(--font-cormorant);
  --font-sans: var(--font-inter);

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary-hover: var(--primary-hover);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-mulberry: var(--mulberry);
  --color-mulberry-strong: var(--mulberry-strong);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground font-sans antialiased;
  }
  html {
    scroll-behavior: smooth;
  }
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-up {
  animation: fade-up 0.8s ease both;
}

@media (prefers-reduced-motion: reduce) {
  .animate-fade-up {
    animation: none;
  }
}
```

The `fade-up` keyframes come from the source artboards, which used them on the hero, welcome block and form card. The reduced-motion guard is new — the source had none.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/theme.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Wire the fonts in the root layout**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Julie & Nick — January 14, 2027",
  description:
    "Join Julie and Nick on January 14, 2027 at The Social Chapel in Jacksonville, Florida.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${cormorant.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
```

`suppressHydrationWarning` is required on `<html>` because next-themes mutates the class before React hydrates. Task 5 replaces the hardcoded `className="dark"` with the provider.

- [ ] **Step 6: Verify the build**

Run: `npm run typecheck && npm test && npm run build`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: map Mulberry palette onto shadcn token contract"
```

---

### Task 3: Site content configuration

**Files:**
- Create: `lib/site-config.ts`
- Test: `tests/site-config.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `siteConfig` with `couple`, `date`, `venue`, `rsvpDeadline`, `welcomeMessage`, `meals`, `nav`, `quickLinks`, `footerLine`. Also exports `type MealOption = { value: string; label: string }` and `type NavItem = { href: string; label: string }`.

- [ ] **Step 1: Write the failing test**

These strings appear across the homepage, RSVP page, footer and metadata. The test pins them so a careless edit cannot silently change the wedding date in one place only.

Create `tests/site-config.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { siteConfig } from "@/lib/site-config";

describe("siteConfig", () => {
  it("carries the couple and date", () => {
    expect(siteConfig.couple.joined).toBe("Julie & Nick");
    expect(siteConfig.date.long).toBe("January 14th, 2027");
    expect(siteConfig.date.iso).toBe("2027-01-14");
    expect(siteConfig.footerLine).toBe("January 14, 2027 · Jacksonville, FL");
  });

  it("carries the venue and a maps link to it", () => {
    expect(siteConfig.venue.name).toBe("The Social Chapel");
    expect(siteConfig.venue.street).toBe("12355 Fort Caroline Rd");
    expect(siteConfig.venue.cityStateZip).toBe("Jacksonville, FL 32225");
    expect(siteConfig.venue.mapsUrl).toContain("Fort+Caroline");
  });

  it("carries the RSVP deadline", () => {
    expect(siteConfig.rsvpDeadline).toBe("December 14, 2026");
  });

  it("offers exactly the three meals from the design", () => {
    expect(siteConfig.meals.map((m) => m.label)).toEqual([
      "Herb-Roasted Chicken",
      "Pan-Seared Salmon",
      "Garden Vegetable Risotto",
    ]);
  });

  it("has five nav items, all pointing at real routes", () => {
    expect(siteConfig.nav).toHaveLength(5);
    for (const item of siteConfig.nav) {
      expect(item.href.startsWith("/"), `${item.label} is not a route`).toBe(true);
    }
    expect(siteConfig.nav.map((n) => n.href)).toEqual([
      "/rsvp",
      "/schedule",
      "/travel",
      "/registry",
      "/faq",
    ]);
  });

  it("has six quick links", () => {
    expect(siteConfig.quickLinks).toHaveLength(6);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/site-config.test.ts`
Expected: FAIL — cannot resolve `@/lib/site-config`.

- [ ] **Step 3: Write lib/site-config.ts**

```ts
export type MealOption = { value: string; label: string };
export type NavItem = { href: string; label: string };
export type QuickLink = {
  href: string;
  label: string;
  description: string;
  icon: "mail" | "calendar" | "plane" | "gift" | "help" | "pin";
  external?: boolean;
};

export const siteConfig = {
  couple: { first: "Julie", second: "Nick", joined: "Julie & Nick" },

  date: {
    iso: "2027-01-14",
    long: "January 14th, 2027",
    short: "January 14, 2027",
  },

  venue: {
    name: "The Social Chapel",
    street: "12355 Fort Caroline Rd",
    cityStateZip: "Jacksonville, FL 32225",
    mapsUrl:
      "https://maps.google.com/?q=12355+Fort+Caroline+Rd+Jacksonville+FL+32225",
  },

  rsvpDeadline: "December 14, 2026",

  footerLine: "January 14, 2027 · Jacksonville, FL",

  welcomeMessage:
    "We are so excited to celebrate this special day with all of you. Your love and support have meant the world to us, and we cannot wait to share this moment together. More details to come — for now, save the date and get ready for a wonderful evening.",

  heroImage: {
    src: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=900&q=80",
    alt: "",
  },

  meals: [
    { value: "chicken", label: "Herb-Roasted Chicken" },
    { value: "salmon", label: "Pan-Seared Salmon" },
    { value: "vegetarian", label: "Garden Vegetable Risotto" },
  ] satisfies MealOption[],

  nav: [
    { href: "/rsvp", label: "RSVP" },
    { href: "/schedule", label: "Schedule" },
    { href: "/travel", label: "Travel & Accommodations" },
    { href: "/registry", label: "Registry" },
    { href: "/faq", label: "FAQ" },
  ] satisfies NavItem[],

  quickLinks: [
    {
      href: "/rsvp",
      label: "RSVP",
      description: "Let us know you're coming",
      icon: "mail",
    },
    {
      href: "/schedule",
      label: "Schedule",
      description: "Timeline for the day",
      icon: "calendar",
    },
    {
      href: "/travel",
      label: "Travel",
      description: "Getting there & staying nearby",
      icon: "plane",
    },
    {
      href: "/registry",
      label: "Registry",
      description: "Browse our wish list",
      icon: "gift",
    },
    {
      href: "/faq",
      label: "FAQ",
      description: "Common questions answered",
      icon: "help",
    },
    {
      href: "https://maps.google.com/?q=12355+Fort+Caroline+Rd+Jacksonville+FL+32225",
      label: "Venue",
      description: "View on Google Maps",
      icon: "pin",
      external: true,
    },
  ] satisfies QuickLink[],
} as const;
```

`heroImage.alt` is intentionally empty: the image is decorative and the adjacent text carries every fact it conveys.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/site-config.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: centralize wedding content in site-config"
```

---

### Task 4: RSVP validation schema

**Files:**
- Create: `lib/rsvp-schema.ts`
- Test: `tests/rsvp-schema.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `rsvpSchema` (zod), `normalizeRsvp(data: RsvpData): RsvpData`, `MEAL_VALUES`, and types `RsvpInput` (form values) and `RsvpData` (parsed output). Task 10 and Task 11 both import from here.

This task carries the only non-trivial logic in the project. The conditional rules are where client and server validation drift in practice, so they are specified exhaustively.

- [ ] **Step 1: Write the failing test**

Create `tests/rsvp-schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { rsvpSchema, normalizeRsvp } from "@/lib/rsvp-schema";

const accepting = {
  guestName: "Dana Whitfield",
  attendance: "accept" as const,
  meal: "salmon" as const,
  plusOne: false,
};

function errorPaths(input: unknown): string[] {
  const result = rsvpSchema.safeParse(input);
  if (result.success) return [];
  return result.error.issues.map((i) => i.path.join("."));
}

describe("rsvpSchema — guest name", () => {
  it("accepts a valid guest", () => {
    expect(rsvpSchema.safeParse(accepting).success).toBe(true);
  });

  it("rejects a blank name", () => {
    expect(errorPaths({ ...accepting, guestName: "   " })).toContain("guestName");
  });

  it("rejects a name over 100 characters", () => {
    expect(errorPaths({ ...accepting, guestName: "a".repeat(101) })).toContain(
      "guestName",
    );
  });

  it("trims surrounding whitespace", () => {
    const parsed = rsvpSchema.parse({ ...accepting, guestName: "  Dana  " });
    expect(parsed.guestName).toBe("Dana");
  });
});

describe("rsvpSchema — attendance", () => {
  it("requires an attendance choice", () => {
    const { attendance, ...withoutAttendance } = accepting;
    expect(errorPaths(withoutAttendance)).toContain("attendance");
  });

  it("rejects an unknown attendance value", () => {
    expect(errorPaths({ ...accepting, attendance: "maybe" })).toContain(
      "attendance",
    );
  });
});

describe("rsvpSchema — meal is conditional on attending", () => {
  it("requires a meal when accepting", () => {
    const { meal, ...withoutMeal } = accepting;
    expect(errorPaths(withoutMeal)).toContain("meal");
  });

  it("does not require a meal when declining", () => {
    const result = rsvpSchema.safeParse({
      guestName: "Dana Whitfield",
      attendance: "decline",
      plusOne: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a meal that is not on the menu", () => {
    expect(errorPaths({ ...accepting, meal: "lobster" })).toContain("meal");
  });
});

describe("rsvpSchema — plus-one is conditional on attending and the toggle", () => {
  it("requires a plus-one name and meal when attending with a plus one", () => {
    const paths = errorPaths({ ...accepting, plusOne: true });
    expect(paths).toContain("plusOneName");
    expect(paths).toContain("plusOneMeal");
  });

  it("accepts a complete plus-one", () => {
    const result = rsvpSchema.safeParse({
      ...accepting,
      plusOne: true,
      plusOneName: "Rowan Hale",
      plusOneMeal: "chicken",
    });
    expect(result.success).toBe(true);
  });

  it("does not require plus-one details when the toggle is off", () => {
    expect(errorPaths({ ...accepting, plusOne: false })).toEqual([]);
  });

  it("does not require plus-one details when declining, even if the toggle is on", () => {
    const result = rsvpSchema.safeParse({
      guestName: "Dana Whitfield",
      attendance: "decline",
      plusOne: true,
    });
    expect(result.success).toBe(true);
  });

  it("defaults plusOne to false when omitted", () => {
    const { plusOne, ...withoutPlusOne } = accepting;
    expect(rsvpSchema.parse(withoutPlusOne).plusOne).toBe(false);
  });
});

describe("rsvpSchema — dietary notes", () => {
  it("allows dietary notes to be omitted", () => {
    expect(rsvpSchema.safeParse(accepting).success).toBe(true);
  });

  it("rejects dietary notes over 500 characters", () => {
    expect(errorPaths({ ...accepting, dietary: "a".repeat(501) })).toContain(
      "dietary",
    );
  });
});

describe("normalizeRsvp", () => {
  it("strips every downstream field when declining", () => {
    const parsed = rsvpSchema.parse({
      guestName: "Dana Whitfield",
      attendance: "decline",
      plusOne: true,
      meal: "salmon",
      dietary: "No shellfish",
      plusOneName: "Rowan Hale",
      plusOneMeal: "chicken",
    });
    const normalized = normalizeRsvp(parsed);
    expect(normalized).toEqual({
      guestName: "Dana Whitfield",
      attendance: "decline",
      plusOne: false,
    });
  });

  it("strips plus-one fields when the toggle is off", () => {
    const parsed = rsvpSchema.parse({
      ...accepting,
      plusOneName: "Rowan Hale",
      plusOneMeal: "chicken",
      plusOneDietary: "Vegan",
    });
    const normalized = normalizeRsvp(parsed);
    expect(normalized.plusOneName).toBeUndefined();
    expect(normalized.plusOneMeal).toBeUndefined();
    expect(normalized.plusOneDietary).toBeUndefined();
  });

  it("leaves a complete accepting response untouched", () => {
    const parsed = rsvpSchema.parse({
      ...accepting,
      plusOne: true,
      plusOneName: "Rowan Hale",
      plusOneMeal: "chicken",
    });
    expect(normalizeRsvp(parsed)).toEqual(parsed);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/rsvp-schema.test.ts`
Expected: FAIL — cannot resolve `@/lib/rsvp-schema`.

- [ ] **Step 3: Write lib/rsvp-schema.ts**

```ts
import { z } from "zod";

export const MEAL_VALUES = ["chicken", "salmon", "vegetarian"] as const;
export type MealValue = (typeof MEAL_VALUES)[number];

const optionalNote = z
  .string()
  .trim()
  .max(500, "Please keep this under 500 characters")
  .optional();

const optionalName = z
  .string()
  .trim()
  .max(100, "Please keep this under 100 characters")
  .optional();

export const rsvpSchema = z
  .object({
    guestName: z
      .string()
      .trim()
      .min(1, "Please enter your name")
      .max(100, "Please keep this under 100 characters"),
    attendance: z.enum(["accept", "decline"], {
      message: "Please let us know if you can join us",
    }),
    meal: z.enum(MEAL_VALUES).optional(),
    dietary: optionalNote,
    plusOne: z.boolean().default(false),
    plusOneName: optionalName,
    plusOneMeal: z.enum(MEAL_VALUES).optional(),
    plusOneDietary: optionalNote,
  })
  .superRefine((data, ctx) => {
    // Declining supersedes everything downstream: no meal, no plus one.
    if (data.attendance !== "accept") return;

    if (!data.meal) {
      ctx.addIssue({
        code: "custom",
        path: ["meal"],
        message: "Please choose a meal",
      });
    }

    if (!data.plusOne) return;

    if (!data.plusOneName) {
      ctx.addIssue({
        code: "custom",
        path: ["plusOneName"],
        message: "Please enter your guest's name",
      });
    }

    if (!data.plusOneMeal) {
      ctx.addIssue({
        code: "custom",
        path: ["plusOneMeal"],
        message: "Please choose a meal for your guest",
      });
    }
  });

export type RsvpInput = z.input<typeof rsvpSchema>;
export type RsvpData = z.output<typeof rsvpSchema>;

/**
 * Drops fields the guest's answers made irrelevant, so a guest who filled the
 * form and then switched to "decline" does not submit a meal they will not eat.
 */
export function normalizeRsvp(data: RsvpData): RsvpData {
  if (data.attendance === "decline") {
    return {
      guestName: data.guestName,
      attendance: "decline",
      plusOne: false,
    };
  }

  if (!data.plusOne) {
    return {
      ...data,
      plusOneName: undefined,
      plusOneMeal: undefined,
      plusOneDietary: undefined,
    };
  }

  return data;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/rsvp-schema.test.ts`
Expected: PASS, 18 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add RSVP zod schema with conditional plus-one rules"
```

---

### Task 5: Theme provider and toggle

**Files:**
- Create: `components/theme-provider.tsx`, `components/theme-toggle.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: shadcn `Button` from Task 1
- Produces: `<ThemeProvider>` (wraps the app in the root layout) and `<ThemeToggle />` (used by `site-header` in Task 7).

- [ ] **Step 1: Create the theme provider**

Create `components/theme-provider.tsx`:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

- [ ] **Step 2: Create the theme toggle**

The source artboards showed a sun icon in dark mode and a moon in light, labelled with the mode you would switch *to*. Preserve that.

Create `components/theme-toggle.tsx`:

```tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  const label = isDark ? "Light" : "Dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${label.toLowerCase()} theme`}
      className="flex items-center gap-2 border border-border px-3.5 py-1.5 font-sans text-[11px] uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:border-mulberry hover:text-mulberry-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {/* Render a fixed-size placeholder until mounted so the nav does not shift. */}
      <span className="inline-flex size-3.5 items-center justify-center">
        {mounted &&
          (isDark ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="size-3.5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="size-3.5"
              aria-hidden="true"
            >
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          ))}
      </span>
      <span>{mounted ? label : "Theme"}</span>
    </button>
  );
}
```

The `mounted` guard is necessary: `resolvedTheme` is undefined on the server, so rendering the icon unguarded produces a hydration mismatch. The fixed-size placeholder keeps the nav from reflowing when it resolves.

- [ ] **Step 3: Wrap the app in the provider**

In `app/layout.tsx`, remove `className="dark"` from `<html>` and wrap the children:

```tsx
import { ThemeProvider } from "@/components/theme-provider";
```

```tsx
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${cormorant.variable} ${inter.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run build`
Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add next-themes provider and Mulberry theme toggle"
```

---

### Task 6: Shared presentational primitives

**Files:**
- Create: `components/rose-icon.tsx`, `components/section-eyebrow.tsx`, `components/quick-link-icon.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `<RoseIcon />` (logo with rose-to-house hover crossfade), `<SectionEyebrow>{children}</SectionEyebrow>` and `<SectionEyebrow align="center" rule>`, `<QuickLinkIcon name={...} />` where `name` is one of the six `QuickLink["icon"]` values from Task 3.

- [ ] **Step 1: Create the rose icon**

The source achieved the crossfade with a `<style>` block injected per artboard. Here it is a group-hover utility.

Create `components/rose-icon.tsx`:

```tsx
export function RoseIcon({ className = "" }: { className?: string }) {
  return (
    <span className={`group relative block size-7 ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 28 28"
        fill="none"
        className="absolute inset-0 size-7 opacity-100 transition-opacity duration-300 group-hover:opacity-0"
      >
        <path
          d="M14 4C14 4 16.5 2 18 3C19.5 4 18 7 17 8C16 9 14 10 14 10C14 10 12 9 11 8C10 7 8.5 4 10 3C11.5 2 14 4 14 4Z"
          fill="currentColor"
          opacity="0.7"
        />
        <path
          d="M14 10C14 10 18 8 20 9.5C22 11 20 14 18.5 15C17 16 14 16.5 14 16.5C14 16.5 11 16 9.5 15C8 14 6 11 8 9.5C10 8 14 10 14 10Z"
          fill="currentColor"
          opacity="0.5"
        />
        <path
          d="M14 16.5C14 16.5 16 17 16.5 19C17 21 15 23 14 24C13 23 11 21 11.5 19C12 17 14 16.5 14 16.5Z"
          fill="currentColor"
          opacity="0.35"
        />
        <line x1="14" y1="16" x2="14" y2="26" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
        <path d="M14 20C14 20 11.5 18.5 10 19" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.3" />
        <path d="M14 22C14 22 16.5 20.5 18 21" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.3" />
      </svg>
      <svg
        viewBox="0 0 28 28"
        fill="none"
        className="absolute inset-0 size-7 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      >
        <path d="M14 3L3 12H6V24H11V17H17V24H22V12H25L14 3Z" fill="currentColor" opacity="0.6" />
        <rect x="12" y="12" width="4" height="4" fill="currentColor" opacity="0.3" />
      </svg>
    </span>
  );
}
```

- [ ] **Step 2: Create the section eyebrow**

This pattern — 11px uppercase accent label, optional 48px hairline beneath — appears six times across the two artboards.

Create `components/section-eyebrow.tsx`:

```tsx
export function SectionEyebrow({
  children,
  align = "left",
  rule = false,
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "center";
  rule?: boolean;
  className?: string;
}) {
  return (
    <div className={align === "center" ? `text-center ${className}` : className}>
      <span className="block font-sans text-[11px] uppercase tracking-[0.15em] text-mulberry-strong">
        {children}
      </span>
      {rule && (
        <div
          className={`mt-6 h-px w-12 bg-mulberry ${align === "center" ? "mx-auto" : ""}`}
        />
      )}
    </div>
  );
}
```

Note the split from the Global Constraints: the label uses `text-mulberry-strong` (6.6:1 in dark mode) while the rule uses `bg-mulberry`, which has no contrast requirement.

- [ ] **Step 3: Create the quick-link icon set**

Create `components/quick-link-icon.tsx`:

```tsx
import type { QuickLink } from "@/lib/site-config";

const paths: Record<QuickLink["icon"], React.ReactNode> = {
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" />
      <polyline points="3 5 12 13 21 5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  plane: (
    <>
      <path d="M3 21L12 3L21 21H3Z" />
      <circle cx="12" cy="14" r="2" />
    </>
  ),
  gift: (
    <>
      <path d="M20 12V22H4V12" />
      <path d="M22 7H2V12H22V7Z" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7C12 7 12 3 8 3C6 3 5 4.5 5 6C5 7.5 7 7 12 7Z" />
      <path d="M12 7C12 7 12 3 16 3C18 3 19 4.5 19 6C19 7.5 17 7 12 7Z" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 9C9 7.5 10.5 6.5 12 6.5C13.5 6.5 15 7.5 15 9C15 10.5 13 11 12 12V14" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </>
  ),
  pin: (
    <>
      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
};

export function QuickLinkIcon({ name }: { name: QuickLink["icon"] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      className="size-6 text-mulberry"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run build`
Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add rose logo, section eyebrow, and quick-link icons"
```

---

### Task 7: Site header

**Files:**
- Create: `components/site-header.tsx`

**Interfaces:**
- Consumes: `siteConfig.nav` (Task 3), `<RoseIcon />` (Task 6), `<ThemeToggle />` (Task 5), shadcn `Sheet` (Task 1)
- Produces: `<SiteHeader />`, mounted by the root layout in Task 8.

This replaces two divergent hand-copied navs from the source artboards, and adds the mobile collapse the source lacked entirely.

- [ ] **Step 1: Create components/site-header.tsx**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RoseIcon } from "@/components/rose-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/lib/site-config";

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
```

`SheetTitle` is visually hidden but present: Radix's dialog primitive warns at runtime without an accessible title.

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run build`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add shared site header with mobile sheet nav"
```

---

### Task 8: Site footer and layout wiring

**Files:**
- Create: `components/site-footer.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `siteConfig` (Task 3), `<SiteHeader />` (Task 7)
- Produces: `<SiteFooter />`, and a root layout that renders header, `{children}` inside a `<main>` offset for the fixed header, and footer. Every page from Task 9 onward renders inside that `<main>` and must not repeat the header, footer, or top spacer.

- [ ] **Step 1: Create components/site-footer.tsx**

```tsx
import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card px-6 py-10 text-center md:px-16">
      <p className="font-display text-xl font-light italic text-muted-foreground">
        {siteConfig.couple.joined}
      </p>
      <p className="mt-2 font-sans text-[11px] uppercase tracking-[0.1em] text-muted-foreground opacity-60">
        {siteConfig.footerLine}
      </p>
    </footer>
  );
}
```

- [ ] **Step 2: Wire header and footer into the root layout**

In `app/layout.tsx`, add the imports and render them inside the provider:

```tsx
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
```

Replace `{children}` with:

```tsx
          <SiteHeader />
          <main className="pt-14">{children}</main>
          <SiteFooter />
```

`pt-14` is the 56px offset for the fixed header, matching the spacer div the source artboards used.

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run build`
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add site footer and wire the shared layout shell"
```

---

### Task 9: Homepage

**Files:**
- Modify: `app/page.tsx`, `next.config.ts`

**Interfaces:**
- Consumes: `siteConfig` (Task 3), `<SectionEyebrow>` and `<QuickLinkIcon>` (Task 6)
- Produces: the `/` route. No exports consumed by later tasks.

- [ ] **Step 1: Allow the Unsplash host in next.config.ts**

Replace `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 2: Replace app/page.tsx**

```tsx
import Image from "next/image";
import Link from "next/link";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { QuickLinkIcon } from "@/components/quick-link-icon";
import { siteConfig } from "@/lib/site-config";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="grid min-h-[calc(100vh-3.5rem)] grid-cols-1 md:grid-cols-2">
        <div className="animate-fade-up flex flex-col justify-center px-6 py-16 md:px-16 md:py-20">
          <SectionEyebrow className="mb-6">
            Together with their families
          </SectionEyebrow>

          <h1 className="font-display text-[clamp(3rem,10vw,4.5rem)] font-light leading-[1.05] tracking-[-0.01em] text-foreground">
            {siteConfig.couple.first}
          </h1>
          <span className="my-1 ml-1 block font-display text-3xl font-light italic text-mulberry">
            &amp;
          </span>
          <h1 className="mb-8 font-display text-[clamp(3rem,10vw,4.5rem)] font-light leading-[1.05] tracking-[-0.01em] text-foreground">
            {siteConfig.couple.second}
          </h1>

          <div className="mb-8 h-px w-12 bg-mulberry" />

          <p className="font-sans text-sm uppercase tracking-[0.08em] text-foreground">
            {siteConfig.date.long}
          </p>
          <p className="mt-2 font-sans text-[13px] leading-relaxed text-muted-foreground">
            {siteConfig.venue.name}
            <br />
            {siteConfig.venue.street}
            <br />
            {siteConfig.venue.cityStateZip}
          </p>
        </div>

        <div className="animate-fade-up relative aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[calc(100vh-3.5rem)]">
          <Image
            src={siteConfig.heroImage.src}
            alt={siteConfig.heroImage.alt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-background to-transparent to-20% md:block" />
        </div>
      </section>

      {/* WELCOME */}
      <section className="animate-fade-up flex justify-center border-y border-border bg-card px-6 py-16 md:px-16 md:py-20">
        <div className="max-w-2xl text-center">
          <SectionEyebrow align="center" className="mb-5">
            A Note From Us
          </SectionEyebrow>
          <p className="font-display text-2xl font-light italic leading-[1.7] text-foreground">
            {siteConfig.welcomeMessage}
          </p>
          <div className="mx-auto mt-6 h-px w-8 bg-mulberry" />
        </div>
      </section>

      {/* QUICK LINKS */}
      <section className="bg-background px-6 py-16 md:px-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <SectionEyebrow align="center" className="mb-12">
            Quick Links
          </SectionEyebrow>

          <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 md:grid-cols-3">
            {siteConfig.quickLinks.map((link) => {
              const content = (
                <>
                  <QuickLinkIcon name={link.icon} />
                  <span className="font-sans text-xs uppercase tracking-[0.1em] text-foreground">
                    {link.label}
                  </span>
                  <span className="font-display text-[15px] italic text-muted-foreground">
                    {link.description}
                  </span>
                </>
              );

              const className =
                "flex flex-col items-center gap-3 bg-background px-8 py-10 text-center transition-colors hover:bg-card";

              return link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {content}
                </a>
              ) : (
                <Link key={link.label} href={link.href} className={className}>
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
```

The `gap-px` over a `bg-border` grid reproduces the source's hairline-separator technique. It collapses to one column below `sm`, which the source could not do.

- [ ] **Step 3: Verify the build and view the page**

Run: `npm run typecheck && npm run build`
Expected: both pass.

Then run `npm run dev` and open `http://localhost:3000`. Confirm: dark mode on load, names stacked with the italic ampersand, hero photo with a left gradient fade, hairline-separated quick links, and that the theme toggle flips both hero and footer with no flash.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: build the homepage from the canvas artboard"
```

---

### Task 10: RSVP server action

**Files:**
- Create: `app/rsvp/actions.ts`
- Test: `tests/rsvp-action.test.ts`

**Interfaces:**
- Consumes: `rsvpSchema`, `normalizeRsvp`, `RsvpInput` (Task 4)
- Produces: `submitRsvp(values: RsvpInput): Promise<RsvpResult>` where
  `type RsvpResult = { ok: true } | { ok: false; message: string; fieldErrors?: Record<string, string[]> }`.
  Task 11 imports both.

- [ ] **Step 1: Write the failing test**

A Server Action is a public endpoint; client validation is advisory only. These tests assert the server re-validates rather than trusting its caller.

Create `tests/rsvp-action.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { submitRsvp } from "@/app/rsvp/actions";

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("submitRsvp", () => {
  it("accepts a complete response", async () => {
    const result = await submitRsvp({
      guestName: "Dana Whitfield",
      attendance: "accept",
      meal: "salmon",
      plusOne: false,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a payload that skipped client validation", async () => {
    const result = await submitRsvp({
      guestName: "",
      attendance: "accept",
      plusOne: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.guestName).toBeDefined();
      expect(result.fieldErrors?.meal).toBeDefined();
    }
  });

  it("rejects an incomplete plus-one", async () => {
    const result = await submitRsvp({
      guestName: "Dana Whitfield",
      attendance: "accept",
      meal: "salmon",
      plusOne: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.plusOneName).toBeDefined();
    }
  });

  it("records a declining guest without meal details", async () => {
    const spy = vi.spyOn(console, "info");
    const result = await submitRsvp({
      guestName: "Dana Whitfield",
      attendance: "decline",
      meal: "salmon",
      plusOne: true,
      plusOneName: "Rowan Hale",
    });
    expect(result.ok).toBe(true);

    const recorded = spy.mock.calls.at(-1)?.[1] as Record<string, unknown>;
    expect(recorded.meal).toBeUndefined();
    expect(recorded.plusOneName).toBeUndefined();
    expect(recorded.plusOne).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/rsvp-action.test.ts`
Expected: FAIL — cannot resolve `@/app/rsvp/actions`.

- [ ] **Step 3: Write app/rsvp/actions.ts**

```ts
"use server";

import { rsvpSchema, normalizeRsvp, type RsvpInput } from "@/lib/rsvp-schema";

export type RsvpResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function submitRsvp(values: RsvpInput): Promise<RsvpResult> {
  // Re-validate on the server: this action is a public endpoint and the
  // client-side resolver is advisory only.
  const parsed = rsvpSchema.safeParse(values);

  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    return {
      ok: false,
      message: "Please check the highlighted fields and try again.",
      fieldErrors: flattened.fieldErrors as Record<string, string[]>,
    };
  }

  const rsvp = normalizeRsvp(parsed.data);

  // TODO(persistence): write `rsvp` to the real store — database, email, or
  // spreadsheet. This console record is the only thing standing in for it, so
  // responses are NOT durably saved until this line is replaced.
  console.info("[rsvp] received", rsvp);

  return { ok: true };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/rsvp-action.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add RSVP server action with server-side revalidation"
```

---

### Task 11: RSVP form and page

**Files:**
- Create: `components/rsvp-form.tsx`, `app/rsvp/page.tsx`

**Interfaces:**
- Consumes: `submitRsvp`, `RsvpResult` (Task 10); `rsvpSchema`, `RsvpInput` (Task 4); `siteConfig` (Task 3); `<SectionEyebrow>` (Task 6); shadcn `Form`, `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Button` (Task 1)
- Produces: the `/rsvp` route.

- [ ] **Step 1: Create components/rsvp-form.tsx**

```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitRsvp } from "@/app/rsvp/actions";
import { rsvpSchema, type RsvpInput } from "@/lib/rsvp-schema";
import { siteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const labelClass =
  "font-sans text-[11px] uppercase tracking-[0.1em] text-muted-foreground";

export function RsvpForm() {
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<RsvpInput>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: {
      guestName: "",
      plusOne: false,
      dietary: "",
      plusOneName: "",
      plusOneDietary: "",
    },
  });

  const attendance = form.watch("attendance");
  const plusOne = form.watch("plusOne");
  const attending = attendance === "accept";
  const showPlusOneFields = attending && plusOne;

  async function onSubmit(values: RsvpInput) {
    setFormError(null);
    const result = await submitRsvp(values);

    if (result.ok) {
      setSubmitted(true);
      return;
    }

    setFormError(result.message);
    for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
      if (messages?.[0]) {
        form.setError(field as keyof RsvpInput, { message: messages[0] });
      }
    }
  }

  if (submitted) {
    return (
      <div className="animate-fade-up w-full max-w-lg border border-border bg-card p-10 text-center">
        <p className="font-display text-3xl font-light italic text-foreground">
          Thank you
        </p>
        <div className="mx-auto my-6 h-px w-12 bg-mulberry" />
        <p className="font-sans text-sm text-muted-foreground">
          Your response has been received. We cannot wait to celebrate with you.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-up w-full max-w-lg border border-border bg-card p-8 md:p-10">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
          <FormField
            control={form.control}
            name="guestName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>Guest Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your full name"
                    className="border-border bg-background"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="attendance"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  Will you be attending?
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-col gap-3 sm:flex-row sm:gap-6"
                  >
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="accept" />
                      </FormControl>
                      <FormLabel className="font-sans text-sm font-normal text-foreground">
                        Joyfully Accept
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="decline" />
                      </FormControl>
                      <FormLabel className="font-sans text-sm font-normal text-foreground">
                        Regretfully Decline
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {attending && (
            <>
              <FormField
                control={form.control}
                name="plusOne"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2.5 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-sans text-sm font-normal text-foreground">
                      I will be bringing a plus one
                    </FormLabel>
                  </FormItem>
                )}
              />

              {showPlusOneFields && (
                <FormField
                  control={form.control}
                  name="plusOneName"
                  render={({ field }) => (
                    <FormItem className="animate-fade-up">
                      <FormLabel className={labelClass}>
                        Name of Plus One
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Guest's full name"
                          className="border-border bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="meal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Meal Selection</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full border-border bg-background">
                          <SelectValue placeholder="Select your meal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {siteConfig.meals.map((meal) => (
                          <SelectItem key={meal.value} value={meal.value}>
                            {meal.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showPlusOneFields && (
                <FormField
                  control={form.control}
                  name="plusOneMeal"
                  render={({ field }) => (
                    <FormItem className="animate-fade-up">
                      <FormLabel className={labelClass}>
                        Plus One Meal Selection
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full border-border bg-background">
                            <SelectValue placeholder="Select their meal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {siteConfig.meals.map((meal) => (
                            <SelectItem key={meal.value} value={meal.value}>
                              {meal.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="dietary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>
                      Dietary Restrictions
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Please list any allergies or dietary needs"
                        className="border-border bg-background"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showPlusOneFields && (
                <FormField
                  control={form.control}
                  name="plusOneDietary"
                  render={({ field }) => (
                    <FormItem className="animate-fade-up">
                      <FormLabel className={labelClass}>
                        Plus One&apos;s Dietary Restrictions
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Please list any allergies or dietary needs for your guest"
                          className="border-border bg-background"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </>
          )}

          {formError && (
            <p role="alert" className="font-sans text-sm text-destructive">
              {formError}
            </p>
          )}

          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full bg-primary py-3.5 font-sans text-xs font-medium uppercase tracking-[0.1em] text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {form.formState.isSubmitting ? "Sending…" : "Submit RSVP"}
          </Button>

          <p className="text-center font-sans text-xs text-muted-foreground">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mr-1 inline-block size-3 align-[-1px] text-mulberry"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            RSVP deadline:{" "}
            <span className="text-mulberry-strong">
              {siteConfig.rsvpDeadline}
            </span>
          </p>
        </form>
      </Form>
    </div>
  );
}
```

Gating the fields on `attending` is the visual half of the spec's decline rule; `normalizeRsvp` in the action is the data half.

- [ ] **Step 2: Create app/rsvp/page.tsx**

```tsx
import type { Metadata } from "next";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { RsvpForm } from "@/components/rsvp-form";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "RSVP — Julie & Nick",
  description: `Please respond by ${siteConfig.rsvpDeadline}.`,
};

export default function RsvpPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center bg-background px-6 pb-20 pt-16">
      <div className="animate-fade-up mb-12 text-center">
        <SectionEyebrow align="center" className="mb-4">
          Kindly Respond
        </SectionEyebrow>
        <h1 className="font-display text-[clamp(2.5rem,8vw,3.5rem)] font-light tracking-[-0.01em] text-foreground">
          RSVP
        </h1>
        <div className="mx-auto my-6 h-px w-12 bg-mulberry" />
        <p className="font-sans text-sm text-muted-foreground">
          Please respond by{" "}
          <span className="font-medium text-mulberry-strong">
            {siteConfig.rsvpDeadline}
          </span>
        </p>
      </div>

      <RsvpForm />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm test && npm run build`
Expected: all pass.

Then run `npm run dev` and open `http://localhost:3000/rsvp`. Confirm: submitting empty shows field errors; choosing Decline hides meal, plus-one and dietary fields; checking the plus-one box reveals three extra fields; a valid submission replaces the form with the thank-you panel and logs `[rsvp] received` in the terminal; pressing Enter in the name field submits.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: build the RSVP page with validated conditional form"
```

---

### Task 12: WIP pages

**Files:**
- Create: `components/wip-page.tsx`, `app/schedule/page.tsx`, `app/travel/page.tsx`, `app/registry/page.tsx`, `app/faq/page.tsx`

**Interfaces:**
- Consumes: `<SectionEyebrow>` (Task 6), `siteConfig` (Task 3)
- Produces: the `/schedule`, `/travel`, `/registry`, `/faq` routes. After this task no nav link is dead.

- [ ] **Step 1: Create components/wip-page.tsx**

```tsx
import Link from "next/link";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { siteConfig } from "@/lib/site-config";

export function WipPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-background px-6 py-20 text-center">
      <div className="animate-fade-up max-w-xl">
        <SectionEyebrow align="center" className="mb-5">
          Coming Soon
        </SectionEyebrow>

        <h1 className="font-display text-[clamp(2.5rem,8vw,3.5rem)] font-light tracking-[-0.01em] text-foreground">
          {title}
        </h1>

        <div className="mx-auto my-7 h-px w-12 bg-mulberry" />

        <p className="font-display text-xl font-light italic leading-relaxed text-muted-foreground">
          {description}
        </p>

        <p className="mt-8 font-sans text-[13px] leading-relaxed text-muted-foreground">
          We are still putting this page together. Check back before{" "}
          {siteConfig.date.short}.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
          <Link
            href="/"
            className="font-sans text-[11px] uppercase tracking-[0.1em] text-mulberry-strong transition-opacity hover:opacity-75"
          >
            Return Home
          </Link>
          <Link
            href="/rsvp"
            className="font-sans text-[11px] uppercase tracking-[0.1em] text-mulberry-strong transition-opacity hover:opacity-75"
          >
            RSVP
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the four routes**

`app/schedule/page.tsx`:

```tsx
import type { Metadata } from "next";
import { WipPage } from "@/components/wip-page";

export const metadata: Metadata = { title: "Schedule — Julie & Nick" };

export default function SchedulePage() {
  return (
    <WipPage
      title="Schedule"
      description="The timeline for the day — ceremony, cocktails, dinner and dancing."
    />
  );
}
```

`app/travel/page.tsx`:

```tsx
import type { Metadata } from "next";
import { WipPage } from "@/components/wip-page";

export const metadata: Metadata = {
  title: "Travel & Accommodations — Julie & Nick",
};

export default function TravelPage() {
  return (
    <WipPage
      title="Travel & Accommodations"
      description="Getting to Jacksonville, where to stay, and how to reach the venue."
    />
  );
}
```

`app/registry/page.tsx`:

```tsx
import type { Metadata } from "next";
import { WipPage } from "@/components/wip-page";

export const metadata: Metadata = { title: "Registry — Julie & Nick" };

export default function RegistryPage() {
  return (
    <WipPage
      title="Registry"
      description="Our wish list, for anyone who would like to give a gift."
    />
  );
}
```

`app/faq/page.tsx`:

```tsx
import type { Metadata } from "next";
import { WipPage } from "@/components/wip-page";

export const metadata: Metadata = { title: "FAQ — Julie & Nick" };

export default function FaqPage() {
  return (
    <WipPage
      title="FAQ"
      description="Dress code, parking, children, and everything else you might be wondering."
    />
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run build`
Expected: both pass, and the build output lists `/`, `/rsvp`, `/schedule`, `/travel`, `/registry`, `/faq`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add WIP pages for schedule, travel, registry, and FAQ"
```

---

### Task 13: Verification pass

**Files:**
- Create: `README.md`
- Modify: any file needing a fix found during verification

**Interfaces:**
- Consumes: everything
- Produces: a verified build and a README documenting the placeholders.

- [ ] **Step 1: Run the full gate**

Run: `npm run typecheck && npm test && npm run build`
Expected: typecheck clean, 32 tests passing across 4 files, build succeeds.

- [ ] **Step 2: Check every route at 400px**

Run `npm run dev`. In the browser devtools device toolbar, set the viewport to 400×800 and visit `/`, `/rsvp`, `/schedule`, `/travel`, `/registry`, `/faq`.

For each, confirm: no horizontal scrollbar on `<body>`; the header shows the logo, theme toggle and hamburger only; the hamburger opens the sheet and tapping a link closes it and navigates. On `/`, confirm the hero stacks with the photo below the names and the quick links are one column.

Fix any overflow before continuing. The usual cause is a fixed width or a `min-w` on a grid child.

- [ ] **Step 3: Check both themes on every route**

Toggle the theme on each route. Confirm no element keeps a dark-mode color in light mode, the choice survives a page navigation and a reload, and there is no flash of the wrong theme on reload.

- [ ] **Step 4: Check keyboard access on the RSVP form**

Tab from the top of `/rsvp`. Confirm every control is reachable in visual order, the focus ring is visible on each, arrow keys move between the two attendance radios, Space toggles the plus-one checkbox, and Enter in the name field submits.

- [ ] **Step 5: Write the README**

Create `README.md`:

````markdown
# Julie & Nick — Wedding Site

Next.js 15 + Tailwind v4 + shadcn/ui. Ported from a Claude Design canvas
export; see `docs/superpowers/specs/2026-09-12-wedding-site-nextjs-design.md`.

## Commands

```bash
npm run dev        # development server
npm run build      # production build
npm test           # Vitest
npm run typecheck  # tsc --noEmit
```

## Theme

The Mulberry palette is expressed as shadcn's CSS-variable contract in
`app/globals.css` — light values on `:root`, dark on `.dark`. Dark is the
default and the OS preference is deliberately ignored.

Two rules that are easy to break:

- **Zero border radius everywhere.** `--radius: 0rem`.
- **`--mulberry` is for rules, icon strokes and borders; `--mulberry-strong`
  is for accent-colored text below 18px.** The plain accent measures 4.17:1
  on the dark background, under AA for the 11px eyebrows.

`tests/theme.test.ts` pins every token value in both modes.

## Placeholders

These are deliberate and marked:

1. **RSVP responses are not saved.** `app/rsvp/actions.ts` validates and logs
   to the console. Replace the `TODO(persistence)` line with a real store.
2. **The hero photo is a hotlinked Unsplash URL** in `lib/site-config.ts`.
3. **Schedule, Travel, Registry and FAQ are WIP stubs** rendering
   `components/wip-page.tsx`.

## Content

Every wedding fact lives in `lib/site-config.ts` and is pinned by
`tests/site-config.test.ts`. Change the date there, not in a component.
````

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "docs: add README covering theme rules and known placeholders"
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| Stack | 1 |
| Theme architecture, token mapping, typography | 2 |
| Content | 3 |
| Validation rules, decline supersedes downstream | 4, 10, 11 |
| Structure — theme provider, toggle | 5 |
| Structure — primitives | 6 |
| Structure — header (removes duplication) | 7 |
| Structure — footer, layout shell | 8 |
| Homepage sections | 9 |
| Data flow, server re-validation | 10 |
| RSVP form fields, error and success handling | 11 |
| WIP pages | 12 |
| Responsive behavior, accessibility, success criteria | 13 |
| Known placeholders | 9 (hero), 10 (persistence), 12 (stubs), 13 (README) |

No spec requirement is unimplemented.

**Deviations from the spec, with reasons:**

1. **Button fill is `#7b2e5e` in both modes, not `#ac6284` with near-white text.** The spec's remedy did not work: `#fdf7fa` on `#ac6284` is ~3.1:1, essentially unchanged from white. Neither a light nor a dark foreground reaches AA on that mauve. Using accentDeep as the fill gives 7.7:1 with white and keeps both colors in the palette; dark mode's hover lifts to `#ac6284`, inverting the source's resting/hover pair rather than discarding it.
2. **The accent splits into `--mulberry` and `--mulberry-strong`.** `#ac6284` on `#17151a` measures 4.17:1 — adequate for rules and icon strokes, short of AA for the 11px uppercase eyebrows. `--mulberry-strong` `#c78ba8` measures 6.6:1. Light mode uses `#7b2e5e` for both.
3. **`--primary-hover` added.** Tailwind has no utility for a hover color that differs per theme; a token is the least surprising way to express it.

**Type consistency:** `RsvpInput`/`RsvpData` are defined in Task 4 and used with those names in Tasks 10 and 11. `RsvpResult` is defined in Task 10 and consumed in Task 11. `QuickLink["icon"]` is defined in Task 3 and consumed in Task 6. `normalizeRsvp` keeps its name across Tasks 4 and 10. `SectionEyebrow`'s `align`/`rule`/`className` props are consistent in Tasks 6, 9, 11 and 12.

**Placeholder scan:** the only "TODO" is `TODO(persistence)`, which is a deliberate, specified product artifact, not a plan gap.

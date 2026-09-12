# Julie & Nick Wedding Site — Next.js + shadcn/ui Design

**Date:** 2026-09-12
**Status:** Approved
**Source material:** `Julie and Nick Wedding Homepage.zip` — a Claude Design canvas export containing two `.dc.html` artboards (Homepage, RSVP), the `dc-runtime` (`support.js`), and `uploads/mulberry-theme.md`.

## Purpose

Port a two-artboard Claude Design canvas mockup into a real, deployable Next.js application, preserving the Mulberry visual language exactly while fixing the structural gaps that make the canvas a mockup rather than a site. Stub the four unbuilt nav destinations as WIP pages so the navigation is complete and honest.

## Success criteria

1. Homepage and RSVP render as faithful reproductions of the artboards in both Mulberry modes.
2. All five nav links resolve to real routes. No dead anchors.
3. The RSVP form validates input and submits through a Server Action with a single, clearly marked persistence swap point.
4. Every page is usable at 400px width. No horizontal body scroll.
5. `tsc --noEmit`, `vitest run`, and `next build` all pass.

## Non-goals

- Real RSVP persistence (database, email, Google Sheets). Deliberately stubbed; see Decisions.
- Real content for Schedule, Travel, Registry, FAQ. These are WIP stubs by request.
- Authentication, guest-list matching, or admin views.
- Deployment configuration.

---

## Decisions

Three decisions were settled with the project owner before design:

| Decision | Choice | Rationale |
|---|---|---|
| RSVP submission | Validated form, stubbed persistence | Full UX works end to end; only the write target is a stub. Avoids committing to a backend before the hosting story is decided. |
| Theme default | Dark default, `enableSystem={false}` | Preserves the canvas's authored intent (Mulberry Noir as the primary presentation) while eliminating its light-mode flash. |
| WIP pages | Schedule, Travel, Registry, FAQ | All four nav destinations, so navigation is complete. |

---

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15, App Router, TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Theming | next-themes |
| Forms | react-hook-form + zod, via shadcn Form |
| Fonts | `next/font/google` — Cormorant Garamond, Inter |
| Tests | Vitest |

Fonts move from the canvas's runtime `<link>` to `next/font`, which self-hosts at build time. This removes an external request and the associated flash of unstyled text.

---

## Theme architecture

### The name collision

shadcn/ui styles its components from a fixed CSS-variable contract. Mulberry defines its own token names, and the two collide semantically: **Mulberry `primary` means body text; shadcn `--primary` means brand accent.** A naive mapping renders every button in the color of paragraph text.

Mulberry is therefore expressed *as* shadcn's contract rather than alongside it.

### Token mapping

| Mulberry token | shadcn variable | Dark (Noir) | Light (Bloom) |
|---|---|---|---|
| `page` | `--background` | `#17151a` | `#f5edf1` |
| `primary` | `--foreground` | `#f2e7ec` | `#17151a` |
| `secondary` | `--muted-foreground` | `#c398ae` | `#7d576b` |
| `accent` | `--primary`, `--ring` | `#ac6284` | `#7b2e5e` |
| `accentDeep` | `--primary` hover state | `#7b2e5e` | `#3d1e37` |
| `neutral` | `--border`, `--input` | `#4a3344` | `#ddd0d8` |
| `surface` | `--card`, `--popover`, `--muted` | `#3d1e37` | `#ece0e7` |
| `bull` | `--success` (custom) | `#5fa98c` | `#2f7d5f` |
| `bear` | `--destructive` | `#d96b6b` | `#b23b47` |

`--primary-foreground` is set to a warm near-white rather than pure `#fff`; see Accessibility.

`--radius: 0` globally, honoring Mulberry's zero-border-radius rule. Every shadcn component added later inherits it.

### Implementation

Tailwind v4 declares tokens in CSS via `@theme inline`, not `tailwind.config.js`. The Mulberry theme document's config blocks are therefore translated, not copied. Light mode is the `:root` declaration; dark mode is a `.dark { }` block overriding the same variable names — which realizes the "swap one colors block to flip the whole design" property the theme document describes.

`next-themes` with `attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}`. Its pre-hydration script sets the class before first paint, eliminating the canvas's flash.

### Typography

- **Display** — Cormorant Garamond, weight 300, frequently italic. Names, page titles, footer wordmark, quick-link descriptions.
- **UI** — Inter. Nav, labels, form controls, metadata.
- **Eyebrows** — Inter, 11px, `letter-spacing: 0.15em`, uppercase, accent color, usually above a 48px hairline rule.

The `bull`/`bear` pair and JetBrains Mono in the source theme are vestiges of its origin as an equity-research theme. Mono is dropped. `bull`/`bear` are retained because form validation gives them genuine use.

---

## Structure

```
app/
  layout.tsx                 fonts, ThemeProvider, SiteHeader, SiteFooter
  globals.css                @theme inline token declarations, both modes
  page.tsx                   homepage
  rsvp/
    page.tsx
    actions.ts               submitRsvp Server Action
  schedule/page.tsx          WIP
  travel/page.tsx            WIP
  registry/page.tsx          WIP
  faq/page.tsx               WIP
components/
  site-header.tsx            nav, rose/house logo, theme toggle, mobile Sheet
  site-footer.tsx
  theme-provider.tsx
  theme-toggle.tsx
  rose-icon.tsx              both SVGs with the hover crossfade
  section-eyebrow.tsx        uppercase accent label + hairline rule
  wip-page.tsx               shared WIP layout, props: title, description
  rsvp-form.tsx              client component
  ui/                        shadcn primitives
lib/
  rsvp-schema.ts             zod schema, shared client and server
  site-config.ts             names, date, venue, deadline, meal options, nav items
```

### Component boundaries

- **`site-header.tsx`** — the canvas duplicated the nav across both artboards and they had already drifted (the homepage logo linked to `#top`, the RSVP logo to a file path). One component, one source of truth, rendered from the root layout. Active route is derived from `usePathname()`.
- **`section-eyebrow.tsx`** — the eyebrow-plus-rule pattern appears six times across the two artboards with identical styling. Extracted so the rule's width and spacing are defined once.
- **`wip-page.tsx`** — all four stubs differ only in title and blurb. One layout component, four thin pages.
- **`site-config.ts`** — wedding facts (names, date, venue, deadline, meals, nav) appear in both artboards, the footer, and the RSVP copy. Centralized so a date change is one edit.

---

## Content

Preserved verbatim from the artboards:

- **Couple:** Julie & Nick
- **Date:** January 14, 2027
- **Venue:** The Social Chapel, 12355 Fort Caroline Rd, Jacksonville, FL 32225
- **RSVP deadline:** December 14, 2026
- **Meals:** Herb-Roasted Chicken · Pan-Seared Salmon · Garden Vegetable Risotto
- **Welcome message:** the full "A Note From Us" paragraph
- **Quick-link tiles:** RSVP, Schedule, Travel, Registry, FAQ, Venue (Google Maps), with their italic descriptions

### Homepage sections

1. Fixed 56px header
2. Hero — asymmetric two-column: names, eyebrow, hairline, date, venue on the left; photo with a left-edge gradient mask on the right
3. Welcome message — centered, `surface` background, hairline borders top and bottom
4. Quick links — six tiles in a 3-column grid using the 1px-gap-over-`neutral`-background technique that produces hairline separators
5. Footer

### RSVP form fields

Guest name · attendance (accept/decline) · plus-one toggle · plus-one name *(conditional)* · meal selection · plus-one meal *(conditional)* · dietary restrictions · plus-one dietary restrictions *(conditional)*.

Everything after attendance is gated on accepting; the plus-one fields are gated on the toggle in addition. See Validation rules.

---

## Data flow

```
rsvp-form.tsx (client)
  |
  +- react-hook-form + zodResolver(rsvpSchema)
       |
       +- submitRsvp(data)   [Server Action]
            |
            +- rsvpSchema.safeParse(data)     re-validated server-side
                 |
                 +- failure -> { ok: false, errors }
                 +- success -> TODO(persistence) -> { ok: true }
```

The schema is imported by both sides, so client and server validation cannot drift. Server-side re-validation is not redundant: a Server Action is a public endpoint and client validation is advisory.

### Validation rules

- Guest name: required, trimmed, 1–100 characters
- Attendance: required, `"accept" | "decline"`
- Meal: required **when attending**, one of the three enum values
- Plus-one name and meal: required **only when attending and the plus-one checkbox is set** — a zod `superRefine`, since the requirement is conditional on two other fields
- Dietary fields: optional, max 500 characters

Declining supersedes everything downstream: when attendance is `"decline"`, the meal, plus-one, and dietary fields are neither required nor rendered, and any values already entered are cleared from the payload before submission. This keeps a guest who fills the form, then switches to decline, from submitting a meal choice they will not use.

The canvas rendered the plus-one fields but never required them, and left `handleDecline` as an empty stub with no effect on the rest of the form; this makes both behaviors explicit.

### Error and success handling

Field-level errors render beneath each control in `--destructive`. Submit shows a pending state via `useFormStatus`. On success the form is replaced by a confirmation panel — which is what the canvas's declared-but-unused `submitted: false` state was reaching for. Server failures surface a non-blocking inline alert; the entered data is preserved.

---

## Responsive behavior

The canvas has no media queries at all. Breakpoints added at Tailwind's `md` (768px):

| Element | Below `md` |
|---|---|
| Header nav | Collapses to a shadcn `Sheet` behind a menu trigger; logo and theme toggle stay inline |
| Hero grid | Stacks to one column; photo moves below the text block and takes a fixed aspect ratio |
| Quick-links grid | 3 columns to 1 column |
| Section padding | `64px` to `24px` |
| Hero name size | `72px` to fluid via `clamp()` |

Verification target: no horizontal body scroll at 400px on any route.

---

## Accessibility

Corrections to defects carried in the source artboards:

- Form labels associated by `id`/`htmlFor` (shadcn `FormField` handles this); the canvas had bare `<label>` elements adjacent to inputs
- Controls wrapped in a real `<form>`, restoring Enter-to-submit
- `--primary-foreground` set to a warm near-white instead of `#fff`. White on accent `#ac6284` measures about 3.0:1, below AA for the 12px uppercase button text. Approved as a deliberate, minimal deviation from pixel-exactness.
- Radio group and checkbox reachable and operable by keyboard, with a visible focus ring
- Hero image marked decorative, since the adjacent text carries all information
- Theme toggle carries an accessible name

---

## Known placeholders

1. **Hero photo** — remains the hotlinked Unsplash URL from the canvas, served through `next/image` with a `remotePatterns` entry. Replace with a real photograph.
2. **RSVP persistence** — a single `TODO(persistence)` in `app/rsvp/actions.ts`.
3. **WIP page content** — four stubs.

---

## Testing

| Scope | Method |
|---|---|
| `rsvp-schema.ts` | Vitest — valid payloads, missing required fields, conditional plus-one requirements, length bounds, meal-not-required-when-declining |
| `submitRsvp` action | Vitest — rejects payloads that fail server-side validation, returns the success shape on valid input |
| Types | `tsc --noEmit` |
| Build | `next build` |
| Visual and responsive | Manual check of both themes at desktop and 400px |

The schema holds the only non-trivial logic in the project — particularly the conditional plus-one rules — so it carries the test weight. Presentational components are verified by build and inspection rather than snapshot tests.

---

## Repository

`WeddingSite/` is currently untracked inside the `Documents/GitHub` parent repository. Consistent with the established pattern in this workspace — `entrysig` was extracted from the parent to a standalone repository — this project is initialized as its own git repository.

# Julie & Nick — Wedding Site

Next.js 16 + Tailwind v4 + shadcn/ui. Ported from a Claude Design canvas
export; see `docs/superpowers/specs/2026-09-12-wedding-site-nextjs-design.md`
for the design and `docs/superpowers/plans/2026-09-12-wedding-site-nextjs.md`
for the build plan.

## Commands

```bash
npm run dev        # development server
npm run build      # production build
npm test           # Vitest
npm run typecheck  # tsc --noEmit  (run `npm run build` first, see below)
```

`npm run typecheck` depends on the route types Next generates into
`.next/types`, so on a clean checkout run `npm run build` at least once
before it.

## Stack notes

This project is on **Next 16** and **shadcn v4 with the `base-nova` style,
which is built on Base UI, not Radix**. Two consequences worth knowing before
you add components:

- Component props follow Base UI (`onValueChange`, `onCheckedChange`), and
  `cn` is imported from the bare `cn` package, not `@/lib/utils`.
- `npx shadcn add form` is a no-op in this release, so
  `components/ui/form.tsx` is authored locally. It is the standard
  react-hook-form wiring; `FormControl` clones its child rather than using a
  Radix Slot.

`<html>` carries `data-scroll-behavior="smooth"` because Next 16 no longer
overrides a global `scroll-behavior: smooth` during route transitions.

## Theme

The Mulberry palette is expressed as shadcn's CSS-variable contract in
`app/globals.css` — light values on `:root`, dark on `.dark`. Dark is the
default and the OS preference is deliberately ignored, matching the canvas.

Two rules that are easy to break:

- **Zero border radius everywhere.** `--radius: 0rem`.
- **`--mulberry` is for rules, icon strokes and borders; `--mulberry-strong`
  is for accent-coloured text below 18px.** The plain accent measures 4.17:1
  on the dark background — fine for a hairline, under AA for the 11px
  eyebrows. `--mulberry-strong` measures 6.6:1.

Buttons fill with `#7b2e5e` in *both* modes (7.7:1 against white). The
lighter mauve `#ac6284` cannot carry white or black text at AA, so dark mode
inverts the source's resting/hover pair instead of abandoning it.

`tests/theme.test.ts` pins every token value in both modes and asserts the
two blocks declare identical key sets.

## Admin page

`/admin` shows every RSVP and every claimed gift. It is locked behind a single
shared secret in `ADMIN_SECRET` — copy `.env.example` to `.env.local` and set
one:

```bash
node -e "console.log(require('node:crypto').randomBytes(24).toString('base64url'))"
```

The secret is exchanged for an httpOnly session cookie; it never appears in a
URL, so it cannot leak through browser history, `Referer` headers, or access
logs. **If `ADMIN_SECRET` is unset or shorter than 16 characters the page locks
for everyone** — it fails closed, never open. Changing the secret signs out any
existing session.

The page is `noindex`, server-rendered per request, and reads the database only
after the check passes, so an unauthorized request never loads guest data.

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

# Zapeet — Marketing Landing Page

Insured checkout. Automated delivery. Marketing site for Zapeet, built for Lagos vendors.

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS v4. No backend — pure marketing site.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Push to GitHub, then import the repo in Vercel — Next.js is auto-detected, no config needed.

## Brand

Colors, type, and voice follow `zapeet_brand_guidelines.pdf` (v1.0, Aug 2026). Tokens live in `src/app/globals.css` under `@theme`:

| Token | Hex | Use |
|---|---|---|
| `ink` | `#1B1F3B` | primary |
| `marigold` | `#F2A93B` | accent / insured flow |
| `terracotta` | `#D85A30` | delivery flow |
| `paper` | `#F7F4EE` | background |
| `ink-60` | `#5C6079` | body text |

Typeface: Inter, loaded via `next/font/google` in `src/app/layout.tsx`.

## Structure

Each section of the page is its own component under `src/components/`:

- `site-header.tsx` — sticky nav
- `hero.tsx` — headline + sample payment-link card
- `problem-section.tsx` — "the old way" pain points
- `how-it-works.tsx` — Flow 1 (Insured) vs. Flow 2 (Pure Delivery)
- `who-for.tsx` — ICP cards + Lagos location pills
- `trust-section.tsx` — infrastructure trust strip
- `final-cta.tsx`
- `site-footer.tsx`
- `icons.tsx` — shared inline SVG icon set
- `logo.tsx` — Zapeet shield/bolt mark

`src/app/page.tsx` composes them in order.

## Known placeholders

Real contact details are not yet filled in — search the repo for `[YOUR` to find them (currently in `site-footer.tsx`):

- `[YOUR CONTACT EMAIL]`
- `[YOUR PHONE NUMBER]`
- `[YOUR COMPANY ADDRESS]`

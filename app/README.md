# Zapeet — Vendor App

Insured checkout. Automated delivery. The vendor-facing PWA — generate payment links, track orders, insurance, and delivery. This is what ships to the App Store / Play Store via Capacitor. No marketing content lives here; that's the separate `zapeet` (marketing) repo.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Supabase — Postgres, auth, storage (free tier, project `Zapeet` under the `probuenoafriltd` org)
- Felicity Partner API — payments (virtual accounts), insurance, delivery (test mode)
- Framer Motion for interaction/animation

## App shape

No marketing/landing content — the app opens straight to a logo splash, then routes to `/auth` (unauthenticated) or `/dashboard` (authenticated). Mobile-first throughout; this is the surface that gets wrapped with Capacitor for the native builds.

- `/` — splash screen, checks session, redirects
- `/auth` — email/password sign in + sign up (Supabase Auth)
- `/dashboard` — vendor home (placeholder for now — link generation, orders, and delivery status land next)

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the next available port).

Requires `.env.local` (not committed) with:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FELICITY_BASE_URL=
FELICITY_PARTNER_KEY=
FELICITY_WEBHOOK_SECRET=
```

## Supabase

The `supabase/` directory is linked to the live project. Useful commands (run with `SUPABASE_ACCESS_TOKEN` set, or `supabase login` in an interactive terminal):

```bash
npx supabase db push        # apply local migrations to the linked project
npx supabase functions deploy <name>
```

## Felicity

Test-mode partner key. Payments and delivery capabilities are enabled; **insurance capability needs to be turned on** in the Felicity partner dashboard before the Insured checkout flow can be built against it. See `Felicity Docs.pdf` for the full API reference (single endpoint, action-based POST body).

## Brand

Same tokens as the marketing site (`src/app/globals.css`, `@theme`): `ink` `#1B1F3B`, `marigold` `#F2A93B`, `terracotta` `#D85A30`, `paper` `#F7F4EE`, `ink-60` `#5C6079`. Inter via `next/font/google`.

## Deploy

Vercel, same as the marketing site. Set the environment variables above in the Vercel project settings (never commit `.env.local`).

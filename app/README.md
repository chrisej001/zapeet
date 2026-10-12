# Zapeet — Vendor App

Instant payouts. Automated delivery. The vendor-facing PWA — generate payment links, get paid straight to your own bank, and track delivery. This is what ships to the App Store / Play Store via Capacitor. No marketing content lives here; that's the separate `zapeet` (marketing) repo.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Supabase — Postgres, auth, storage (free tier, project `Zapeet` under the `probuenoafriltd` org)
- Felicity Partner API — one-time checkout accounts with instant split payouts, and same-day delivery
- Framer Motion for interaction/animation

## App shape

No marketing/landing content — the app opens straight to a logo splash, then routes to `/auth` (unauthenticated) or `/dashboard` (authenticated). Mobile-first throughout; this is the surface that gets wrapped with Capacitor for the native builds.

- `/` — splash screen, checks session, redirects
- `/auth` — email/password sign in + sign up (Supabase Auth); `/auth/forgot` → emailed link → `/auth/callback` → `/auth/reset`
- `/onboarding` — vendor adds their payout bank account (live name-enquiry), phone and pickup address. No KYC.
- `/dashboard` — payouts overview; `/dashboard/links` payment links; `/dashboard/profile` payout account + change password
- `/dashboard/admin` — admin-only: Zapeet fee account balance/withdrawals, vendors, orders, deliveries
- `/pay/[slug]` — public checkout

## Money flow

Each order is a Felicity `create_checkout` with `splits` (no vendor talent/VA): the customer pays item + delivery into a one-time account; on settlement Felicity pays the vendor's bank and Zapeet's fee account instantly and books the rider. Zapeet's fee is 2% of the item price, capped at ₦2,000 (`src/lib/fee.ts`) — taken from the vendor's payout by default, or added to the customer's total when the link's "Customer pays the Zapeet fee" toggle is on. The fee account is configured in `src/lib/zapeet-fee.ts`.

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

Needs the `payments` and `delivery` capabilities. See `Felicity Docs.pdf` (§6, split-payout checkout) for the API reference (single endpoint, action-based POST body).

## Brand

Same tokens as the marketing site (`src/app/globals.css`, `@theme`): `ink` `#1B1F3B`, `marigold` `#F2A93B`, `terracotta` `#D85A30`, `paper` `#F7F4EE`, `ink-60` `#5C6079`. Inter via `next/font/google`.

## Deploy

Vercel, same as the marketing site. Set the environment variables above in the Vercel project settings (never commit `.env.local`).

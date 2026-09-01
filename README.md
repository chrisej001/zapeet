# Zapeet

Insured checkout. Automated delivery.

Monorepo — each folder is its own Next.js app, deployed to Vercel independently (set that project's Root Directory to the matching folder).

- [`marketing/`](./marketing) — the public marketing site
- [`app/`](./app) — the vendor PWA (splash → auth → dashboard; no marketing content). This is what gets wrapped with Capacitor for the App Store / Play Store builds.

See each folder's own README for stack details, local dev, and environment variables.

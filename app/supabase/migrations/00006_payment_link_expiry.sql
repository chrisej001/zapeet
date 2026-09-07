-- Payment links previously stayed "active" forever until paid. Vendors
-- share these one-off, per-item links via WhatsApp — a real expiry (7 days,
-- business decision) keeps stale listings from being purchasable and lets
-- the dashboard show a meaningful "Expired" state instead of leaving old
-- links looking perpetually live.

alter table payment_links add column expires_at timestamptz;

update payment_links set expires_at = created_at + interval '7 days';

alter table payment_links
  alter column expires_at set not null,
  alter column expires_at set default (now() + interval '7 days');

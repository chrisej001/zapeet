-- Vendors need a pickup address/state for create_delivery — not collected
-- during initial KYC onboarding.

alter table vendors
  add column pickup_address text,
  add column pickup_state text;

-- Felicity's whiteLabelDelivery() now returns tracking_url (usefelicity
-- migration 20260910120000, deployed 2026-09-10) — persist it the same way
-- delivery_pin already is, so it can reach the customer and vendor.
alter table deliveries add column tracking_url text;

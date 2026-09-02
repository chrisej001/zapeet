-- Real architecture, using Felicity's create_checkout: a one-time
-- collection account per order that auto-splits on payment (vendor's
-- goods cut credited automatically, delivery booked, insurance bought)
-- with no BVN/NIN needed from the customer — only the vendor needs to
-- already be an onboarded talent.

alter table orders
  add column goods_amount_naira numeric(12, 2),
  add column insurance_amount_naira numeric(12, 2),
  add column delivery_amount_naira numeric(12, 2),
  add column total_amount_naira numeric(12, 2),
  add column felicity_checkout_account_number text,
  add column felicity_checkout_account_name text,
  add column felicity_checkout_bank_name text,
  add column felicity_checkout_expires_at timestamptz,
  add column felicity_delivery_reference text,
  add column felicity_policy_reference text,
  add column vendor_rebate_naira numeric(12, 2),
  add column settlement_error text;

-- order.id itself is used as Felicity's order_ref/checkout_reference —
-- no separate column needed to look one up by the other.

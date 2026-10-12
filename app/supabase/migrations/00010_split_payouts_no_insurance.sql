-- Business model change: no more insurance, no more per-vendor Felicity
-- virtual accounts or KYC. A vendor signs up and adds their own existing
-- bank account; each checkout uses Felicity's create_checkout `splits`
-- model to pay the vendor's bank directly and instantly, plus Zapeet's fee
-- (2% of the item price, capped at ₦2,000) to Zapeet's own Rubies account.
-- Every existing insured link/order/policy is test data — delete outright.

-- ---- Insurance: gone entirely ----
delete from payment_links where flow = 'insured';
drop table insurance_policies;

alter table payment_links
  drop column flow,
  drop column device_type,
  drop column device_make,
  drop column device_model,
  drop column device_imei,
  drop column device_serial_number,
  drop column device_color,
  drop column device_purchase_date,
  drop column device_image_url;

drop policy if exists "device photos are publicly readable" on storage.objects;
drop policy if exists "authenticated vendors can upload device photos" on storage.objects;

alter table orders
  drop column insurance_amount_naira,
  drop column customer_gender,
  drop column customer_date_of_birth,
  drop column felicity_policy_reference,
  drop column vendor_rebate_naira,
  drop column rebate_status,
  drop column rebate_payout_reference,
  drop column rebate_paid_at,
  drop column rebate_error;

-- ---- Vendor Felicity identities, KYC and the rebate treasury: gone ----
drop table vendor_felicity_accounts;
drop table treasury_account;

alter table vendors
  drop column first_name,
  drop column last_name,
  drop column date_of_birth,
  drop column bvn,
  drop column nin,
  drop column felicity_talent_ref,
  drop column felicity_account_number,
  drop column felicity_account_name,
  drop column felicity_bank_name,
  drop column felicity_kyc_status;

-- ---- Vendor's own payout bank account ----
-- account_name is whatever the bank's name-enquiry (resolve_account)
-- returned — it doesn't have to match the vendor's business name.
alter table vendors
  add column payout_bank_code text,
  add column payout_bank_name text,
  add column payout_account_number text,
  add column payout_account_name text;

-- Every vendor has to (re-)complete setup by adding a payout account.
update vendors set onboarded_at = null;

-- ---- Zapeet fee ----
-- Default: the vendor absorbs the fee (deducted from their payout). The
-- vendor can switch it on per link to pass the fee on to the customer.
alter table payment_links
  add column customer_pays_fee boolean not null default false;

-- Snapshot of exactly how each order's money was split, and to where —
-- the vendor can change their payout account later without rewriting
-- history for orders already placed.
alter table orders
  add column zapeet_fee_naira numeric(12, 2),
  add column vendor_payout_naira numeric(12, 2),
  add column customer_paid_fee boolean,
  add column payout_bank_name text,
  add column payout_account_number text,
  add column payout_account_name text,
  add column payout_status text not null default 'pending'
    check (payout_status in ('pending', 'paid', 'failed')),
  add column split_results jsonb;

-- Orders already paid under the old model were credited to the vendor's
-- Felicity balance — nothing outstanding for them.
update orders set payout_status = 'paid' where payment_status = 'paid';

-- "vendors update own row" let a vendor write *any* column of their row —
-- including is_admin, which now gates withdrawing from the fee account.
-- Restrict client-side updates to the columns the app actually edits.
revoke update on vendors from anon, authenticated;
grant update (
  business_name, phone, pickup_address, pickup_state,
  payout_bank_code, payout_bank_name, payout_account_number, payout_account_name,
  onboarded_at
) on vendors to authenticated;

-- chris.zapeet@gmail.com (Zapeet Technologies Ltd) owns the Rubies account
-- the fee is paid into — make it an admin alongside the existing one.
update vendors set is_admin = true where id = 'f94fb2c0-415d-4cd7-adc1-fd1b2b3d0d9b';

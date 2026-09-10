-- A vendor now needs both a test-mode and a live-mode Felicity identity
-- under the same login — previously each mode required a separate signup
-- (e.g. "Lumen Ventures" for test, "Zapeet Technologies Ltd" for live),
-- which is exactly the split the admin account needs to stop needing.
-- The app resolves which row to use per request by trying get_talent
-- against each ref — whichever the currently-deployed key's mode can
-- actually see is the right one (see src/lib/felicity/vendor-identity.ts).

create table vendor_felicity_accounts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors (id) on delete cascade,
  mode text not null check (mode in ('test', 'live')),
  felicity_talent_ref text not null,
  felicity_account_number text,
  felicity_account_name text,
  felicity_bank_name text,
  felicity_kyc_status text not null default 'pending'
    check (felicity_kyc_status in ('pending', 'verified', 'failed')),
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (vendor_id, mode)
);

create index vendor_felicity_accounts_vendor_id_idx on vendor_felicity_accounts (vendor_id);

alter table vendor_felicity_accounts enable row level security;

create policy "vendors read own felicity accounts" on vendor_felicity_accounts
  for select using (auth.uid () = vendor_id);

-- Backfill every vendor's existing (test-mode) identity so nothing already
-- working depends on this migration alone to keep functioning.
insert into vendor_felicity_accounts
  (vendor_id, mode, felicity_talent_ref, felicity_account_number, felicity_account_name,
   felicity_bank_name, felicity_kyc_status, onboarded_at)
select id, 'test', felicity_talent_ref, felicity_account_number, felicity_account_name,
   felicity_bank_name, felicity_kyc_status, onboarded_at
from vendors
where felicity_talent_ref is not null;

-- The admin account (Lumen Ventures / chris@myfirstresponseai.com) gets the
-- live identity that was onboarded under the separate "Zapeet Technologies
-- Ltd" login — reusing that already-verified Felicity talent rather than
-- onboarding a third one.
insert into vendor_felicity_accounts
  (vendor_id, mode, felicity_talent_ref, felicity_account_number, felicity_account_name,
   felicity_bank_name, felicity_kyc_status, onboarded_at)
values (
  '7f3689c9-41b5-4738-ba5b-af4b80798e66', 'live', 'f94fb2c0-415d-4cd7-adc1-fd1b2b3d0d9b',
  '8881741065', 'Christopher Emelife Jnr', 'Rubies MFB', 'verified', '2026-09-08T15:41:53.622+00:00'
);

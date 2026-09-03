-- Automated vendor rebate payouts: a single Zapeet-controlled Felicity
-- talent that gets funded manually (real bank transfer, outside this app)
-- and pays out the 2.5% insurance rebate to vendors automatically as
-- orders settle. Managed from an admin-only dashboard.

create table treasury_account (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text not null,
  date_of_birth date not null,
  bvn text not null,
  nin text not null,
  felicity_talent_ref text unique,
  felicity_account_number text,
  felicity_account_name text,
  felicity_bank_name text,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

alter table treasury_account enable row level security;
-- No policies: only the service role (admin actions) ever touches this.

alter table vendors add column is_admin boolean not null default false;

alter table orders
  add column rebate_status text not null default 'not_applicable'
    check (rebate_status in ('not_applicable', 'pending', 'paid', 'failed')),
  add column rebate_payout_reference text,
  add column rebate_paid_at timestamptz,
  add column rebate_error text;

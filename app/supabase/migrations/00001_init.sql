-- Zapeet initial schema
-- One Felicity virtual account per vendor ("talent" in Felicity's terms);
-- customers pay by bank transfer into that account, confirmed via webhook.

create table vendors (
  id uuid primary key references auth.users (id) on delete cascade,
  business_name text not null,
  first_name text,
  last_name text,
  phone text,
  date_of_birth date,
  bvn text,
  nin text,
  felicity_talent_ref text unique,
  felicity_account_number text,
  felicity_account_name text,
  felicity_bank_name text,
  felicity_kyc_status text not null default 'pending'
    check (felicity_kyc_status in ('pending', 'verified', 'failed')),
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

create table payment_links (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors (id) on delete cascade,
  slug text not null unique,
  flow text not null check (flow in ('insured', 'pure_delivery')),
  item_name text not null,
  amount_naira numeric(12, 2) not null check (amount_naira > 0),
  status text not null default 'active'
    check (status in ('active', 'paid', 'expired', 'cancelled')),
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  payment_link_id uuid not null references payment_links (id) on delete cascade,
  vendor_id uuid not null references vendors (id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  delivery_address text,
  delivery_state text,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed')),
  felicity_transaction_ref text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table insurance_policies (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  vendor_id uuid not null references vendors (id) on delete cascade,
  felicity_policy_reference text unique not null,
  felicity_policy_number text,
  product_id text,
  premium_naira numeric(12, 2),
  status text not null default 'pending',
  policy_document_url text,
  created_at timestamptz not null default now()
);

create table deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  vendor_id uuid not null references vendors (id) on delete cascade,
  felicity_delivery_reference text unique,
  status text not null default 'pending',
  fee_naira numeric(12, 2),
  driver_name text,
  driver_phone text,
  delivery_pin text,
  created_at timestamptz not null default now()
);

create table felicity_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create index payment_links_vendor_id_idx on payment_links (vendor_id);
create index orders_payment_link_id_idx on orders (payment_link_id);
create index orders_vendor_id_idx on orders (vendor_id);
create index insurance_policies_order_id_idx on insurance_policies (order_id);
create index deliveries_order_id_idx on deliveries (order_id);

-- Auto-create a vendor row when someone signs up, seeded from the
-- business_name they gave at sign-up (see app/src/app/auth/page.tsx).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.vendors (id, business_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'business_name', 'My business'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security: vendors only ever see their own data.
-- Public checkout pages (anonymous) never talk to the DB directly —
-- they go through server actions using the service role key instead.

alter table vendors enable row level security;
alter table payment_links enable row level security;
alter table orders enable row level security;
alter table insurance_policies enable row level security;
alter table deliveries enable row level security;
alter table felicity_webhook_events enable row level security;

create policy "vendors read own row" on vendors
  for select using (auth.uid () = id);

create policy "vendors update own row" on vendors
  for update using (auth.uid () = id);

create policy "vendors manage own links" on payment_links
  for all using (auth.uid () = vendor_id);

create policy "vendors read own orders" on orders
  for select using (auth.uid () = vendor_id);

create policy "vendors read own policies" on insurance_policies
  for select using (auth.uid () = vendor_id);

create policy "vendors read own deliveries" on deliveries
  for select using (auth.uid () = vendor_id);

-- felicity_webhook_events has no policies: only the service role (webhook
-- handler) ever touches it, which bypasses RLS entirely.

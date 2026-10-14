-- Demo mode: lets an account run the whole flow end to end — link,
-- checkout, "payment", delivery PIN, tracking page and emails — without
-- touching Felicity or moving money. Every record created while a vendor
-- is in demo mode is flagged is_demo and excluded from all admin views.

alter table vendors add column if not exists demo_mode boolean not null default false;
alter table payment_links add column if not exists is_demo boolean not null default false;
alter table orders add column if not exists is_demo boolean not null default false;
alter table deliveries add column if not exists is_demo boolean not null default false;

-- Links are inserted from the browser under the vendor's own session, so
-- is_demo can't be trusted from the client — derive it from the vendor's
-- current mode instead. demo_mode itself is deliberately not in the
-- column-level update grant: only an admin (service role) can flip it.
create or replace function set_payment_link_demo_flag() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.is_demo := coalesce((select demo_mode from vendors where id = new.vendor_id), false);
  return new;
end;
$$;

drop trigger if exists payment_links_demo_flag on payment_links;
create trigger payment_links_demo_flag
  before insert on payment_links
  for each row execute function set_payment_link_demo_flag();

create index if not exists payment_links_is_demo_idx on payment_links (is_demo);
create index if not exists orders_is_demo_idx on orders (is_demo);

-- chris.zapeet@gmail.com (Zapeet Technologies Ltd) is the demo account.
update vendors set demo_mode = true where id = 'f94fb2c0-415d-4cd7-adc1-fd1b2b3d0d9b';

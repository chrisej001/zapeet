-- Gadget Cover V2 (the real device-insurance product, confirmed live against
-- the sandbox catalog now that the insurance capability is enabled) needs
-- structured device details from the vendor and identity details from the
-- customer — neither of which we were collecting.

alter table payment_links
  add column device_type text check (device_type in ('Phone', 'Laptop', 'Tablet', 'POS')),
  add column device_make text,
  add column device_model text;

-- Replace the single free-text name with first/last — Felicity's gadget
-- product requires them separately, and it's what vendor onboarding
-- already does. Application code composes the full name where needed.
alter table orders
  add column customer_first_name text,
  add column customer_last_name text,
  add column customer_email text,
  add column customer_gender text check (customer_gender in ('Male', 'Female')),
  add column customer_date_of_birth date;

update orders set customer_first_name = split_part(customer_name, ' ', 1);
update orders
  set customer_last_name = substring(customer_name from length(split_part(customer_name, ' ', 1)) + 2)
  where customer_name like '% %';

alter table orders drop column customer_name;
alter table orders alter column customer_first_name set not null;
alter table orders alter column customer_last_name set not null;

-- Gadget Cover V2 accepts five optional fields beyond the required set
-- (confirmed against Felicity's real buildGadgetBuyBody source, not just the
-- catalog's required_fields list) — imei, serial_number, device_color,
-- device_purchase_date, image_url. The vendor captures these at link
-- creation time since they physically hold the device before shipping it,
-- not the customer.
alter table payment_links
  add column device_imei text,
  add column device_serial_number text,
  add column device_color text,
  add column device_purchase_date date,
  add column device_image_url text;

-- Device photos are uploaded directly from the vendor's browser to Supabase
-- Storage (not through a server action — phone camera photos can easily
-- exceed the request body limits a Next.js server action / Vercel function
-- would accept). Public bucket: image_url is submitted to Felicity/MyCover,
-- whose servers need to fetch it unauthenticated.
insert into storage.buckets (id, name, public)
values ('device-photos', 'device-photos', true)
on conflict (id) do nothing;

create policy "device photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'device-photos');

create policy "authenticated vendors can upload device photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'device-photos');


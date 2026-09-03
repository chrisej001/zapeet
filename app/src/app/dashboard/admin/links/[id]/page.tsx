import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage, fmtNaira, fmtDateTime, statusColor } from "../../require-admin-page";
import { DetailRow, ListRow } from "../../list-row";

export default async function AdminLinkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { admin } = await requireAdminPage();

  const { data: link } = await admin
    .from("payment_links")
    .select("*, vendors(id, business_name)")
    .eq("id", id)
    .single();
  if (!link) notFound();

  const { data: orders } = await admin
    .from("orders")
    .select("id, total_amount_naira, payment_status, created_at, customer_first_name, customer_last_name")
    .eq("payment_link_id", id)
    .order("created_at", { ascending: false });

  const vendor = link.vendors as unknown as { id: string; business_name: string } | null;

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/dashboard/admin/links" className="text-sm font-medium text-ink-60">
          ← Back
        </Link>
        <h1 className="mt-4 mb-6 text-xl">{link.item_name}</h1>

        <div className="mb-6 rounded-[16px] border border-ink/10 bg-white p-5">
          <DetailRow label="Price" value={fmtNaira(link.amount_naira)} />
          <DetailRow label="Flow" value={link.flow === "insured" ? "Insured" : "Pure delivery"} />
          <DetailRow label="Status" value={link.status} />
          {link.device_type && <DetailRow label="Device" value={`${link.device_make ?? ""} ${link.device_model ?? ""} (${link.device_type})`} />}
          <DetailRow label="Slug" value={`/pay/${link.slug}`} />
          <DetailRow label="Created" value={fmtDateTime(link.created_at)} />
          {vendor && (
            <>
              <div className="my-2 h-px bg-ink/10" />
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-ink-60">Vendor</span>
                <Link href={`/dashboard/admin/vendors/${vendor.id}`} className="font-semibold text-ink underline">
                  {vendor.business_name}
                </Link>
              </div>
            </>
          )}
        </div>

        <h2 className="mb-3 text-sm font-semibold text-ink">Orders ({orders?.length ?? 0})</h2>
        <div className="flex flex-col gap-3">
          {!orders?.length && (
            <div className="rounded-[14px] border border-ink/10 bg-white p-4 text-center text-xs text-ink-60">
              No orders yet.
            </div>
          )}
          {orders?.map((o) => (
            <ListRow
              key={o.id}
              href={`/dashboard/admin/orders/${o.id}`}
              title={`${o.customer_first_name ?? ""} ${o.customer_last_name ?? ""}`.trim() || "Customer"}
              subtitle={fmtDateTime(o.created_at)}
              status={o.payment_status}
              statusClass={statusColor(o.payment_status)}
              right={fmtNaira(o.total_amount_naira)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

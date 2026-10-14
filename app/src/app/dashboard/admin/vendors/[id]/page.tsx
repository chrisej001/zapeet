import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage, fmtNaira, fmtDateTime, statusColor } from "../../require-admin-page";
import { DetailRow, ListRow } from "../../list-row";
import { DemoModeCard } from "../../demo-mode-card";

export default async function AdminVendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { admin } = await requireAdminPage();

  const { data: vendor } = await admin.from("vendors").select("*").eq("id", id).single();
  if (!vendor) notFound();

  const { data: links } = await admin
    .from("payment_links")
    .select("id, item_name, amount_naira, customer_pays_fee, status, created_at")
    .eq("vendor_id", id)
    .eq("is_demo", false)
    .order("created_at", { ascending: false });

  const { count: demoLinkCount } = await admin
    .from("payment_links")
    .select("id", { count: "exact", head: true })
    .eq("vendor_id", id)
    .eq("is_demo", true);

  const { data: orders } = await admin
    .from("orders")
    .select("id, total_amount_naira, payment_status, created_at, customer_first_name, customer_last_name")
    .eq("vendor_id", id)
    .eq("is_demo", false)
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/dashboard/admin/vendors" className="text-sm font-medium text-ink-60">
          ← Back
        </Link>
        <h1 className="mt-4 mb-1 text-xl">{vendor.business_name}</h1>
        <p className="mb-4 h-4 text-xs font-semibold text-marigold-ink">
          {vendor.is_admin ? "Admin account" : ""}
        </p>

        <div className="mb-6 rounded-[16px] border border-ink/10 bg-white p-5">
          <DetailRow label="Phone" value={vendor.phone ?? "—"} />
          <DetailRow label="Pickup address" value={vendor.pickup_address ?? "—"} />
          <DetailRow label="Joined" value={fmtDateTime(vendor.created_at)} />
          <DetailRow label="Setup complete" value={vendor.onboarded_at ? fmtDateTime(vendor.onboarded_at) : "Not yet"} />
        </div>

        <h2 className="mb-3 text-sm font-semibold text-ink">Mode</h2>
        <DemoModeCard
          vendorId={vendor.id}
          businessName={vendor.business_name}
          demoMode={vendor.demo_mode}
          demoLinkCount={demoLinkCount ?? 0}
        />

        <h2 className="mb-3 text-sm font-semibold text-ink">Payout account</h2>
        <div className="mb-6 rounded-[16px] border border-ink/10 bg-white p-5">
          <DetailRow label="Bank" value={vendor.payout_bank_name ?? "—"} />
          <DetailRow label="Account number" value={vendor.payout_account_number ?? "—"} />
          <DetailRow label="Account name" value={vendor.payout_account_name ?? "—"} />
        </div>

        <h2 className="mb-3 text-sm font-semibold text-ink">Orders ({orders?.length ?? 0})</h2>
        <div className="mb-6 flex flex-col gap-3">
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

        <h2 className="mb-3 text-sm font-semibold text-ink">Payment links ({links?.length ?? 0})</h2>
        <div className="flex flex-col gap-3">
          {!links?.length && (
            <div className="rounded-[14px] border border-ink/10 bg-white p-4 text-center text-xs text-ink-60">
              No links yet.
            </div>
          )}
          {links?.map((l) => (
            <ListRow
              key={l.id}
              href={`/dashboard/admin/links/${l.id}`}
              title={l.item_name}
              subtitle={l.customer_pays_fee ? "Customer pays fee" : "Vendor pays fee"}
              status={l.status}
              statusClass={statusColor(l.status)}
              right={fmtNaira(l.amount_naira)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

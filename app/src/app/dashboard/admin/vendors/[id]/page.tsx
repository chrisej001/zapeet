import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage, fmtNaira, fmtDateTime, statusColor } from "../../require-admin-page";
import { DetailRow, ListRow } from "../../list-row";

function maskId(id: string | null | undefined) {
  if (!id) return "—";
  return `•••••••${id.slice(-4)}`;
}

export default async function AdminVendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { admin } = await requireAdminPage();

  const { data: vendor } = await admin.from("vendors").select("*").eq("id", id).single();
  if (!vendor) notFound();

  const { data: links } = await admin
    .from("payment_links")
    .select("id, item_name, amount_naira, flow, status, created_at")
    .eq("vendor_id", id)
    .order("created_at", { ascending: false });

  const { data: orders } = await admin
    .from("orders")
    .select("id, total_amount_naira, payment_status, created_at, customer_first_name, customer_last_name")
    .eq("vendor_id", id)
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
          <DetailRow label="Contact" value={`${vendor.first_name ?? ""} ${vendor.last_name ?? ""}`.trim() || "—"} />
          <DetailRow label="Phone" value={vendor.phone ?? "—"} />
          <DetailRow label="Date of birth" value={vendor.date_of_birth ?? "—"} />
          <DetailRow label="BVN" value={maskId(vendor.bvn)} />
          <DetailRow label="NIN" value={maskId(vendor.nin)} />
          <div className="my-2 h-px bg-ink/10" />
          <DetailRow label="KYC status" value={vendor.felicity_kyc_status} />
          <DetailRow label="Account number" value={vendor.felicity_account_number ?? "—"} />
          <DetailRow label="Bank" value={vendor.felicity_bank_name ?? "—"} />
          <DetailRow label="Pickup address" value={vendor.pickup_address ?? "—"} />
          <DetailRow label="Onboarded" value={fmtDateTime(vendor.onboarded_at)} />
          <DetailRow label="Joined" value={fmtDateTime(vendor.created_at)} />
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
              subtitle={l.flow === "insured" ? "Insured" : "Pure delivery"}
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

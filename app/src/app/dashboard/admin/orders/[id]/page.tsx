import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage, fmtNaira, fmtDateTime, statusColor } from "../../require-admin-page";
import { DetailRow } from "../../list-row";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { admin } = await requireAdminPage();

  const { data: order } = await admin
    .from("orders")
    .select("*, vendors(id, business_name), payment_links(item_name, slug, flow)")
    .eq("id", id)
    .single();
  if (!order) notFound();

  const { data: delivery } = await admin.from("deliveries").select("*").eq("order_id", id).maybeSingle();
  const { data: policy } = await admin.from("insurance_policies").select("*").eq("order_id", id).maybeSingle();

  const vendor = order.vendors as unknown as { id: string; business_name: string } | null;
  const link = order.payment_links as unknown as { item_name: string; slug: string; flow: string } | null;

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/dashboard/admin/orders" className="text-sm font-medium text-ink-60">
          ← Back
        </Link>
        <h1 className="mt-4 mb-1 text-xl">{link?.item_name ?? "Order"}</h1>
        <p className={`mb-6 text-xs font-semibold ${statusColor(order.payment_status)}`}>
          {order.payment_status} · {fmtDateTime(order.created_at)}
        </p>

        <h2 className="mb-3 text-sm font-semibold text-ink">Breakdown</h2>
        <div className="mb-6 rounded-[16px] border border-ink/10 bg-white p-5">
          <DetailRow label="Item" value={fmtNaira(order.goods_amount_naira)} />
          <DetailRow label="Insurance" value={fmtNaira(order.insurance_amount_naira)} />
          <DetailRow label="Delivery" value={fmtNaira(order.delivery_amount_naira)} />
          <div className="my-2 h-px bg-ink/10" />
          <DetailRow label="Total" value={fmtNaira(order.total_amount_naira)} />
          <div className="my-2 h-px bg-ink/10" />
          <DetailRow label="Vendor rebate (2.5%)" value={fmtNaira(order.vendor_rebate_naira)} />
          <DetailRow label="Rebate status" value={order.rebate_status ?? "—"} />
          {order.rebate_payout_reference && (
            <DetailRow label="Rebate ref" value={order.rebate_payout_reference} />
          )}
          {order.rebate_error && <p className="mt-2 text-xs text-terracotta">{order.rebate_error}</p>}
        </div>

        <h2 className="mb-3 text-sm font-semibold text-ink">Customer</h2>
        <div className="mb-6 rounded-[16px] border border-ink/10 bg-white p-5">
          <DetailRow
            label="Name"
            value={`${order.customer_first_name ?? ""} ${order.customer_last_name ?? ""}`.trim() || "—"}
          />
          <DetailRow label="Phone" value={order.customer_phone ?? "—"} />
          <DetailRow label="Email" value={order.customer_email ?? "—"} />
          <DetailRow label="Delivery address" value={order.delivery_address ?? "—"} />
          <DetailRow label="Delivery state" value={order.delivery_state ?? "—"} />
        </div>

        <h2 className="mb-3 text-sm font-semibold text-ink">Vendor</h2>
        <div className="mb-6 rounded-[16px] border border-ink/10 bg-white p-5">
          {vendor ? (
            <Link href={`/dashboard/admin/vendors/${vendor.id}`} className="text-sm font-semibold text-ink underline">
              {vendor.business_name}
            </Link>
          ) : (
            <p className="text-sm text-ink-60">—</p>
          )}
        </div>

        {link?.flow === "insured" && (
          <>
            <h2 className="mb-3 text-sm font-semibold text-ink">Insurance policy</h2>
            <div className="mb-6 rounded-[16px] border border-ink/10 bg-white p-5">
              {policy ? (
                <>
                  <DetailRow label="Policy number" value={policy.felicity_policy_number ?? "—"} />
                  <DetailRow label="Premium" value={fmtNaira(policy.premium_naira)} />
                  <DetailRow label="Status" value={policy.status} />
                  {policy.policy_document_url && (
                    <DetailRow label="Document" value="Available" />
                  )}
                </>
              ) : (
                <p className="text-sm text-ink-60">Not issued yet.</p>
              )}
            </div>
          </>
        )}

        <h2 className="mb-3 text-sm font-semibold text-ink">Delivery</h2>
        <div className="rounded-[16px] border border-ink/10 bg-white p-5">
          {delivery ? (
            <>
              <DetailRow label="Status" value={delivery.status} />
              <DetailRow label="Fee" value={fmtNaira(delivery.fee_naira)} />
              <DetailRow label="Driver" value={delivery.driver_name ?? "—"} />
              <DetailRow label="Driver phone" value={delivery.driver_phone ?? "—"} />
              <DetailRow label="Pickup PIN" value={delivery.delivery_pin ?? "—"} />
            </>
          ) : (
            <p className="text-sm text-ink-60">Not booked yet.</p>
          )}
        </div>

        {order.settlement_error && (
          <p className="mt-6 text-xs text-terracotta">Settlement error: {order.settlement_error}</p>
        )}
      </div>
    </div>
  );
}

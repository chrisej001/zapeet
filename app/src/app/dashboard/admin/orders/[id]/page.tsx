import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage, fmtNaira, fmtDateTime, statusColor } from "../../require-admin-page";
import { DetailRow } from "../../list-row";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { admin } = await requireAdminPage();

  const { data: order } = await admin
    .from("orders")
    .select(
      "*, vendors(id, business_name), payment_links(item_name, slug)",
    )
    .eq("id", id)
    .single();
  if (!order) notFound();

  const { data: delivery } = await admin.from("deliveries").select("*").eq("order_id", id).maybeSingle();

  const vendor = order.vendors as unknown as { id: string; business_name: string } | null;
  const link = order.payment_links as unknown as { item_name: string; slug: string } | null;
  const splitResults = (order.split_results ?? null) as
    | { account_number?: string; account_name?: string; status: string; amount_naira: number; error?: string | null }[]
    | null;

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
          <DetailRow label="Delivery" value={fmtNaira(order.delivery_amount_naira)} />
          <div className="my-2 h-px bg-ink/10" />
          <DetailRow label="Customer paid" value={fmtNaira(order.total_amount_naira)} />
          <div className="my-2 h-px bg-ink/10" />
          <DetailRow
            label={`Zapeet fee (${order.customer_paid_fee ? "customer" : "vendor"} paid)`}
            value={fmtNaira(order.zapeet_fee_naira)}
          />
          <DetailRow label="Vendor payout" value={fmtNaira(order.vendor_payout_naira)} />
          <DetailRow label="Payout status" value={order.payout_status ?? "—"} />
          <DetailRow
            label="Paid to"
            value={
              order.payout_account_number
                ? `${order.payout_bank_name} · ${order.payout_account_number}`
                : "—"
            }
          />
          {order.payout_account_name && <DetailRow label="Account name" value={order.payout_account_name} />}
        </div>

        {splitResults?.length ? (
          <>
            <h2 className="mb-3 text-sm font-semibold text-ink">Split transfers</h2>
            <div className="mb-6 flex flex-col gap-3">
              {splitResults.map((r, i) => (
                <div key={i} className="rounded-[14px] border border-ink/10 bg-white p-4">
                  <DetailRow label={r.account_name ?? r.account_number ?? `Split ${i + 1}`} value={fmtNaira(r.amount_naira)} />
                  <p className={`text-xs font-semibold ${statusColor(r.status === "success" ? "paid" : r.status)}`}>
                    {r.status}
                  </p>
                  {r.error && <p className="mt-1 text-xs text-terracotta">{r.error}</p>}
                </div>
              ))}
            </div>
          </>
        ) : null}

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

        <h2 className="mb-3 text-sm font-semibold text-ink">Delivery</h2>
        <div className="rounded-[16px] border border-ink/10 bg-white p-5">
          {delivery ? (
            <>
              <DetailRow label="Status" value={delivery.status} />
              <DetailRow label="Fee" value={fmtNaira(delivery.fee_naira)} />
              <DetailRow label="Driver" value={delivery.driver_name ?? "—"} />
              <DetailRow label="Driver phone" value={delivery.driver_phone ?? "—"} />
              <DetailRow label="Pickup PIN" value={delivery.delivery_pin ?? "—"} />
              <DetailRow label="Tracking URL" value={delivery.tracking_url ?? "—"} />
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

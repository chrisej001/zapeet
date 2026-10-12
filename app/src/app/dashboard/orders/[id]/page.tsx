import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DetailRow } from "../../admin/list-row";
import { BottomNav } from "../../bottom-nav";

function fmtNaira(amount: number | string | null | undefined) {
  if (amount == null) return "—";
  return `₦${Number(amount).toLocaleString("en-NG")}`;
}

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

// Vendor-facing counterpart to /dashboard/admin/orders/[id] — vendors can't
// reach the admin dashboard, so this is the only place they can see their
// own order's delivery PIN and tracking link (also emailed, see
// api/felicity/webhook/route.ts).
export default async function VendorOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: order } = await supabase
    .from("orders")
    .select("*, payment_links(item_name)")
    .eq("id", id)
    .eq("vendor_id", user.id)
    .single();
  if (!order) notFound();

  const { data: delivery } = await supabase.from("deliveries").select("*").eq("order_id", id).maybeSingle();

  const link = order.payment_links as unknown as { item_name: string } | null;

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8 pb-28">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/dashboard/links" className="text-sm font-medium text-ink-60">
          ← Back
        </Link>
        <h1 className="mt-4 mb-1 text-xl">{link?.item_name ?? "Order"}</h1>
        <p className="mb-6 text-xs font-semibold text-ink-60">
          {order.payment_status} · {fmtDateTime(order.created_at)}
        </p>

        <h2 className="mb-3 text-sm font-semibold text-ink">Customer</h2>
        <div className="mb-6 rounded-[16px] border border-ink/10 bg-white p-5">
          <DetailRow
            label="Name"
            value={`${order.customer_first_name ?? ""} ${order.customer_last_name ?? ""}`.trim() || "—"}
          />
          <DetailRow label="Phone" value={order.customer_phone ?? "—"} />
          <DetailRow label="Delivery address" value={order.delivery_address ?? "—"} />
        </div>

        <h2 className="mb-3 text-sm font-semibold text-ink">Breakdown</h2>
        <div className="mb-6 rounded-[16px] border border-ink/10 bg-white p-5">
          <DetailRow label="Item" value={fmtNaira(order.goods_amount_naira)} />
          {order.customer_paid_fee && <DetailRow label="Service fee" value={fmtNaira(order.zapeet_fee_naira)} />}
          <DetailRow label="Delivery" value={fmtNaira(order.delivery_amount_naira)} />
          <div className="my-2 h-px bg-ink/10" />
          <DetailRow label="Customer paid" value={fmtNaira(order.total_amount_naira)} />
        </div>

        <h2 className="mb-3 text-sm font-semibold text-ink">Your payout</h2>
        <div className="mb-6 rounded-[16px] border border-ink/10 bg-white p-5">
          {order.zapeet_fee_naira != null && !order.customer_paid_fee && (
            <DetailRow label="Zapeet fee" value={`−${fmtNaira(order.zapeet_fee_naira)}`} />
          )}
          <DetailRow label="You receive" value={fmtNaira(order.vendor_payout_naira ?? order.goods_amount_naira)} />
          <DetailRow
            label="Status"
            value={
              order.payment_status !== "paid"
                ? "Awaiting customer payment"
                : order.payout_status === "paid"
                  ? "Sent"
                  : order.payout_status === "failed"
                    ? "Failed — Zapeet is resolving it"
                    : "Processing"
            }
          />
          {order.payout_account_number && (
            <DetailRow label="Paid to" value={`${order.payout_bank_name} · ${order.payout_account_number}`} />
          )}
        </div>

        <h2 className="mb-3 text-sm font-semibold text-ink">Delivery</h2>
        <div className="rounded-[16px] border border-ink/10 bg-white p-5">
          {delivery ? (
            <>
              <DetailRow label="Status" value={delivery.status} />
              <DetailRow label="Driver" value={delivery.driver_name ?? "—"} />
              <DetailRow label="Driver phone" value={delivery.driver_phone ?? "—"} />
              <DetailRow label="Pickup PIN" value={delivery.delivery_pin ?? "—"} />
              {delivery.tracking_url && (
                <a
                  href={delivery.tracking_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block w-full rounded-[10px] bg-ink py-3 text-center text-sm font-semibold text-paper"
                >
                  Track delivery
                </a>
              )}
            </>
          ) : (
            <p className="text-sm text-ink-60">Not booked yet.</p>
          )}
        </div>

        {order.settlement_error && (
          <p className="mt-6 text-xs text-terracotta">Settlement error: {order.settlement_error}</p>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

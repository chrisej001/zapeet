import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDeliveryEmail, sendVendorDeliveryEmail, sendVendorPayoutEmail } from "@/lib/resend";

/** Flat delivery quote used for demo checkouts — no Felicity quote is fetched. */
export const DEMO_DELIVERY_NAIRA = 2000;

/** Deliberately not a real bank, so nobody can send real money to a demo
 * checkout even if a demo link escapes into the wild. */
export const DEMO_BANK_NAME = "Zapeet Demo Bank";

export function demoAccountNumber() {
  return `90${Math.floor(10_000_000 + Math.random() * 90_000_000)}`;
}

// Names only — a made-up phone number could belong to a real stranger.
const DEMO_RIDERS = ["Tunde Bakare", "Ifeanyi Okafor", "Musa Abdullahi"];

/** Mirrors exactly what the Felicity webhook does when a real transfer
 * lands (see api/felicity/webhook/route.ts settleOrder + recordDelivery):
 * order paid, payout marked sent, link flipped to paid, delivery booked
 * with a PIN and tracking link, and the same three emails — but every
 * value is generated locally and nothing touches Felicity or real money. */
export async function settleDemoOrder(orderId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select(
      "id, vendor_id, payment_link_id, customer_email, customer_first_name, vendor_payout_naira, zapeet_fee_naira, payout_account_number, payout_account_name, payout_bank_name, delivery_amount_naira, payment_links(item_name)",
    )
    .eq("id", orderId)
    .eq("is_demo", true)
    .single();
  if (!order) return { ok: false, error: "Demo order not found." };

  const deliveryReference = `demo_${crypto.randomUUID()}`;
  const splitResults = [
    {
      account_number: order.payout_account_number,
      account_name: order.payout_account_name,
      amount_naira: Number(order.vendor_payout_naira ?? 0),
      status: "success",
    },
    { account_number: "demo-fee-account", amount_naira: Number(order.zapeet_fee_naira ?? 0), status: "success" },
  ];

  // Same idempotency guard as the webhook: only a still-pending order settles.
  const { data: updated } = await admin
    .from("orders")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      felicity_delivery_reference: deliveryReference,
      payout_status: "paid",
      split_results: splitResults,
    })
    .eq("id", orderId)
    .eq("payment_status", "pending")
    .select("id")
    .single();
  if (!updated) return { ok: true };

  await admin.from("payment_links").update({ status: "paid" }).eq("id", order.payment_link_id);

  const itemName = (order.payment_links as unknown as { item_name: string } | null)?.item_name ?? "an order";
  const rider = DEMO_RIDERS[Math.floor(Math.random() * DEMO_RIDERS.length)];
  const deliveryPin = String(Math.floor(1000 + Math.random() * 9000));
  const deliveryId = crypto.randomUUID();
  const trackingUrl = `${await appOrigin()}/track/${deliveryId}`;

  await admin.from("deliveries").insert({
    id: deliveryId,
    order_id: order.id,
    vendor_id: order.vendor_id,
    felicity_delivery_reference: deliveryReference,
    status: "assigned",
    fee_naira: order.delivery_amount_naira,
    driver_name: rider,
    driver_phone: null,
    delivery_pin: deliveryPin,
    tracking_url: trackingUrl,
    is_demo: true,
  });

  let vendorEmail: string | undefined;
  try {
    const { data: vendorAuth } = await admin.auth.admin.getUserById(order.vendor_id);
    vendorEmail = vendorAuth?.user?.email;
  } catch (err) {
    console.error("demo vendor lookup failed", orderId, err);
  }

  const emails: Promise<unknown>[] = [];
  if (vendorEmail) {
    emails.push(
      sendVendorPayoutEmail({
        to: vendorEmail,
        itemName,
        payoutNaira: Number(order.vendor_payout_naira ?? 0),
        bankName: order.payout_bank_name ?? "your bank",
        accountNumber: order.payout_account_number ?? "",
      }),
      sendVendorDeliveryEmail({
        to: vendorEmail,
        itemName,
        customerName: order.customer_first_name ?? "Customer",
        deliveryPin,
        trackingUrl,
      }),
    );
  }
  if (order.customer_email) {
    emails.push(
      sendDeliveryEmail({
        to: order.customer_email,
        firstName: order.customer_first_name ?? "there",
        itemName,
        deliveryPin,
        trackingUrl,
      }),
    );
  }
  for (const result of await Promise.allSettled(emails)) {
    if (result.status === "rejected") console.error("demo email failed", orderId, result.reason);
  }

  return { ok: true };
}

async function appOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "app.zapeet.app";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyFelicitySignature } from "@/lib/felicity/webhook";
import { getCheckout, getDelivery, type SplitResult } from "@/lib/felicity/client";
import { sendDeliveryEmail, sendVendorDeliveryEmail, sendVendorPayoutEmail } from "@/lib/resend";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = Record<string, any>;

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-felicity-signature");

  if (!verifyFelicitySignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: Json;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Confirmed against real deliveries: the body is flat event data with no
  // event/type field at all — the event name comes from the
  // x-felicity-event header instead.
  const eventType = req.headers.get("x-felicity-event") ?? undefined;
  const data: Json = payload;

  await admin.from("felicity_webhook_events").insert({
    event_type: eventType ?? "unknown",
    payload,
  });

  try {
    switch (eventType) {
      case "talent.checkout_completed":
        await handleCheckoutCompleted(admin, data);
        break;
      case "talent.checkout_fulfillment_failed":
        await handleCheckoutFulfillmentFailed(admin, data);
        break;
      case "talent.delivery_status_updated":
      case "talent.delivery_completed":
      case "talent.delivery_failed":
        await handleDeliveryEvent(admin, data);
        break;
      default:
        // Includes talent.delivery_created / talent.va_credited (the fee
        // account receiving its split) / etc. — informational only, no
        // order-linking field, nothing to act on directly (the checkout
        // events are what actually drive our state). Already logged above.
        break;
    }
  } catch (err) {
    // We've durably logged the raw event; don't make Felicity retry
    // redelivery over a failure in our own downstream processing.
    console.error("felicity webhook handling error", eventType, err);
  }

  return NextResponse.json({ received: true });
}

// admin client's exact type isn't worth importing here; keep this loose
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;

/** Every requested leg succeeded: both splits paid out (vendor + Zapeet
 * fee) and the delivery was booked. */
async function handleCheckoutCompleted(admin: Admin, data: Json) {
  await settleOrder(admin, data, null);
}

/** The customer paid, but something after that failed. Per Felicity's
 * contract: nothing already paid out is reversed, nothing is retried, and
 * the delivery is skipped entirely if any split failed — so this needs
 * manual follow-up from the admin dashboard either way. */
async function handleCheckoutFulfillmentFailed(admin: Admin, data: Json) {
  await settleOrder(
    admin,
    data,
    data.error ?? data.settlement_error ?? "Payout or delivery failed after payment.",
  );
}

async function settleOrder(admin: Admin, data: Json, failure: string | null) {
  // order.id doubles as Felicity's order_ref/checkout_reference.
  const orderId: string | undefined = data.checkout_reference;
  if (!orderId) return;

  const { data: order } = await admin
    .from("orders")
    .select(
      "id, vendor_id, payment_link_id, customer_email, customer_first_name, vendor_payout_naira, payout_account_number, payout_bank_name, payment_links(item_name)",
    )
    .eq("id", orderId)
    .single();
  if (!order) return;

  // split_results is on the event per the docs, but get_checkout is the
  // authoritative record — fall back to it if the event didn't carry them.
  let splitResults: SplitResult[] | null = Array.isArray(data.split_results) ? data.split_results : null;
  let settlementError: string | null = failure;
  if (!splitResults) {
    try {
      const { checkout } = await getCheckout(orderId);
      splitResults = checkout.split_results ?? null;
      settlementError = settlementError ?? checkout.settlement_error;
    } catch (err) {
      console.error("get_checkout failed while settling", orderId, err);
    }
  }

  const vendorSplit = splitResults?.find((r) => r.account_number === order.payout_account_number);
  const payoutStatus = vendorSplit
    ? vendorSplit.status === "success"
      ? "paid"
      : "failed"
    : failure
      ? "failed"
      : "paid"; // checkout_completed only fires when every leg succeeded

  const deliveryReference: string | null = data.delivery_reference ?? null;

  // Idempotent: only proceeds if still pending, so a duplicate/retried
  // webhook delivery is a no-op the second time through.
  const { data: updated } = await admin
    .from("orders")
    .update({
      payment_status: "paid", // the customer's money arrived either way
      paid_at: new Date().toISOString(),
      felicity_delivery_reference: deliveryReference,
      payout_status: payoutStatus,
      split_results: splitResults,
      settlement_error: settlementError,
    })
    .eq("id", orderId)
    .eq("payment_status", "pending")
    .select("id")
    .single();

  if (!updated) return; // already processed by an earlier delivery of this event

  // Flip the link too, on both paths — a paid order whose link still showed
  // "Awaiting payment" was a real bug found on a live order.
  await admin.from("payment_links").update({ status: "paid" }).eq("id", order.payment_link_id);

  const itemName = (order.payment_links as { item_name: string } | null)?.item_name ?? "an order";

  let vendorEmail: string | undefined;
  try {
    const { data: vendorAuth } = await admin.auth.admin.getUserById(order.vendor_id);
    vendorEmail = vendorAuth?.user?.email;
  } catch (err) {
    console.error("vendor lookup failed", orderId, err);
  }

  if (vendorEmail && payoutStatus === "paid") {
    try {
      await sendVendorPayoutEmail({
        to: vendorEmail,
        itemName,
        payoutNaira: Number(order.vendor_payout_naira ?? vendorSplit?.amount_naira ?? 0),
        bankName: order.payout_bank_name ?? "your bank",
        accountNumber: order.payout_account_number ?? "",
      });
    } catch (err) {
      console.error("payout email (vendor) failed", orderId, err);
    }
  }

  if (deliveryReference) {
    await recordDelivery(admin, order, itemName, deliveryReference, vendorEmail);
  }
}

async function recordDelivery(
  admin: Admin,
  order: { id: string; vendor_id: string; customer_email: string | null; customer_first_name: string | null },
  itemName: string,
  deliveryReference: string,
  vendorEmail: string | undefined,
) {
  try {
    const { delivery } = await getDelivery(deliveryReference);
    await admin.from("deliveries").insert({
      order_id: order.id,
      vendor_id: order.vendor_id,
      felicity_delivery_reference: delivery.delivery_reference,
      status: delivery.status,
      fee_naira: delivery.fee_naira,
      driver_name: delivery.driver_name,
      driver_phone: delivery.driver_phone,
      delivery_pin: delivery.delivery_pin,
      tracking_url: delivery.tracking_url,
    });

    if (order.customer_email) {
      try {
        await sendDeliveryEmail({
          to: order.customer_email,
          firstName: order.customer_first_name ?? "there",
          itemName,
          deliveryPin: delivery.delivery_pin,
          trackingUrl: delivery.tracking_url,
        });
      } catch (err) {
        console.error("delivery email (customer) failed", order.id, err);
      }
    }

    if (vendorEmail) {
      try {
        await sendVendorDeliveryEmail({
          to: vendorEmail,
          itemName,
          customerName: order.customer_first_name ?? "Customer",
          deliveryPin: delivery.delivery_pin,
          trackingUrl: delivery.tracking_url,
        });
      } catch (err) {
        console.error("delivery email (vendor) failed", order.id, err);
      }
    }
  } catch (err) {
    console.error("get_delivery failed after checkout settled", order.id, err);
  }
}

async function handleDeliveryEvent(admin: Admin, data: Json) {
  const deliveryReference: string | undefined = data.delivery_reference;
  if (!deliveryReference) return;

  await admin
    .from("deliveries")
    .update({
      status: data.status ?? "unknown",
      driver_name: data.driver_name ?? null,
      driver_phone: data.driver_phone ?? null,
      tracking_url: data.tracking_url ?? null,
    })
    .eq("felicity_delivery_reference", deliveryReference);
}

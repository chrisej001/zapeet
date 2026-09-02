import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyFelicitySignature } from "@/lib/felicity/webhook";
import { getDelivery, getPolicy } from "@/lib/felicity/client";

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
      case "talent.policy_issued":
      case "talent.policy_failed":
        await handlePolicyEvent(admin, data, eventType);
        break;
      case "talent.delivery_status_updated":
      case "talent.delivery_completed":
      case "talent.delivery_failed":
        await handleDeliveryEvent(admin, data);
        break;
      default:
        // Includes talent.delivery_created / talent.va_credited / etc. —
        // informational only, no order-linking field, nothing to act on
        // directly (checkout_completed is what actually drives our state).
        // Already logged above.
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
async function handleCheckoutCompleted(admin: any, data: Json) {
  // order.id doubles as Felicity's order_ref/checkout_reference.
  const orderId: string | undefined = data.checkout_reference;
  const deliveryReference: string | null = data.delivery_reference ?? null;
  const policyReference: string | null = data.policy_reference ?? null;
  const vendorAmountNaira: number | undefined = data.vendor_amount_naira;

  if (!orderId) return;

  const { data: order } = await admin
    .from("orders")
    .select("id, vendor_id, payment_link_id, insurance_amount_naira, payment_links(flow)")
    .eq("id", orderId)
    .single();
  if (!order) return;

  const rebateNaira =
    order.payment_links?.flow === "insured" && order.insurance_amount_naira
      ? Number(order.insurance_amount_naira) * 0.025
      : 0;

  // Idempotent: only proceeds if still pending, so a duplicate/retried
  // webhook delivery is a no-op the second time through.
  const { data: updated } = await admin
    .from("orders")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      felicity_delivery_reference: deliveryReference,
      felicity_policy_reference: policyReference,
      vendor_rebate_naira: rebateNaira,
      settlement_error: data.error ?? null,
    })
    .eq("id", orderId)
    .eq("payment_status", "pending")
    .select("id")
    .single();

  if (!updated) return; // already processed by an earlier delivery of this event

  await admin.from("payment_links").update({ status: "paid" }).eq("id", order.payment_link_id);

  if (deliveryReference) {
    try {
      const { delivery } = await getDelivery(deliveryReference);
      await admin.from("deliveries").insert({
        order_id: orderId,
        vendor_id: order.vendor_id,
        felicity_delivery_reference: delivery.delivery_reference,
        status: delivery.status,
        fee_naira: delivery.fee_naira,
        driver_name: delivery.driver_name,
        driver_phone: delivery.driver_phone,
        delivery_pin: delivery.delivery_pin,
      });
    } catch (err) {
      console.error("get_delivery failed after checkout_completed", orderId, err);
    }
  }

  if (policyReference) {
    try {
      const { policy } = await getPolicy(policyReference);
      await admin.from("insurance_policies").insert({
        order_id: orderId,
        vendor_id: order.vendor_id,
        felicity_policy_reference: policy.policy_reference,
        felicity_policy_number: policy.policy_number,
        product_id: policy.product_id,
        premium_naira: policy.premium_naira,
        status: policy.status,
        policy_document_url: policy.policy_document_url,
      });
    } catch (err) {
      console.error("get_policy failed after checkout_completed", orderId, err);
    }
  }

  void vendorAmountNaira; // credited automatically by Felicity — nothing for us to do
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCheckoutFulfillmentFailed(admin: any, data: Json) {
  const orderId: string | undefined = data.checkout_reference;
  if (!orderId) return;

  await admin
    .from("orders")
    .update({
      payment_status: "paid", // vendor was still paid per Felicity's guarantee
      paid_at: new Date().toISOString(),
      felicity_delivery_reference: data.delivery_reference ?? null,
      felicity_policy_reference: data.policy_reference ?? null,
      settlement_error: data.error ?? data.settlement_error ?? "Delivery or insurance failed after payment.",
    })
    .eq("id", orderId)
    .eq("payment_status", "pending");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePolicyEvent(admin: any, data: Json, eventType: string) {
  const policyReference: string | undefined = data.policy_reference;
  if (!policyReference) return;

  await admin
    .from("insurance_policies")
    .update({
      status: eventType === "talent.policy_failed" ? "failed" : (data.status ?? "active"),
      policy_document_url: data.policy_document_url ?? null,
      felicity_policy_number: data.policy_number ?? null,
    })
    .eq("felicity_policy_reference", policyReference);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleDeliveryEvent(admin: any, data: Json) {
  const deliveryReference: string | undefined = data.delivery_reference;
  if (!deliveryReference) return;

  await admin
    .from("deliveries")
    .update({
      status: data.status ?? "unknown",
      driver_name: data.driver_name ?? null,
      driver_phone: data.driver_phone ?? null,
    })
    .eq("felicity_delivery_reference", deliveryReference);
}

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyFelicitySignature } from "@/lib/felicity/webhook";
import {
  getDelivery,
  getPolicy,
  send,
  resolveAccount,
  RUBIES_MFB_BANK_CODE,
  FelicityError,
} from "@/lib/felicity/client";
import { sendPolicyEmail } from "@/lib/resend";
import { resolveVendorFelicityAccount } from "@/lib/felicity/vendor-identity";

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
    .select(
      "id, vendor_id, payment_link_id, insurance_amount_naira, customer_email, customer_first_name, payment_links(flow, item_name)",
    )
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

      // Email the policy document right here, not from the policy_issued
      // webhook — confirmed live 2026-09-07 that policy_issued consistently
      // arrives BEFORE checkout_completed, so the insurance_policies row
      // this handler just inserted doesn't exist yet when that earlier
      // event is processed. This path has guaranteed order/customer context
      // and the freshly-fetched policy in hand, so it's the reliable place.
      if (policy.policy_document_url && order.customer_email) {
        const itemName =
          (order.payment_links as unknown as { item_name: string } | null)?.item_name ?? "your device";
        try {
          await sendPolicyEmail({
            to: order.customer_email,
            firstName: order.customer_first_name ?? "there",
            itemName,
            policyNumber: policy.policy_number,
            premiumNaira: Number(policy.premium_naira ?? 0),
            documentUrl: policy.policy_document_url,
          });
        } catch (err) {
          console.error("policy email failed", policyReference, err);
        }
      }
    } catch (err) {
      console.error("get_policy failed after checkout_completed", orderId, err);
    }
  }

  void vendorAmountNaira; // credited automatically by Felicity — nothing for us to do

  if (rebateNaira > 0) {
    await payVendorRebate(admin, orderId, order.vendor_id, rebateNaira);
  }
}

/** Pays the 2.5% insurance rebate out of Zapeet's own treasury balance —
 * Felicity's auto-split only credits the vendor's goods amount, never a
 * rebate, so this is money Zapeet funds itself. Treasury reuses the admin
 * vendor's own already-verified Felicity identity rather than a separate
 * onboarding, so it's resolved the same mode-aware way as any vendor —
 * whichever of the admin's test/live accounts the current key can actually
 * see. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function payVendorRebate(admin: any, orderId: string, vendorId: string, rebateNaira: number) {
  const { data: adminVendor } = await admin.from("vendors").select("id").eq("is_admin", true).limit(1).maybeSingle();
  const treasuryAccount = adminVendor ? await resolveVendorFelicityAccount(admin, adminVendor.id) : null;
  const vendorAccount = await resolveVendorFelicityAccount(admin, vendorId);

  if (!treasuryAccount || !vendorAccount?.felicity_account_number) {
    await admin
      .from("orders")
      .update({ rebate_status: "failed", rebate_error: "Treasury account or vendor payout details missing." })
      .eq("id", orderId);
    return;
  }

  await admin.from("orders").update({ rebate_status: "pending" }).eq("id", orderId);

  // Every Felicity-issued VA lives at Rubies MFB, so there's no bank to pick
  // here — but resolve the vendor's account the same way the vendor-facing
  // send-money flow does, so a stale/renamed felicity_account_name never
  // gets used blindly and a bad account is caught with a clear reason
  // instead of an opaque transfer failure.
  let accountName: string;
  try {
    const { account } = await resolveAccount(vendorAccount.felicity_account_number, RUBIES_MFB_BANK_CODE);
    accountName = account.account_name;
  } catch (err) {
    const message = err instanceof FelicityError ? err.message : "Could not verify vendor account.";
    console.error("vendor rebate account resolve failed", orderId, err);
    await admin.from("orders").update({ rebate_status: "failed", rebate_error: message }).eq("id", orderId);
    return;
  }

  try {
    const result = await send({
      talent_ref: treasuryAccount.felicity_talent_ref,
      amount_naira: rebateNaira,
      account_number: vendorAccount.felicity_account_number,
      bank_code: RUBIES_MFB_BANK_CODE,
      account_name: accountName,
    });

    await admin
      .from("orders")
      .update({
        rebate_status: "paid",
        rebate_payout_reference: result.reference,
        rebate_paid_at: new Date().toISOString(),
      })
      .eq("id", orderId);
  } catch (err) {
    const message = err instanceof FelicityError ? err.message : "Rebate transfer failed.";
    console.error("vendor rebate send failed", orderId, err);
    await admin.from("orders").update({ rebate_status: "failed", rebate_error: message }).eq("id", orderId);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCheckoutFulfillmentFailed(admin: any, data: Json) {
  const orderId: string | undefined = data.checkout_reference;
  if (!orderId) return;

  // Idempotent, same as handleCheckoutCompleted — and critically, also
  // flips payment_links.status like that handler does. This path was
  // missing that update entirely: a real order (goods paid, e.g. delivery
  // failed after) left its link stuck showing "Awaiting payment" forever
  // even though the money had already moved. Found via a real live order.
  const { data: updated } = await admin
    .from("orders")
    .update({
      payment_status: "paid", // vendor was still paid per Felicity's guarantee
      paid_at: new Date().toISOString(),
      felicity_delivery_reference: data.delivery_reference ?? null,
      felicity_policy_reference: data.policy_reference ?? null,
      settlement_error: data.error ?? data.settlement_error ?? "Delivery or insurance failed after payment.",
    })
    .eq("id", orderId)
    .eq("payment_status", "pending")
    .select("payment_link_id")
    .single();

  if (!updated) return;

  await admin.from("payment_links").update({ status: "paid" }).eq("id", updated.payment_link_id);
}

// Pure status sync — the policy email itself is sent from
// handleCheckoutCompleted, which has guaranteed order/customer context and
// runs after this event in practice (talent.policy_issued consistently
// arrives before talent.checkout_completed, before this row even exists —
// confirmed live 2026-09-07 via a diagnostic that's since been removed).
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

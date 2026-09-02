import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyFelicitySignature } from "@/lib/felicity/webhook";
import {
  buyInsurance,
  createDelivery,
  findGadgetCoverProduct,
  getDeliveryQuote,
  toInternationalPhone,
} from "@/lib/felicity/client";

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

  // Event envelope shape isn't fully documented — hedge across the likely
  // field names rather than assume one.
  const eventType: string | undefined = payload.event ?? payload.type ?? payload.event_type;
  const data: Json = payload.data ?? payload;

  await admin.from("felicity_webhook_events").insert({
    event_type: eventType ?? "unknown",
    payload,
  });

  try {
    switch (eventType) {
      case "talent.va_credited":
        await handleVaCredited(admin, data);
        break;
      case "talent.policy_issued":
      case "talent.policy_failed":
        await handlePolicyEvent(admin, data, eventType);
        break;
      case "talent.delivery_created":
      case "talent.delivery_status_updated":
      case "talent.delivery_completed":
      case "talent.delivery_failed":
        await handleDeliveryEvent(admin, data);
        break;
      default:
        // Unrecognized or not-yet-handled event — already logged above.
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
async function handleVaCredited(admin: any, data: Json) {
  const talentRef: string | undefined = data.talent_ref ?? data.talent?.talent_ref;
  const amountNaira: number | undefined =
    data.amount_naira ?? (typeof data.amount_kobo === "number" ? data.amount_kobo / 100 : undefined);
  const reference: string | null = data.reference ?? data.transaction_reference ?? data.id ?? null;

  if (!talentRef || amountNaira == null) return;

  const { data: vendor } = await admin
    .from("vendors")
    .select("id, business_name, phone, pickup_address, pickup_state")
    .eq("felicity_talent_ref", talentRef)
    .single();
  if (!vendor) return;

  const { data: pendingOrders } = await admin
    .from("orders")
    .select(
      "id, payment_link_id, customer_first_name, customer_last_name, customer_email, customer_phone, customer_gender, customer_date_of_birth, delivery_address, delivery_state, payment_links(flow, item_name, amount_naira, device_type, device_make, device_model)",
    )
    .eq("vendor_id", vendor.id)
    .eq("payment_status", "pending")
    .order("created_at", { ascending: true });

  const match = (pendingOrders ?? []).find(
    (o: Json) => Number(o.payment_links?.amount_naira) === amountNaira,
  );
  if (!match) return;

  // Idempotent: only proceeds if still pending, so a duplicate/retried
  // webhook delivery is a no-op the second time through.
  const { data: updated } = await admin
    .from("orders")
    .update({ payment_status: "paid", paid_at: new Date().toISOString(), felicity_transaction_ref: reference })
    .eq("id", match.id)
    .eq("payment_status", "pending")
    .select("id")
    .single();

  if (!updated) return; // already processed by an earlier delivery of this event

  await admin.from("payment_links").update({ status: "paid" }).eq("id", match.payment_link_id);

  const customerFullName = `${match.customer_first_name} ${match.customer_last_name}`;

  if (match.payment_links.flow === "insured") {
    try {
      const gadgetProduct = await findGadgetCoverProduct();
      const { policy } = await buyInsurance({
        talent_ref: talentRef,
        product_id: gadgetProduct.id,
        device_type: match.payment_links.device_type,
        device_value: Number(match.payment_links.amount_naira),
        device_make: match.payment_links.device_make,
        device_model: match.payment_links.device_model,
        first_name: match.customer_first_name,
        last_name: match.customer_last_name,
        email: match.customer_email,
        phone_number: toInternationalPhone(match.customer_phone),
        gender: match.customer_gender,
        date_of_birth: match.customer_date_of_birth,
        address: match.delivery_address,
        bought_for_self: true,
      });

      await admin.from("insurance_policies").insert({
        order_id: match.id,
        vendor_id: vendor.id,
        felicity_policy_reference: policy.policy_reference,
        felicity_policy_number: policy.policy_number,
        product_id: policy.product_id,
        premium_naira: policy.premium_naira,
        status: policy.status,
        policy_document_url: policy.policy_document_url,
      });
    } catch (err) {
      console.error("buy_insurance failed for order", match.id, err);
    }
  }

  if (!vendor.pickup_address || !vendor.pickup_state || !match.delivery_address || !match.delivery_state) {
    return; // nothing more we can safely do without both addresses
  }

  try {
    const quote = await getDeliveryQuote({
      pickup_address: vendor.pickup_address,
      pickup_state: vendor.pickup_state,
      dropoff_address: match.delivery_address,
      dropoff_state: match.delivery_state,
    });

    if (!quote.eligible) return;

    const { delivery } = await createDelivery({
      talent_ref: talentRef,
      pickup_contact_name: vendor.business_name,
      pickup_contact_phone: vendor.phone,
      pickup_address: vendor.pickup_address,
      pickup_state: vendor.pickup_state,
      dropoff_contact_name: customerFullName,
      dropoff_contact_phone: match.customer_phone,
      dropoff_address: match.delivery_address,
      dropoff_state: match.delivery_state,
      item_description: match.payment_links.item_name,
    });

    await admin.from("deliveries").insert({
      order_id: match.id,
      vendor_id: vendor.id,
      felicity_delivery_reference: delivery.delivery_reference,
      status: delivery.status,
      fee_naira: delivery.fee_naira,
      delivery_pin: delivery.delivery_pin,
    });
  } catch (err) {
    console.error("create_delivery failed for order", match.id, err);
  }
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

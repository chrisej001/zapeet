"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createCheckout, simulateCheckoutFunding, FelicityError } from "@/lib/felicity/client";
import { isLinkUsable } from "@/lib/payment-link-status";
import { planPayout } from "@/lib/fee";
import { ZAPEET_FEE_ACCOUNT } from "@/lib/zapeet-fee";

export type CreateOrderState = {
  error: string | null;
  order: {
    orderId: string;
    accountNumber: string;
    accountName: string;
    bankName: string;
    itemPriceNaira: number;
    /** Only non-zero when the vendor has passed the fee on to the customer. */
    customerFeeNaira: number;
    deliveryAmountNaira: number;
    totalAmountNaira: number;
    /** From the checkout response's own mode field, not a static env var —
     * so the Simulate button can never drift out of sync with the real key. */
    testMode: boolean;
  } | null;
};

export async function createOrder(
  slug: string,
  _prev: CreateOrderState,
  formData: FormData,
): Promise<CreateOrderState> {
  const admin = createAdminClient();

  const { data: link } = await admin
    .from("payment_links")
    .select(
      "id, vendor_id, amount_naira, status, expires_at, item_name, customer_pays_fee",
    )
    .eq("slug", slug)
    .single();

  if (!link || !isLinkUsable(link)) {
    return { error: "This payment link is no longer available.", order: null };
  }

  const { data: vendor } = await admin
    .from("vendors")
    .select(
      "business_name, phone, pickup_address, pickup_state, payout_bank_code, payout_bank_name, payout_account_number, payout_account_name",
    )
    .eq("id", link.vendor_id)
    .single();

  if (
    !vendor?.pickup_address ||
    !vendor.pickup_state ||
    !vendor.payout_bank_code ||
    !vendor.payout_account_number ||
    !vendor.payout_account_name
  ) {
    return { error: "This vendor hasn't finished setting up their account yet.", order: null };
  }

  const customerFirstName = String(formData.get("customer_first_name") ?? "").trim();
  const customerLastName = String(formData.get("customer_last_name") ?? "").trim();
  const customerEmail = String(formData.get("customer_email") ?? "").trim();
  const customerPhone = String(formData.get("customer_phone") ?? "").trim();
  const deliveryAddress = String(formData.get("delivery_address") ?? "").trim();
  const deliveryState = String(formData.get("delivery_state") ?? "").trim();

  if (
    !customerFirstName ||
    !customerLastName ||
    !customerEmail ||
    !customerPhone ||
    !deliveryAddress ||
    !deliveryState
  ) {
    return { error: "All fields are required — every order includes rider delivery.", order: null };
  }
  const orderId = crypto.randomUUID();

  const deliveryInput = {
    pickup_contact_name: vendor.business_name,
    pickup_contact_phone: vendor.phone ?? "",
    pickup_address: vendor.pickup_address,
    pickup_state: vendor.pickup_state,
    dropoff_contact_name: `${customerFirstName} ${customerLastName}`,
    dropoff_contact_phone: customerPhone,
    dropoff_address: deliveryAddress,
    dropoff_state: deliveryState,
    item_description: link.item_name,
  };

  const itemPrice = Number(link.amount_naira);
  const plan = planPayout(itemPrice, link.customer_pays_fee);

  let checkout;
  try {
    const result = await createCheckout({
      order_ref: orderId,
      goods_amount_naira: plan.goodsAmountNaira,
      splits: [
        {
          account_number: vendor.payout_account_number,
          bank_code: vendor.payout_bank_code,
          account_name: vendor.payout_account_name,
          percentage: plan.vendorPercentage,
        },
        {
          account_number: ZAPEET_FEE_ACCOUNT.account_number,
          bank_code: ZAPEET_FEE_ACCOUNT.bank_code,
          account_name: ZAPEET_FEE_ACCOUNT.account_name,
          percentage: plan.feePercentage,
        },
      ],
      label: vendor.business_name,
      delivery: deliveryInput,
    });
    checkout = result.checkout;
  } catch (err) {
    const message = err instanceof FelicityError ? err.message : "Something went wrong — please try again.";
    return { error: message, order: null };
  }

  const { error: insertError } = await admin.from("orders").insert({
    id: orderId,
    payment_link_id: link.id,
    vendor_id: link.vendor_id,
    customer_first_name: customerFirstName,
    customer_last_name: customerLastName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    delivery_address: deliveryAddress,
    delivery_state: deliveryState,
    goods_amount_naira: itemPrice,
    zapeet_fee_naira: plan.feeNaira,
    vendor_payout_naira: plan.vendorPayoutNaira,
    customer_paid_fee: link.customer_pays_fee,
    payout_bank_name: vendor.payout_bank_name,
    payout_account_number: vendor.payout_account_number,
    payout_account_name: vendor.payout_account_name,
    delivery_amount_naira: checkout.delivery_amount_naira,
    total_amount_naira: checkout.total_amount_naira,
    felicity_checkout_account_number: checkout.account_number,
    felicity_checkout_account_name: checkout.account_name,
    felicity_checkout_bank_name: checkout.bank_name,
    felicity_checkout_expires_at: checkout.expires_at,
  });

  if (insertError) {
    return { error: "Something went wrong — please try again.", order: null };
  }

  return {
    error: null,
    order: {
      orderId,
      accountNumber: checkout.account_number,
      accountName: checkout.account_name,
      bankName: checkout.bank_name,
      itemPriceNaira: itemPrice,
      customerFeeNaira: link.customer_pays_fee ? plan.feeNaira : 0,
      deliveryAmountNaira: checkout.delivery_amount_naira,
      totalAmountNaira: checkout.total_amount_naira,
      testMode: checkout.mode === "test",
    },
  };
}

export type OrderStatus = {
  paid: boolean;
  deliveryPin: string | null;
  trackingUrl: string | null;
};

/** Polled from the checkout page once the customer is on the "transfer to
 * complete your order" screen — the only way the page learns a transfer
 * landed and a delivery PIN/tracking link exist, since payment confirmation
 * only ever arrives via Felicity's webhook, never as a response the browser
 * is already holding. Reads straight from our own tables (already RLS'd off
 * for anon via the anon key — this uses the admin client since checkout is
 * unauthenticated), not Felicity, so it's cheap to poll. */
export async function getOrderStatus(orderId: string): Promise<OrderStatus> {
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("payment_status")
    .eq("id", orderId)
    .single();

  if (!order || order.payment_status !== "paid") {
    return { paid: false, deliveryPin: null, trackingUrl: null };
  }

  const { data: delivery } = await admin
    .from("deliveries")
    .select("delivery_pin, tracking_url")
    .eq("order_id", orderId)
    .maybeSingle();

  return {
    paid: true,
    deliveryPin: delivery?.delivery_pin ?? null,
    trackingUrl: delivery?.tracking_url ?? null,
  };
}

/** Test-mode-only "pay now" shortcut, the same simulate_checkout_funding
 * action used to verify the full settlement chain end-to-end — Felicity
 * itself refuses this with simulate_only_in_test_mode outside test mode, so
 * it's safe even if the button were ever shown by mistake. Gated in the UI
 * by the checkout's own mode field (see CreateOrderState.order.testMode),
 * not a separately-tracked env var that could drift out of sync with the
 * actual key. */
export async function simulatePayment(
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await simulateCheckoutFunding(orderId);
    return { ok: true };
  } catch (err) {
    const message = err instanceof FelicityError ? err.message : "Simulated payment failed.";
    return { ok: false, error: message };
  }
}

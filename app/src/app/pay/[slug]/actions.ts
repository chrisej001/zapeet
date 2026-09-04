"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isPlausibleDateOfBirth } from "@/lib/validate-dob";
import {
  createCheckout,
  simulateCheckoutFunding,
  findGadgetCoverProduct,
  FelicityError,
  toInternationalPhone,
} from "@/lib/felicity/client";

export type CreateOrderState = {
  error: string | null;
  order: {
    orderId: string;
    accountNumber: string;
    accountName: string;
    bankName: string;
    goodsAmountNaira: number;
    insuranceAmountNaira: number;
    deliveryAmountNaira: number;
    totalAmountNaira: number;
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
    .select("id, vendor_id, amount_naira, status, flow, item_name, device_type, device_make, device_model")
    .eq("slug", slug)
    .single();

  if (!link || link.status !== "active") {
    return { error: "This payment link is no longer available.", order: null };
  }

  const { data: vendor } = await admin
    .from("vendors")
    .select("felicity_talent_ref, business_name, phone, pickup_address, pickup_state")
    .eq("id", link.vendor_id)
    .single();

  if (!vendor?.felicity_talent_ref || !vendor.pickup_address || !vendor.pickup_state) {
    return { error: "This vendor hasn't finished setting up their account yet.", order: null };
  }

  const customerFirstName = String(formData.get("customer_first_name") ?? "").trim();
  const customerLastName = String(formData.get("customer_last_name") ?? "").trim();
  const customerEmail = String(formData.get("customer_email") ?? "").trim();
  const customerPhone = String(formData.get("customer_phone") ?? "").trim();
  const deliveryAddress = String(formData.get("delivery_address") ?? "").trim();
  const deliveryState = String(formData.get("delivery_state") ?? "").trim();
  const customerGender = String(formData.get("customer_gender") ?? "").trim();
  const customerDateOfBirth = String(formData.get("customer_date_of_birth") ?? "").trim();

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
  if (link.flow === "insured" && (!customerGender || !customerDateOfBirth)) {
    return { error: "Gender and date of birth are required to issue device insurance.", order: null };
  }
  if (link.flow === "insured" && !isPlausibleDateOfBirth(customerDateOfBirth)) {
    return { error: "Enter a valid date of birth.", order: null };
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

  let insuranceInput: NonNullable<Parameters<typeof createCheckout>[0]["insurance"]> | undefined;

  if (link.flow === "insured") {
    if (!link.device_type || !link.device_make || !link.device_model) {
      return { error: "This link is missing device details — ask the vendor to recreate it.", order: null };
    }
    try {
      const gadgetProduct = await findGadgetCoverProduct();
      insuranceInput = {
        product_id: gadgetProduct.id,
        device_type: link.device_type,
        device_value: Number(link.amount_naira),
        device_make: link.device_make,
        device_model: link.device_model,
        gender: customerGender,
        date_of_birth: customerDateOfBirth,
        address: deliveryAddress,
        first_name: customerFirstName,
        last_name: customerLastName,
        email: customerEmail,
        phone: toInternationalPhone(customerPhone),
        bought_for_self: true,
      };
    } catch {
      return { error: "Insurance isn't available right now — please try again shortly.", order: null };
    }
  }

  let checkout;
  try {
    const result = await createCheckout({
      order_ref: orderId,
      vendor_ref: vendor.felicity_talent_ref,
      goods_amount_naira: Number(link.amount_naira),
      delivery: deliveryInput,
      insurance: insuranceInput,
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
    customer_gender: link.flow === "insured" ? customerGender : null,
    customer_date_of_birth: link.flow === "insured" ? customerDateOfBirth : null,
    goods_amount_naira: checkout.goods_amount_naira,
    insurance_amount_naira: checkout.insurance_amount_naira,
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
      goodsAmountNaira: checkout.goods_amount_naira,
      insuranceAmountNaira: checkout.insurance_amount_naira,
      deliveryAmountNaira: checkout.delivery_amount_naira,
      totalAmountNaira: checkout.total_amount_naira,
    },
  };
}

/** Test-mode-only "pay now" shortcut, the same simulate_checkout_funding
 * action used to verify the full settlement chain end-to-end — Felicity
 * itself refuses this with simulate_only_in_test_mode outside test mode, so
 * it's safe even if the button were ever shown by mistake. Gated in the UI
 * by FELICITY_MODE so it never renders in production. */
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

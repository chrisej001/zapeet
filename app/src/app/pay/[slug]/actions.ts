"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type CreateOrderState = {
  error: string | null;
  order: {
    accountNumber: string;
    accountName: string;
    bankName: string;
    amountNaira: number;
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
    .select("id, vendor_id, amount_naira, status, flow")
    .eq("slug", slug)
    .single();

  if (!link || link.status !== "active") {
    return { error: "This payment link is no longer available.", order: null };
  }

  const { data: vendor } = await admin
    .from("vendors")
    .select("felicity_account_number, felicity_account_name, felicity_bank_name")
    .eq("id", link.vendor_id)
    .single();

  if (!vendor?.felicity_account_number) {
    return { error: "This vendor hasn't finished setting up payments yet.", order: null };
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

  const { error: insertError } = await admin.from("orders").insert({
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
  });

  if (insertError) {
    return { error: "Something went wrong — please try again.", order: null };
  }

  return {
    error: null,
    order: {
      accountNumber: vendor.felicity_account_number,
      accountName: vendor.felicity_account_name ?? "",
      bankName: vendor.felicity_bank_name ?? "",
      amountNaira: Number(link.amount_naira),
    },
  };
}

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/slug";

export type CreateLinkState = {
  error: string | null;
};

export async function createPaymentLink(
  _prev: CreateLinkState,
  formData: FormData,
): Promise<CreateLinkState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired — please log in again." };
  }

  const itemName = String(formData.get("item_name") ?? "").trim();
  const amountRaw = String(formData.get("amount_naira") ?? "").trim();
  const flow = String(formData.get("flow") ?? "");
  const deviceType = String(formData.get("device_type") ?? "").trim();
  const deviceMake = String(formData.get("device_make") ?? "").trim();
  const deviceModel = String(formData.get("device_model") ?? "").trim();
  // All optional — Gadget Cover V2 accepts these beyond the required set.
  const deviceImei = String(formData.get("device_imei") ?? "").trim();
  const deviceSerialNumber = String(formData.get("device_serial_number") ?? "").trim();
  const deviceColor = String(formData.get("device_color") ?? "").trim();
  const devicePurchaseDate = String(formData.get("device_purchase_date") ?? "").trim();
  const deviceImageUrl = String(formData.get("device_image_url") ?? "").trim();

  if (!itemName) {
    return { error: "Enter what you're selling." };
  }
  const amount = Number(amountRaw);
  if (!amountRaw || Number.isNaN(amount) || amount <= 0) {
    return { error: "Enter a valid amount." };
  }
  if (flow !== "insured" && flow !== "pure_delivery") {
    return { error: "Pick a flow." };
  }
  if (flow === "insured" && (!deviceType || !deviceMake || !deviceModel)) {
    return { error: "Device type, make, and model are required for insured links." };
  }

  // Slugs are globally unique; retry on the rare collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug();
    const { error } = await supabase.from("payment_links").insert({
      vendor_id: user.id,
      slug,
      flow,
      item_name: itemName,
      amount_naira: amount,
      device_type: flow === "insured" ? deviceType : null,
      device_make: flow === "insured" ? deviceMake : null,
      device_model: flow === "insured" ? deviceModel : null,
      device_imei: flow === "insured" && deviceImei ? deviceImei : null,
      device_serial_number: flow === "insured" && deviceSerialNumber ? deviceSerialNumber : null,
      device_color: flow === "insured" && deviceColor ? deviceColor : null,
      device_purchase_date: flow === "insured" && devicePurchaseDate ? devicePurchaseDate : null,
      device_image_url: flow === "insured" && deviceImageUrl ? deviceImageUrl : null,
    });

    if (!error) {
      redirect("/dashboard/links");
    }
    if (error.code !== "23505") {
      // not a unique-violation — no point retrying
      return { error: "Couldn't create the link — try again." };
    }
  }

  return { error: "Couldn't generate a unique link — try again." };
}

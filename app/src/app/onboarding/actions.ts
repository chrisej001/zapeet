"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifyPayoutAccount } from "@/lib/payout-account";

export type OnboardState = {
  error: string | null;
};

export async function completeOnboarding(_prev: OnboardState, formData: FormData): Promise<OnboardState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired — please log in again." };
  }

  const phone = String(formData.get("phone") ?? "").trim();
  const pickupAddress = String(formData.get("pickup_address") ?? "").trim();
  const pickupState = String(formData.get("pickup_state") ?? "").trim();
  const bankCode = String(formData.get("bank_code") ?? "").trim();
  const accountNumber = String(formData.get("account_number") ?? "").trim();

  if (!phone || !pickupAddress || !pickupState) {
    return { error: "All fields are required." };
  }

  const verified = await verifyPayoutAccount(bankCode, accountNumber);
  if (!verified.ok) return { error: verified.error };

  const { error: updateError } = await supabase
    .from("vendors")
    .update({
      phone,
      pickup_address: pickupAddress,
      pickup_state: pickupState,
      ...verified.account,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    return { error: "Couldn't save your details — try again." };
  }

  redirect("/dashboard");
}

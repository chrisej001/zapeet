"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { onboardTalent, FelicityError } from "@/lib/felicity/client";
import { isPlausibleDateOfBirth } from "@/lib/validate-dob";

export type OnboardState = {
  error: string | null;
};

export async function completeOnboarding(
  _prev: OnboardState,
  formData: FormData,
): Promise<OnboardState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired — please log in again." };
  }

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const dateOfBirth = String(formData.get("date_of_birth") ?? "").trim();
  const bvn = String(formData.get("bvn") ?? "").trim();
  const nin = String(formData.get("nin") ?? "").trim();
  const pickupAddress = String(formData.get("pickup_address") ?? "").trim();
  const pickupState = String(formData.get("pickup_state") ?? "").trim();

  if (
    !firstName ||
    !lastName ||
    !phone ||
    !dateOfBirth ||
    !bvn ||
    !nin ||
    !pickupAddress ||
    !pickupState
  ) {
    return { error: "All fields are required." };
  }
  if (!/^\d{11}$/.test(bvn)) {
    return { error: "BVN must be exactly 11 digits." };
  }
  if (!/^\d{11}$/.test(nin)) {
    return { error: "NIN must be exactly 11 digits." };
  }
  if (!isPlausibleDateOfBirth(dateOfBirth)) {
    return { error: "Enter a valid date of birth." };
  }

  try {
    const { talent } = await onboardTalent({
      talent_ref: user.id,
      first_name: firstName,
      last_name: lastName,
      phone,
      email: user.email!,
      date_of_birth: dateOfBirth,
      bvn,
      nin,
    });

    const { error: updateError } = await supabase
      .from("vendors")
      .update({
        first_name: firstName,
        last_name: lastName,
        phone,
        date_of_birth: dateOfBirth,
        bvn,
        nin,
        pickup_address: pickupAddress,
        pickup_state: pickupState,
        felicity_talent_ref: talent.talent_ref,
        felicity_account_number: talent.account_number,
        felicity_account_name: talent.account_name,
        felicity_bank_name: talent.bank_name,
        felicity_kyc_status: talent.kyc_status,
        onboarded_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      return { error: "Saved with Felicity but failed to update your profile — try again." };
    }
  } catch (err) {
    if (err instanceof FelicityError) {
      return { error: err.message };
    }
    return { error: "Something went wrong reaching Felicity. Please try again." };
  }

  redirect("/dashboard");
}

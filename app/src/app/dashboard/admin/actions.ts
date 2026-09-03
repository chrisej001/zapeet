"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { simulateFunding, FelicityError } from "@/lib/felicity/client";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data: vendor } = await supabase.from("vendors").select("is_admin").eq("id", user.id).single();
  if (!vendor?.is_admin) throw new Error("Not authorized.");

  return user;
}

export type SetupTreasuryState = { error: string | null };

/** The treasury doesn't onboard a fresh Felicity talent — it reuses the
 * admin's own vendor identity, already verified with Felicity during their
 * own vendor onboarding. No re-entry of BVN/NIN/etc. */
export async function setupTreasury(
  _prev: SetupTreasuryState,
  _formData: FormData,
): Promise<SetupTreasuryState> {
  const user = await requireAdmin();
  const admin = createAdminClient();

  const { data: vendor } = await admin
    .from("vendors")
    .select(
      "first_name, last_name, phone, date_of_birth, bvn, nin, felicity_talent_ref, felicity_account_number, felicity_account_name, felicity_bank_name, felicity_kyc_status",
    )
    .eq("id", user.id)
    .single();

  if (!vendor?.felicity_talent_ref || vendor.felicity_kyc_status !== "verified") {
    return { error: "Finish your own vendor onboarding with Felicity first." };
  }

  const { error: insertError } = await admin.from("treasury_account").insert({
    first_name: vendor.first_name,
    last_name: vendor.last_name,
    phone: vendor.phone,
    email: user.email,
    date_of_birth: vendor.date_of_birth,
    bvn: vendor.bvn,
    nin: vendor.nin,
    felicity_talent_ref: vendor.felicity_talent_ref,
    felicity_account_number: vendor.felicity_account_number,
    felicity_account_name: vendor.felicity_account_name,
    felicity_bank_name: vendor.felicity_bank_name,
    onboarded_at: new Date().toISOString(),
  });

  if (insertError) {
    return { error: "Failed to save the treasury account — contact support." };
  }

  revalidatePath("/dashboard/admin");
  return { error: null };
}

export type SimulateFundState = { error: string | null };

export async function simulateTreasuryFunding(
  _prev: SimulateFundState,
  formData: FormData,
): Promise<SimulateFundState> {
  await requireAdmin();
  const admin = createAdminClient();

  const amount = Number(formData.get("amount_naira"));
  if (!amount || amount <= 0) return { error: "Enter a valid amount." };

  const { data: treasury } = await admin
    .from("treasury_account")
    .select("felicity_talent_ref")
    .not("onboarded_at", "is", null)
    .limit(1)
    .maybeSingle();

  if (!treasury?.felicity_talent_ref) return { error: "Treasury account isn't set up yet." };

  try {
    await simulateFunding(treasury.felicity_talent_ref, amount);
  } catch (err) {
    const message = err instanceof FelicityError ? err.message : "Simulated funding failed.";
    return { error: message };
  }

  revalidatePath("/dashboard/admin");
  return { error: null };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { simulateFunding, FelicityError } from "@/lib/felicity/client";
import { resolveVendorFelicityAccount } from "@/lib/felicity/vendor-identity";

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

export type SimulateFundState = { error: string | null };

/** Test-mode only, same as simulate_checkout_funding elsewhere — Felicity
 * itself refuses this outside test mode. Funds whichever of the admin's
 * accounts the current key resolves to (see resolveVendorFelicityAccount);
 * there's no separate treasury identity to set up anymore — the treasury
 * *is* the admin vendor's own account, in whichever mode is live right now. */
export async function simulateTreasuryFunding(
  _prev: SimulateFundState,
  formData: FormData,
): Promise<SimulateFundState> {
  const user = await requireAdmin();
  const admin = createAdminClient();

  const amount = Number(formData.get("amount_naira"));
  if (!amount || amount <= 0) return { error: "Enter a valid amount." };

  const account = await resolveVendorFelicityAccount(admin, user.id);
  if (!account) return { error: "No Felicity account resolved for the current mode." };

  try {
    await simulateFunding(account.felicity_talent_ref, amount);
  } catch (err) {
    const message = err instanceof FelicityError ? err.message : "Simulated funding failed.";
    return { error: message };
  }

  revalidatePath("/dashboard/admin");
  return { error: null };
}

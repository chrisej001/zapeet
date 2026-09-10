import "server-only";
import { getTalent } from "./client";

export type VendorFelicityAccount = {
  mode: "test" | "live";
  felicity_talent_ref: string;
  felicity_account_number: string | null;
  felicity_account_name: string | null;
  felicity_bank_name: string | null;
  felicity_kyc_status: string;
};

/** A vendor can have both a test-mode and a live-mode Felicity identity
 * under one login. Which one is "real" for the current request depends on
 * whether the deployed FELICITY_PARTNER_KEY is itself a test or live key —
 * not something the app tracks as a flag (that drifts, see the earlier
 * Simulate-button bug). Instead: try get_talent against each stored ref:
 * a talent onboarded under a test-mode key is invisible to a live-mode key
 * and vice versa (Felicity scopes by partner_client_id + mode), so
 * whichever ref actually resolves *is* the answer for "what mode are we
 * in right now" — no separate tracking needed, and it can never drift out
 * of sync with the real key. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function resolveVendorFelicityAccount(
  admin: any,
  vendorId: string,
): Promise<VendorFelicityAccount | null> {
  const { data: accounts } = await admin
    .from("vendor_felicity_accounts")
    .select(
      "mode, felicity_talent_ref, felicity_account_number, felicity_account_name, felicity_bank_name, felicity_kyc_status",
    )
    .eq("vendor_id", vendorId);

  if (!accounts?.length) return null;

  const results = await Promise.allSettled(
    accounts.map((a: VendorFelicityAccount) => getTalent(a.felicity_talent_ref)),
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled" && result.value.talent) {
      return accounts[i];
    }
  }

  return null;
}

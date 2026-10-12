"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifyPayoutAccount } from "@/lib/payout-account";

export type ProfileFormState = { error: string | null; success?: boolean };

export async function updatePayoutAccount(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired — please log in again." };

  const verified = await verifyPayoutAccount(
    String(formData.get("bank_code") ?? "").trim(),
    String(formData.get("account_number") ?? "").trim(),
  );
  if (!verified.ok) return { error: verified.error };

  // Only affects orders created from now on — each order snapshots the
  // payout account it was split to.
  const { error } = await supabase.from("vendors").update(verified.account).eq("id", user.id);
  if (error) return { error: "Couldn't save your payout account — try again." };

  redirect("/dashboard/profile");
}

export async function changePassword(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Your session expired — please log in again." };

  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (newPassword.length < 6) return { error: "New password must be at least 6 characters." };
  if (newPassword !== confirmPassword) return { error: "New passwords don't match." };
  if (newPassword === currentPassword) return { error: "Pick a password different from your current one." };

  // Confirm the current password on a throwaway, non-persisting client so
  // a wrong guess never touches the real session cookies.
  const verifier = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error: signInError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) return { error: "Your current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };

  return { error: null, success: true };
}

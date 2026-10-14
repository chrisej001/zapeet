"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "./require-admin-page";

export async function setDemoMode(vendorId: string, on: boolean) {
  await requireAdmin();
  const { error } = await createAdminClient().from("vendors").update({ demo_mode: on }).eq("id", vendorId);
  if (error) throw new Error("Couldn't switch mode — try again.");
  revalidatePath("/dashboard", "layout");
}

/** Wipes a vendor's demo links — their orders and deliveries cascade. */
export async function clearDemoData(vendorId: string) {
  await requireAdmin();
  const { error } = await createAdminClient()
    .from("payment_links")
    .delete()
    .eq("vendor_id", vendorId)
    .eq("is_demo", true);
  if (error) throw new Error("Couldn't clear demo data — try again.");
  revalidatePath("/dashboard", "layout");
}

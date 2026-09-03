import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Shared guard for every /dashboard/admin/** page: redirects non-admins,
 * returns the service-role client so admin pages can read across all
 * vendors' data (RLS normally scopes each vendor to their own rows). */
export async function requireAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: vendor } = await supabase.from("vendors").select("is_admin").eq("id", user.id).single();
  if (!vendor?.is_admin) redirect("/dashboard");

  return { user, admin: createAdminClient() };
}

export function fmtNaira(amount: number | string | null | undefined) {
  if (amount == null) return "—";
  return `₦${Number(amount).toLocaleString("en-NG")}`;
}

export function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusColor(status: string | null | undefined) {
  const s = (status ?? "").toLowerCase();
  if (["paid", "active", "verified", "completed", "issued"].includes(s)) return "text-marigold-ink";
  if (["failed", "cancelled", "expired"].includes(s)) return "text-terracotta";
  return "text-ink-60";
}

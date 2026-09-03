import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShieldIcon, ChevronRightIcon } from "@/components/icons";
import { SignOutButton } from "../sign-out-button";
import { BottomNav } from "../bottom-nav";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: vendor } = await supabase
    .from("vendors")
    .select(
      "business_name, first_name, last_name, phone, felicity_account_number, felicity_bank_name, felicity_kyc_status, pickup_address, pickup_state, is_admin",
    )
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8 pb-28">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="mb-1 text-xl">{vendor?.business_name ?? "Your business"}</h1>
        <p className="mb-6 text-sm text-ink-60">{user.email}</p>

        <div className="mb-6 flex flex-col gap-1 rounded-[16px] border border-ink/10 bg-white p-5">
          <Row label="Contact" value={`${vendor?.first_name ?? ""} ${vendor?.last_name ?? ""}`.trim() || "—"} />
          <Row label="Phone" value={vendor?.phone ?? "—"} />
          <Row label="KYC status" value={vendor?.felicity_kyc_status ?? "—"} />
          <Row label="Account number" value={vendor?.felicity_account_number ?? "—"} />
          <Row label="Bank" value={vendor?.felicity_bank_name ?? "—"} />
          <Row label="Pickup address" value={vendor?.pickup_address ?? "—"} />
          <Row label="Pickup state" value={vendor?.pickup_state ?? "—"} />
        </div>

        <div className="mb-6 flex flex-col gap-3">
          {vendor?.is_admin && (
            <Link
              href="/dashboard/admin"
              className="flex items-center justify-between rounded-[14px] border border-ink/10 bg-white p-4"
            >
              <span className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                <ShieldIcon className="h-4.5 w-4.5 text-marigold-ink" />
                Admin
              </span>
              <ChevronRightIcon className="h-4 w-4 text-ink-60" />
            </Link>
          )}
        </div>

        <SignOutButton />
      </div>
      <BottomNav />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="text-ink-60">{label}</span>
      <span className="text-right font-semibold text-ink">{value}</span>
    </div>
  );
}

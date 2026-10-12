import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listBanks } from "@/lib/felicity/client";
import { PayoutForm } from "./payout-form";

export default async function PayoutAccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: vendor } = await supabase
    .from("vendors")
    .select("payout_bank_code, payout_account_number")
    .eq("id", user.id)
    .single();

  let banks: { code: string; name: string }[] = [];
  try {
    banks = (await listBanks()).banks;
  } catch {
    banks = [];
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/dashboard/profile" className="text-sm font-medium text-ink-60">
          ← Back
        </Link>
        <h1 className="mt-4 mb-1 text-xl">Payout account</h1>
        <p className="mb-6 text-sm text-ink-60">
          New orders pay out to this account. Orders already placed still pay the account they were created with.
        </p>
        {banks.length ? (
          <PayoutForm
            banks={banks}
            defaultBankCode={vendor?.payout_bank_code ?? ""}
            defaultAccountNumber={vendor?.payout_account_number ?? ""}
          />
        ) : (
          <div className="rounded-[10px] bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
            Couldn&apos;t load the bank list — try again shortly.
          </div>
        )}
      </div>
    </div>
  );
}

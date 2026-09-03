import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTalent, getTransactions } from "@/lib/felicity/client";
import { OverviewCard } from "./overview-client";
import { BottomNav } from "./bottom-nav";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select("business_name, felicity_talent_ref, felicity_account_number, felicity_bank_name")
    .eq("id", user.id)
    .single();

  let balanceNaira: number | null = null;
  let transactions: Awaited<ReturnType<typeof getTransactions>>["transactions"] = [];

  if (vendor?.felicity_talent_ref) {
    const [talentResult, txResult] = await Promise.allSettled([
      getTalent(vendor.felicity_talent_ref),
      getTransactions(vendor.felicity_talent_ref),
    ]);
    if (talentResult.status === "fulfilled") balanceNaira = talentResult.value.talent.balance_kobo / 100;
    if (txResult.status === "fulfilled") transactions = txResult.value.transactions;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8 pb-28">
      <div className="mx-auto w-full max-w-sm">
        <OverviewCard
          businessName={vendor?.business_name ?? "Your business"}
          accountNumber={vendor?.felicity_account_number ?? null}
          bankName={vendor?.felicity_bank_name ?? null}
          balanceNaira={balanceNaira}
          transactions={transactions}
        />
      </div>
      <BottomNav />
    </div>
  );
}

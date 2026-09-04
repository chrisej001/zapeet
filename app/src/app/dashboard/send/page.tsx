import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listBanks } from "@/lib/felicity/client";
import { SendMoneyForm } from "./send-money-form";

export default async function SendMoneyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  let banks: { code: string; name: string }[] = [];
  let banksError = false;
  try {
    banks = (await listBanks()).banks;
  } catch {
    banksError = true;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/dashboard" className="text-sm font-medium text-ink-60">
          ← Back
        </Link>
        <h1 className="mt-4 mb-6 text-xl">Send money</h1>
        {banksError ? (
          <div className="rounded-[10px] bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
            Couldn&apos;t load the bank list — try again shortly.
          </div>
        ) : (
          <SendMoneyForm banks={banks} />
        )}
      </div>
    </div>
  );
}

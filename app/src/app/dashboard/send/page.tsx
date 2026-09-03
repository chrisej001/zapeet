import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SendMoneyForm } from "./send-money-form";

export default async function SendMoneyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/dashboard" className="text-sm font-medium text-ink-60">
          ← Back
        </Link>
        <h1 className="mt-4 mb-6 text-xl">Send money</h1>
        <SendMoneyForm />
      </div>
    </div>
  );
}

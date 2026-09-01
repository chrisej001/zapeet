import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const businessName = (user.user_metadata?.business_name as string | undefined) ?? "there";

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl">Welcome, {businessName}</h1>
            <p className="mt-1 text-sm text-ink-60">{user.email}</p>
          </div>
          <SignOutButton />
        </div>

        <div className="rounded-[16px] border border-ink/10 bg-white p-6 text-center">
          <p className="text-sm text-ink-60">
            Vendor dashboard — link generation, order tracking, and delivery status land here
            next.
          </p>
        </div>
      </div>
    </div>
  );
}

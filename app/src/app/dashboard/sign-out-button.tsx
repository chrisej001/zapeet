"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/auth");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="rounded-[10px] border border-ink/20 px-4 py-2 text-sm font-semibold text-ink"
    >
      Log out
    </button>
  );
}

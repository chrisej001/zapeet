"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/logo";
import { PasswordInput } from "@/components/password-input";
import { createClient } from "@/lib/supabase/client";

/** Reached from the emailed recovery link via /auth/callback, which has
 * already signed the user in — so all that's left is setting the password. */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data: { session } }) => setHasSession(!!session));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="flex flex-col items-center gap-3 pb-10">
          <a href="https://zapeet.app" aria-label="Zapeet home">
            <LogoMark size={44} />
          </a>
          <h1 className="text-2xl">Set a new password</h1>
        </div>

        {hasSession === false ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-[10px] bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
              This reset link has expired or was already used.
            </div>
            <Link
              href="/auth/forgot"
              className="w-full rounded-[10px] bg-ink py-3.5 text-center text-sm font-semibold text-paper"
            >
              Request a new link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <PasswordInput label="New password" value={password} onChange={setPassword} autoComplete="new-password" />
            <PasswordInput
              label="Confirm new password"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
            />

            {error && (
              <div className="rounded-[10px] bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || hasSession === null}
              className="mt-2 w-full rounded-[10px] bg-ink py-3.5 text-sm font-semibold text-paper disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save new password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LogoMark } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("expired") ? "That reset link has expired or was already used — request a new one." : null,
  );
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="flex flex-col items-center gap-3 pb-10">
          <LogoMark size={44} />
          <div className="text-center">
            <h1 className="text-2xl">Reset your password</h1>
            <p className="mt-1.5 text-sm text-ink-60">
              Enter your account email and we&apos;ll send you a link to set a new one.
            </p>
          </div>
        </div>

        {sent ? (
          <div className="rounded-[10px] bg-marigold/15 px-4 py-3 text-sm font-medium text-marigold-ink">
            If an account exists for {email}, a reset link is on its way. Check your inbox (and spam).
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold tracking-[0.06em] text-ink-60 uppercase">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                autoComplete="email"
                required
                className="rounded-[10px] border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-ink/40"
              />
            </label>

            {error && (
              <div className="rounded-[10px] bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-[10px] bg-ink py-3.5 text-sm font-semibold text-paper disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <Link href="/auth" className="mt-6 text-center text-sm font-medium text-ink-60">
          Back to <span className="font-semibold text-ink">Log in</span>
        </Link>
      </div>
    </div>
  );
}

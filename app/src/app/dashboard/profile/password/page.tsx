"use client";

import { useActionState } from "react";
import Link from "next/link";
import { changePassword, type ProfileFormState } from "../actions";
import { PasswordInput } from "@/components/password-input";

const initialState: ProfileFormState = { error: null };

export default function ChangePasswordPage() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/dashboard/profile" className="text-sm font-medium text-ink-60">
          ← Back
        </Link>
        <h1 className="mt-4 mb-6 text-xl">Change password</h1>

        {state.success ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-[10px] bg-marigold/15 px-4 py-3 text-sm font-medium text-marigold-ink">
              Password updated. Use your new password next time you log in.
            </div>
            <Link
              href="/dashboard/profile"
              className="w-full rounded-[10px] bg-ink py-3.5 text-center text-sm font-semibold text-paper"
            >
              Done
            </Link>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <PasswordInput label="Current password" name="current_password" autoComplete="current-password" minLength={1} />
            <Link href="/auth/forgot" className="-mt-2 self-end text-xs font-semibold text-ink-60 hover:text-ink">
              Forgot your current password?
            </Link>
            <PasswordInput label="New password" name="new_password" autoComplete="new-password" />
            <PasswordInput label="Confirm new password" name="confirm_password" autoComplete="new-password" />

            {state.error && (
              <div className="rounded-[10px] bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
                {state.error}
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 w-full rounded-[10px] bg-ink py-3.5 text-sm font-semibold text-paper disabled:opacity-60"
            >
              {pending ? "Saving…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

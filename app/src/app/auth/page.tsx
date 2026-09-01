"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogoMark } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

type Mode = "sign_in" | "sign_up";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "sign_up") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { business_name: businessName } },
      });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      setNotice("Check your email to confirm your account, then log in.");
      setMode("sign_in");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:mx-auto sm:w-full sm:max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-3 pb-10"
        >
          <LogoMark size={44} />
          <div className="text-center">
            <h1 className="text-2xl">
              {mode === "sign_in" ? "Log in to Zapeet" : "Create your vendor account"}
            </h1>
            <p className="mt-1.5 text-sm text-ink-60">
              {mode === "sign_in"
                ? "Insured checkout. Automated delivery."
                : "Generate payment links, insured or not, in minutes."}
            </p>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          {mode === "sign_up" && (
            <Field
              label="Business name"
              type="text"
              value={businessName}
              onChange={setBusinessName}
              placeholder="e.g. Chris Gadgets Ltd"
              required
            />
          )}
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@business.com"
            required
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            required
            minLength={6}
          />

          {error && (
            <div className="rounded-[10px] bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
              {error}
            </div>
          )}
          {notice && (
            <div className="rounded-[10px] bg-marigold/15 px-4 py-3 text-sm font-medium text-marigold-ink">
              {notice}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-[10px] bg-ink py-3.5 text-sm font-semibold text-paper transition-opacity disabled:opacity-60"
          >
            {loading ? "Please wait…" : mode === "sign_in" ? "Log in" : "Create account"}
          </button>
        </motion.form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "sign_in" ? "sign_up" : "sign_in");
            setError(null);
            setNotice(null);
          }}
          className="mt-6 text-center text-sm font-medium text-ink-60"
        >
          {mode === "sign_in" ? (
            <>
              New to Zapeet? <span className="font-semibold text-ink">Create an account</span>
            </>
          ) : (
            <>
              Already have an account? <span className="font-semibold text-ink">Log in</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
  minLength,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold tracking-[0.06em] text-ink-60 uppercase">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="rounded-[10px] border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-ink/40"
      />
    </label>
  );
}

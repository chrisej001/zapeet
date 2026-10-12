"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

/** Every password field in the app — same look as the other inputs, with a
 * show/hide toggle. Works controlled (value/onChange) or uncontrolled
 * inside a server-action form (name). */
export function PasswordInput({
  label,
  name,
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete,
  minLength = 6,
  required = true,
}: {
  label: string;
  name?: string;
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  autoComplete?: "current-password" | "new-password";
  minLength?: number;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold tracking-[0.06em] text-ink-60 uppercase">{label}</span>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className="w-full rounded-[10px] border border-ink/15 bg-white py-3 pr-12 pl-4 text-sm text-ink outline-none focus:border-ink/40"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-ink-60 hover:text-ink"
        >
          {visible ? <EyeOffIcon className="h-4.5 w-4.5" /> : <EyeIcon className="h-4.5 w-4.5" />}
        </button>
      </div>
    </label>
  );
}

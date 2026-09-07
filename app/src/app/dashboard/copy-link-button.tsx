"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/icons";

export function CopyLinkButton({ slug, disabled }: { slug: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/pay/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  if (disabled) {
    return (
      <span className="flex items-center gap-1.5 rounded-[8px] border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink-60/60">
        Not copiable
      </span>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-[8px] border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink"
    >
      {copied ? (
        <>
          <CheckIcon className="h-3.5 w-3.5" />
          Copied
        </>
      ) : (
        "Copy link"
      )}
    </button>
  );
}

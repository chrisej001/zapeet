"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/icons";

export function CopyLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/pay/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
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

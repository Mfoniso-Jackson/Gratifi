"use client";

import { useState } from "react";

/** A read-only link with a Copy button, for pasting into an NFC writing app. */
export function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex min-w-0 gap-2">
      <input
        readOnly
        value={value}
        aria-label={label}
        onFocus={(event) => event.currentTarget.select()}
        className="min-w-0 flex-1 rounded-md border border-ink/15 bg-[#f6f7f2] px-3 py-2 font-mono text-xs"
      />
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            setCopied(false);
          }
        }}
        className="shrink-0 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

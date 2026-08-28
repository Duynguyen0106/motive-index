"use client";

import { useState } from "react";

export function ShareLinkButton({
  url,
  label = "Copy link",
}: {
  url: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback ignored */
    }
  }

  return (
    <button type="button" className="btn btn-ghost text-sm" onClick={copy}>
      {copied ? "Copied" : label}
    </button>
  );
}

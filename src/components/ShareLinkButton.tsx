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
    const absolute =
      url.startsWith("http") ? url : `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;

    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      return;
    } catch {
      /* try Web Share API on mobile as fallback */
    }

    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url: absolute });
      }
    } catch {
      /* user cancelled or unavailable */
    }
  }

  return (
    <button type="button" className="btn btn-ghost text-sm" onClick={() => void copy()}>
      {copied ? "Copied" : label}
    </button>
  );
}

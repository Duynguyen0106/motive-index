"use client";

import { useState } from "react";

type ShareState = "idle" | "copied" | "shared" | "failed";

export function ShareLinkButton({
  url,
  label = "Copy link",
}: {
  url: string;
  label?: string;
}) {
  const [state, setState] = useState<ShareState>("idle");

  async function copy() {
    const absolute =
      url.startsWith("http") ? url : `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;

    try {
      await navigator.clipboard.writeText(absolute);
      setState("copied");
      window.setTimeout(() => setState("idle"), 2000);
      return;
    } catch {
      /* try Web Share API on mobile as fallback */
    }

    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url: absolute });
        setState("shared");
        window.setTimeout(() => setState("idle"), 2000);
        return;
      }
    } catch {
      /* user cancelled or unavailable */
    }

    setState("failed");
    window.setTimeout(() => setState("idle"), 2500);
  }

  const buttonLabel =
    state === "copied"
      ? "Copied"
      : state === "shared"
        ? "Shared"
        : state === "failed"
          ? "Copy failed"
          : label;

  return (
    <button type="button" className="btn btn-ghost text-sm" onClick={() => void copy()}>
      {buttonLabel}
    </button>
  );
}

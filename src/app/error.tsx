"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="site-shell py-14 md:py-20">
      <p className="label">Error</p>
      <h1 className="display mt-3 text-4xl text-[var(--ink)] md:text-5xl">Something went wrong</h1>
      <p className="body-copy mt-4 max-w-xl text-lg text-[var(--ink-soft)]">
        The page failed to load. You can retry or return to the monitor while we keep the catalog
        available elsewhere.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary text-sm" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/" className="btn btn-ghost text-sm">
          World monitor
        </Link>
        <Link href="/archive" className="btn btn-ghost text-sm">
          Case archive
        </Link>
      </div>
    </div>
  );
}

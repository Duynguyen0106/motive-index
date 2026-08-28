"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#f6f3ee",
          color: "#1a1814",
        }}
      >
        <div style={{ maxWidth: "42rem", margin: "0 auto", padding: "4rem 1.5rem" }}>
          <p style={{ fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Error
          </p>
          <h1 style={{ fontSize: "2.25rem", marginTop: "0.75rem", fontWeight: 600 }}>
            Application error
          </h1>
          <p style={{ marginTop: "1rem", lineHeight: 1.6, color: "#4a4540" }}>
            Something broke outside a single page. Retry or return to the monitor — the catalog
            should still be reachable from other routes.
          </p>
          <div style={{ marginTop: "2rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "4px",
                background: "#6b1f2a",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                border: "1px solid #c9c2b8",
                color: "inherit",
                textDecoration: "none",
                fontSize: "0.875rem",
              }}
            >
              World monitor
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RunLiveUpdateButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  async function run() {
    setBusy(true);
    setResult("");
    try {
      const res = await fetch("/api/cron/live-update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ limit: 5, analyze: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pipeline failed");
      setResult(
        `Fetched ${data.result.fetched}, created ${data.result.created}, skipped ${data.result.skipped}, analyzed ${data.result.analyzed}`,
      );
      router.refresh();
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Pipeline failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-5">
      <h2 className="display text-xl">Live update worker</h2>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">
        Pull public RSS crime/forensic clusters, dedupe headlines, create draft
        dossiers, run analysis stubs, and queue them for moderation.
      </p>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="mt-4 rounded bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Running pipeline…" : "Run live update now"}
      </button>
      {result ? <p className="mt-3 text-sm text-[var(--muted)]">{result}</p> : null}
    </div>
  );
}

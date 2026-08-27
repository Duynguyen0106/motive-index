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
        `Fetched ${data.result.fetched}, created ${data.result.created}, skipped ${data.result.skipped}, analyzed ${data.result.analyzed}, narratives ${data.result.narrativesGenerated ?? 0}`,
      );
      router.refresh();
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Pipeline failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel p-5">
      <h2 className="display text-xl">Live update worker</h2>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">
        Pull public RSS crime/forensic clusters, dedupe headlines, generate documentary
        story drafts (LLM or template), run analysis stubs, and queue for moderation.
      </p>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="btn btn-primary mt-4"
      >
        {busy ? "Running pipeline…" : "Run live update now"}
      </button>
      {result ? <p className="mt-3 text-sm text-[var(--muted)]">{result}</p> : null}
    </div>
  );
}

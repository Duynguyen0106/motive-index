"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetchInit, readJsonResponse } from "@/lib/clientFetch";

type LiveUpdateResponse = {
  ok: boolean;
  error?: string;
  result?: {
    fetched: number;
    created: number;
    skipped: number;
    analyzed: number;
    narrativesGenerated: number;
    errors?: string[];
  };
};

export function RunLiveUpdateButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  async function run() {
    setBusy(true);
    setResult("");
    try {
      const res = await fetch("/api/admin/live-update", {
        ...adminFetchInit,
        method: "POST",
        body: JSON.stringify({ limit: 3, analyze: true, generateNarrative: true }),
      });
      const data = await readJsonResponse<LiveUpdateResponse>(res);
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Pipeline failed");
      }
      const r = data.result!;
      setResult(
        `Fetched ${r.fetched}, created ${r.created}, skipped ${r.skipped}, analyzed ${r.analyzed}, narratives ${r.narrativesGenerated ?? 0}.${r.errors?.length ? ` Warnings: ${r.errors.slice(0, 2).join("; ")}` : ""}`,
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
        story drafts (fast templates; use Regenerate story for LLM), run analysis stubs,
        and queue for moderation.
      </p>
      <button type="button" onClick={run} disabled={busy} className="btn btn-primary mt-4">
        {busy ? "Running pipeline…" : "Run live update now"}
      </button>
      {result ? <p className="mt-3 text-sm text-[var(--muted)]">{result}</p> : null}
    </div>
  );
}

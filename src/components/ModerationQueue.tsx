"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminFetchInit, readJsonResponse } from "@/lib/clientFetch";
import { getPublishReadiness } from "@/lib/moderationPublish";
import type { CrimeCase } from "@/lib/types";

export function ModerationQueue({ initial }: { initial: CrimeCase[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"ok" | "error">("ok");

  async function act(slug: string, action: "approve" | "reject") {
    setBusy(slug);
    setMessage("");
    try {
      const res = await fetch("/api/admin/moderate", {
        ...adminFetchInit,
        method: "POST",
        body: JSON.stringify({ slug, action }),
      });
      const data = await readJsonResponse<{ error?: string; case?: CrimeCase }>(res);
      if (!res.ok) throw new Error(data.error || "Action failed");
      setItems((prev) => prev.filter((c) => c.slug !== slug));
      setMessageTone("ok");
      setMessage(`${action}d: ${data.case?.name ?? slug}`);
      router.refresh();
    } catch (err) {
      setMessageTone("error");
      setMessage(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  async function regenerateStory(slug: string) {
    setBusy(`nar-${slug}`);
    setMessage("");
    try {
      const res = await fetch("/api/admin/generate-narrative", {
        ...adminFetchInit,
        method: "POST",
        body: JSON.stringify({ slug }),
      });
      const data = await readJsonResponse<{
        error?: string;
        case?: CrimeCase;
        provider?: string;
        chapterCount?: number;
      }>(res);
      if (!res.ok) throw new Error(data.error || "Generate failed");
      setItems((prev) =>
        prev.map((c) => (c.slug === slug ? (data.case as CrimeCase) : c)),
      );
      setMessageTone("ok");
      setMessage(
        `Story updated (${data.provider}, ${data.chapterCount} chapters) for ${slug}`,
      );
      router.refresh();
    } catch (err) {
      setMessageTone("error");
      setMessage(err instanceof Error ? err.message : "Generate failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {message ? (
        <p
          className={`mb-4 text-sm ${messageTone === "error" ? "text-[var(--maroon)]" : "text-[var(--accent)]"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
      <ul className="grid gap-4">
        {items.map((c) => {
          const readiness = getPublishReadiness(c);
          const refCount = (c.references ?? []).filter((r) => r.url || r.kind).length;
          return (
            <li key={c.id} className="panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-2xl">
                  <p className="label">
                    {c.analysis.status} · {c.tags.join(" · ")}
                  </p>
                  <h2 className="display mt-1 text-2xl">{c.name}</h2>
                  {c.narrative ? (
                    <p className="lede mt-3 text-base">{c.narrative.hook}</p>
                  ) : (
                    <p className="mt-2 text-sm text-[var(--ink-soft)] line-clamp-3">
                      {c.overview}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {c.narrative
                      ? `${c.narrative.chapters.length} story chapters · ${c.narrative.source ?? "unknown"} draft`
                      : "No narrative yet — regenerate story before publish"}
                    {c.narrative?.reviewNote ? ` · ${c.narrative.reviewNote}` : ""}
                    {" · "}
                    {refCount} reference{refCount === 1 ? "" : "s"}
                  </p>
                  {readiness.blockers.length || readiness.warnings.length ? (
                    <div className="mt-3 space-y-2 text-sm">
                      {readiness.blockers.map((b) => (
                        <p key={b} className="text-[var(--maroon)]">
                          Blocker: {b}
                        </p>
                      ))}
                      {readiness.warnings.map((w) => (
                        <p key={w} className="text-[var(--muted)]">
                          Note: {w}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[var(--accent)]">Ready for moderation review.</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <Link href={`/cases/${c.slug}?tab=story`} className="text-link">
                      Preview full story
                    </Link>
                    <Link href={`/cases/${c.slug}?tab=references`} className="text-link">
                      References
                    </Link>
                    <Link href={`/cases/${c.slug}`} className="text-[var(--muted)] hover:text-[var(--ink)]">
                      Open dossier
                    </Link>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => regenerateStory(c.slug)}
                    className="btn btn-ghost text-sm"
                  >
                    {busy === `nar-${c.slug}` ? "Generating…" : "Regenerate story"}
                  </button>
                  <button
                    type="button"
                    disabled={busy === c.slug || !readiness.ready}
                    title={!readiness.ready ? readiness.blockers.join(" ") : undefined}
                    onClick={() => act(c.slug, "approve")}
                    className="btn btn-primary text-sm disabled:opacity-50"
                  >
                    Approve & publish
                  </button>
                  <button
                    type="button"
                    disabled={busy === c.slug}
                    onClick={() => act(c.slug, "reject")}
                    className="btn btn-ghost text-sm text-[var(--maroon)]"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {!items.length ? (
        <p className="text-[var(--muted)]">Moderation queue is empty.</p>
      ) : null}
    </div>
  );
}

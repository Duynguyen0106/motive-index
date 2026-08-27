"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CrimeCase } from "@/lib/types";

export function ModerationQueue({ initial }: { initial: CrimeCase[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function act(slug: string, action: "approve" | "reject") {
    setBusy(slug);
    setMessage("");
    try {
      const res = await fetch("/api/admin/moderate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setItems((prev) => prev.filter((c) => c.slug !== slug));
      setMessage(`${action}d: ${data.case?.name ?? slug}`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {message ? (
        <p className="mb-4 text-sm text-[var(--accent)]">{message}</p>
      ) : null}
      <ul className="grid gap-4">
        {items.map((c) => (
          <li key={c.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.12em] text-[var(--accent)] uppercase">
                  {c.analysis.status} · {c.tags.join(" · ")}
                </p>
                <h2 className="display mt-1 text-2xl">{c.name}</h2>
                <p className="mt-2 text-sm text-[var(--ink-soft)] line-clamp-3">
                  {c.overview}
                </p>
                <Link
                  href={`/cases/${c.id}`}
                  className="mt-2 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
                >
                  Open dossier
                </Link>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy === c.slug}
                  onClick={() => act(c.slug, "approve")}
                  className="rounded bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Approve & publish
                </button>
                <button
                  type="button"
                  disabled={busy === c.slug}
                  onClick={() => act(c.slug, "reject")}
                  className="rounded border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--maroon)] disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {!items.length ? (
        <p className="text-[var(--muted)]">Moderation queue is empty.</p>
      ) : null}
    </div>
  );
}

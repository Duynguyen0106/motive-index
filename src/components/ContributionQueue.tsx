"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminFetchInit, readJsonResponse } from "@/lib/clientFetch";
import type { ContributionSubmission } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<ContributionSubmission["status"], string> = {
  pending: "Pending",
  in_review: "In review",
  accepted: "Accepted",
  rejected: "Rejected",
};

export function ContributionQueue({ initial }: { initial: ContributionSubmission[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"ok" | "error">("ok");

  async function act(id: string, action: "accept" | "reject" | "review") {
    setBusy(id);
    setMessage("");
    try {
      const res = await fetch("/api/admin/contributions", {
        ...adminFetchInit,
        method: "POST",
        body: JSON.stringify({ id, action }),
      });
      const data = await readJsonResponse<{ error?: string; contribution?: ContributionSubmission }>(
        res,
      );
      if (!res.ok) throw new Error(data.error || "Action failed");
      setItems((prev) =>
        action === "accept" || action === "reject"
          ? prev.filter((c) => c.id !== id)
          : prev.map((c) => (c.id === id ? (data.contribution as ContributionSubmission) : c)),
      );
      setMessageTone("ok");
      setMessage(`${action === "review" ? "Marked in review" : action + "ed"}: ${data.contribution?.title ?? id}`);
      router.refresh();
    } catch (err) {
      setMessageTone("error");
      setMessage(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  const actionable = items.filter((c) => c.status === "pending" || c.status === "in_review");

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
        {actionable.map((c) => (
          <li key={c.id} className="panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-2xl grow">
                <p className="label">
                  {c.kind} · {STATUS_LABELS[c.status]} · {formatDate(c.createdAt)}
                </p>
                <h2 className="display mt-1 text-xl">{c.title}</h2>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  {c.submitterName} ({c.submitterRole})
                </p>
                <p className="mt-3 text-sm text-[var(--ink-soft)] whitespace-pre-wrap">{c.summary}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {c.status === "pending" ? (
                  <button
                    type="button"
                    disabled={Boolean(busy)}
                    onClick={() => act(c.id, "review")}
                    className="btn btn-ghost text-sm"
                  >
                    Mark in review
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy === c.id}
                  onClick={() => act(c.id, "accept")}
                  className="btn btn-primary text-sm"
                >
                  Accept
                </button>
                <button
                  type="button"
                  disabled={busy === c.id}
                  onClick={() => act(c.id, "reject")}
                  className="btn btn-ghost text-sm text-[var(--maroon)]"
                >
                  Reject
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {!actionable.length ? (
        <p className="text-[var(--muted)]">No pending contributions.</p>
      ) : null}
    </div>
  );
}

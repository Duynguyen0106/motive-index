"use client";

import { FormEvent, useState } from "react";
import { adminFetchInit, readJsonResponse } from "@/lib/clientFetch";
import type { CaseReference } from "@/lib/types";

type RefKind = CaseReference["kind"];

export function AdminReferenceEditor({
  slug,
  references,
}: {
  slug: string;
  references: CaseReference[];
}) {
  const [items, setItems] = useState(references);
  const [citation, setCitation] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<RefKind>("media");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"ok" | "error">("ok");

  async function addReference(e: FormEvent) {
    e.preventDefault();
    setBusy("add");
    setMessage("");
    try {
      const res = await fetch("/api/admin/references", {
        ...adminFetchInit,
        method: "POST",
        body: JSON.stringify({ slug, citation, url, kind }),
      });
      const data = await readJsonResponse<{ error?: string; reference?: CaseReference }>(res);
      if (!res.ok) throw new Error(data.error || "Failed to add reference");
      setItems((prev) => [data.reference!, ...prev]);
      setCitation("");
      setUrl("");
      setMessageTone("ok");
      setMessage("Reference added.");
    } catch (err) {
      setMessageTone("error");
      setMessage(err instanceof Error ? err.message : "Failed to add reference");
    } finally {
      setBusy(null);
    }
  }

  async function removeReference(refId: string) {
    if (!window.confirm("Remove this reference from the dossier?")) return;
    setBusy(refId);
    setMessage("");
    try {
      const res = await fetch("/api/admin/references", {
        ...adminFetchInit,
        method: "DELETE",
        body: JSON.stringify({ slug, refId }),
      });
      const data = await readJsonResponse<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error || "Failed to remove reference");
      setItems((prev) => prev.filter((r) => r.id !== refId));
      setMessageTone("ok");
      setMessage("Reference removed.");
    } catch (err) {
      setMessageTone("error");
      setMessage(err instanceof Error ? err.message : "Failed to remove reference");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="card border border-[var(--accent)]/30 p-5">
      <h2 className="display text-lg">Admin: edit references</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Changes are logged and must pass provenance validation on published dossiers.
      </p>
      {message ? (
        <p
          className={`mt-3 text-sm ${messageTone === "error" ? "text-[var(--maroon)]" : "text-[var(--accent)]"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
      <ul className="mt-4 space-y-2">
        {items.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2 text-sm"
          >
            <span className="text-[var(--ink-soft)]">
              [{r.kind}] {r.citation}
              {r.url ? (
                <>
                  {" "}
                  <a href={r.url} className="text-link" target="_blank" rel="noopener noreferrer">
                    ↗
                  </a>
                </>
              ) : null}
            </span>
            <button
              type="button"
              className="btn btn-ghost text-xs text-[var(--maroon)]"
              disabled={Boolean(busy)}
              onClick={() => removeReference(r.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={addReference} className="mt-4 space-y-2">
        <input
          className="field w-full text-sm"
          placeholder="Citation"
          value={citation}
          onChange={(e) => setCitation(e.target.value)}
          required
          minLength={3}
        />
        <input
          className="field w-full text-sm"
          type="url"
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <select
            className="field text-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value as RefKind)}
          >
            <option value="court">court</option>
            <option value="report">report</option>
            <option value="media">media</option>
            <option value="book">book</option>
            <option value="journal">journal</option>
          </select>
          <button type="submit" className="btn btn-ghost text-sm" disabled={Boolean(busy)}>
            {busy === "add" ? "Saving…" : "Add reference"}
          </button>
        </div>
      </form>
    </section>
  );
}

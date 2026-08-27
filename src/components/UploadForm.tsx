"use client";

import { FormEvent, useMemo, useState } from "react";
import type { CrimeCase } from "@/lib/types";
import { DOCUMENT_TYPE_LABELS, type DocumentType } from "@/lib/types";

export function UploadForm({ cases }: { cases: Array<Pick<CrimeCase, "id" | "slug" | "name">> }) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const types = useMemo(
    () => Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[],
    [],
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("uploading");
    setMessage("");
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setStatus("done");
      setMessage(`Saved document ${json.document?.id ?? ""} (${json.storage ?? "local"})`);
      form.reset();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card grid max-w-2xl gap-4 p-6" encType="multipart/form-data">
      <label className="block text-sm">
        <span className="font-medium">Case</span>
        <select
          name="caseId"
          required
          className="mt-1 w-full rounded border border-[var(--line)] px-3 py-2"
          defaultValue=""
        >
          <option value="" disabled>
            Select a case
          </option>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.id})
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="font-medium">Title</span>
        <input
          name="title"
          required
          className="mt-1 w-full rounded border border-[var(--line)] px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Document type</span>
        <select
          name="type"
          required
          className="mt-1 w-full rounded border border-[var(--line)] px-3 py-2"
          defaultValue="newspaper"
        >
          {types.map((t) => (
            <option key={t} value={t}>
              {DOCUMENT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="font-medium">Summary</span>
        <textarea
          name="summary"
          required
          rows={3}
          className="mt-1 w-full rounded border border-[var(--line)] px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Psychological relevance</span>
        <textarea
          name="psychRelevance"
          required
          rows={2}
          className="mt-1 w-full rounded border border-[var(--line)] px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Content warning</span>
        <input
          name="contentWarning"
          required
          className="mt-1 w-full rounded border border-[var(--line)] px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">File</span>
        <input
          name="file"
          type="file"
          required
          className="mt-1 w-full text-sm"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="publicDomain" value="true" />
        Public domain / permission confirmed
      </label>
      <button
        type="submit"
        disabled={status === "uploading"}
        className="rounded bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {status === "uploading" ? "Uploading…" : "Upload to storage + documents table"}
      </button>
      {message ? (
        <p className={`text-sm ${status === "error" ? "text-[var(--maroon)]" : "text-[var(--accent)]"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}

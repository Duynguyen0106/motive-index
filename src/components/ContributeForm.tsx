"use client";

import { useState, type FormEvent } from "react";

export function ContributeForm() {
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contribute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: form.get("kind"),
          title: form.get("title"),
          submitterName: form.get("submitterName"),
          submitterRole: form.get("submitterRole"),
          summary: form.get("summary"),
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("done");
      setMessage("Submitted to the moderation queue.");
      e.currentTarget.reset();
    } catch {
      setStatus("error");
      setMessage("Could not submit. Try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card grid gap-4 p-6">
      <h2 className="display text-2xl">Submission form</h2>
      <label className="block text-sm">
        <span className="font-medium">Type</span>
        <select
          name="kind"
          required
          className="mt-1 w-full rounded border border-[var(--line)] px-3 py-2"
        >
          <option value="case">New case</option>
          <option value="analysis">Analysis / commentary</option>
          <option value="document">Document pointer</option>
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
        <span className="font-medium">Your name</span>
        <input
          name="submitterName"
          required
          className="mt-1 w-full rounded border border-[var(--line)] px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Role</span>
        <input
          name="submitterRole"
          required
          placeholder="e.g. Graduate student — forensic psychology"
          className="mt-1 w-full rounded border border-[var(--line)] px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Summary & sources</span>
        <textarea
          name="summary"
          required
          rows={5}
          className="mt-1 w-full rounded border border-[var(--line)] px-3 py-2"
          placeholder="What are you proposing? List public sources. No graphic detail."
        />
      </label>
      <button
        type="submit"
        disabled={status === "saving"}
        className="rounded bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {status === "saving" ? "Submitting…" : "Submit for review"}
      </button>
      {message ? (
        <p
          className={`text-sm ${status === "error" ? "text-[var(--maroon)]" : "text-[var(--accent)]"}`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}

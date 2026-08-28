"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function ContributeForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    setMessage("");
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
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Could not submit. Check required fields and try again.");
        return;
      }
      setStatus("done");
      setMessage("Submitted — pending integrity review by the AI pipeline.");
      e.currentTarget.reset();
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Could not submit. Check your connection and try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card grid gap-4 p-6">
      <h2 className="display text-2xl">Submission form</h2>
      <p className="text-sm text-[var(--muted)]">
        Open to researchers and students. Submissions are reviewed before publication — no account
        required in this MVP.
      </p>
      <label className="block text-sm">
        <span className="font-medium">Type</span>
        <select name="kind" required className="field mt-1">
          <option value="case">New case</option>
          <option value="analysis">Analysis / commentary</option>
          <option value="document">Document pointer</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="font-medium">Title</span>
        <input name="title" required minLength={3} className="field mt-1" />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Your name</span>
        <input name="submitterName" required minLength={2} className="field mt-1" />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Role</span>
        <input
          name="submitterRole"
          required
          minLength={2}
          placeholder="e.g. Graduate student — forensic psychology"
          className="field mt-1"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium">Summary & sources</span>
        <textarea
          name="summary"
          required
          minLength={10}
          rows={5}
          className="field mt-1"
          placeholder="What are you proposing? List public sources. No graphic detail."
        />
      </label>
      <button type="submit" disabled={status === "saving"} className="btn btn-primary">
        {status === "saving" ? "Submitting…" : "Submit for review"}
      </button>
      {message ? (
        <p
          className={`text-sm ${status === "error" ? "text-[var(--maroon)]" : "text-[var(--accent)]"}`}
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}

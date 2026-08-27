"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetchInit, readJsonResponse } from "@/lib/clientFetch";
import { CRIME_CATEGORY_LABELS, type CrimeCategory } from "@/lib/types";

type Extracted = {
  name: string;
  subtitle: string;
  jurisdiction: string;
  location: string;
  yearStart?: number;
  yearEnd?: number | null;
  status: "closed" | "unsolved" | "historical";
  crimeCategories: string[];
  overview: string;
  warning: string;
  offenderName?: string;
  motivationalFactors?: string[];
  psychologicalFactors?: string[];
};

const empty: Extracted = {
  name: "",
  subtitle: "",
  jurisdiction: "",
  location: "",
  yearStart: undefined,
  yearEnd: null,
  status: "closed",
  crimeCategories: ["other"],
  overview: "",
  warning: "",
};

export function CaseCreateForm() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [form, setForm] = useState<Extracted>(empty);
  const [extractNote, setExtractNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function runExtract() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/extract", {
        ...adminFetchInit,
        method: "POST",
        body: JSON.stringify({ rawText }),
      });
      const data = await readJsonResponse<{
        error?: string;
        extracted?: Extracted;
        provider?: string;
        note?: string;
      }>(res);
      if (!res.ok) throw new Error(data.error || "Extract failed");
      setForm({ ...empty, ...data.extracted! });
      setExtractNote(
        `${data.provider}${data.note ? ` — ${data.note}` : ""}`,
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Extract failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/cases", {
        ...adminFetchInit,
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await readJsonResponse<{ error?: string; case?: { id: string } }>(res);
      if (!res.ok) throw new Error(data.error || "Create failed");
      router.push(`/cases/${data.case!.id}`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Create failed");
      setBusy(false);
    }
  }

  function setField<K extends keyof Extracted>(key: K, value: Extracted[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card p-6">
        <h2 className="display text-2xl">1. Extract from raw text</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Paste public-source notes. OpenAI structures fields when{" "}
          <code>OPENAI_API_KEY</code> is set; otherwise a heuristic extractor runs.
        </p>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={14}
          className="mt-4 w-full rounded border border-[var(--line)] px-3 py-2 text-sm"
          placeholder="Paste educational public-source case text here (min ~40 characters)…"
        />
        <button
          type="button"
          disabled={busy || rawText.trim().length < 40}
          onClick={runExtract}
          className="mt-3 rounded bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Working…" : "Extract structured data"}
        </button>
        {extractNote ? (
          <p className="mt-2 text-xs text-[var(--muted)]">{extractNote}</p>
        ) : null}
      </section>

      <form onSubmit={onSubmit} className="card space-y-3 p-6">
        <h2 className="display text-2xl">2. Review & create case</h2>
        {(
          [
            ["name", "Name"],
            ["subtitle", "Subtitle"],
            ["jurisdiction", "Jurisdiction"],
            ["location", "Location"],
            ["warning", "Content warning"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm">
            <span className="font-medium">{label}</span>
            <input
              value={String(form[key] ?? "")}
              onChange={(e) => setField(key, e.target.value)}
              required={key === "name"}
              className="mt-1 w-full rounded border border-[var(--line)] px-3 py-2"
            />
          </label>
        ))}
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="font-medium">Year start</span>
            <input
              type="number"
              value={form.yearStart ?? ""}
              onChange={(e) =>
                setField("yearStart", e.target.value ? Number(e.target.value) : undefined)
              }
              className="mt-1 w-full rounded border border-[var(--line)] px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Status</span>
            <select
              value={form.status}
              onChange={(e) =>
                setField("status", e.target.value as Extracted["status"])
              }
              className="mt-1 w-full rounded border border-[var(--line)] px-3 py-2"
            >
              <option value="closed">closed</option>
              <option value="unsolved">unsolved</option>
              <option value="historical">historical</option>
            </select>
          </label>
        </div>
        <label className="block text-sm">
          <span className="font-medium">Crime categories</span>
          <select
            multiple
            value={form.crimeCategories}
            onChange={(e) =>
              setField(
                "crimeCategories",
                Array.from(e.target.selectedOptions).map((o) => o.value),
              )
            }
            className="mt-1 h-28 w-full rounded border border-[var(--line)] px-3 py-2"
          >
            {(Object.keys(CRIME_CATEGORY_LABELS) as CrimeCategory[]).map((k) => (
              <option key={k} value={k}>
                {CRIME_CATEGORY_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">Overview</span>
          <textarea
            value={form.overview}
            onChange={(e) => setField("overview", e.target.value)}
            rows={6}
            required
            className="mt-1 w-full rounded border border-[var(--line)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Offender name (optional)</span>
          <input
            value={form.offenderName ?? ""}
            onChange={(e) => setField("offenderName", e.target.value)}
            className="mt-1 w-full rounded border border-[var(--line)] px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !form.name || !form.overview}
          className="rounded bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          Create case
        </button>
        {message ? <p className="text-sm text-[var(--maroon)]">{message}</p> : null}
        <Link href="/admin/upload" className="block text-sm text-[var(--accent)] hover:underline">
          Or upload a document →
        </Link>
      </form>
    </div>
  );
}

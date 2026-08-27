import type { Metadata } from "next";
import { ContributeForm } from "@/components/ContributeForm";
import { getContributions } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contribute",
  description: "Submit cases, analyses, or documents for moderation and peer review.",
};

export default function ContributePage() {
  const queue = getContributions();

  return (
    <div className="site-shell py-12 md:py-14">
      <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
        Contribute
      </p>
      <h1 className="display mt-3 text-4xl md:text-5xl">
        User contributions & peer review
      </h1>
      <p className="body-copy mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
        Registered students and researchers can propose new cases, analyses, or
        document pointers. Everything enters a moderation queue before
        publication.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <ContributeForm />
        <section>
          <h2 className="display text-2xl">Moderation queue</h2>
          <ul className="mt-4 space-y-3">
            {queue.map((s) => (
              <li key={s.id} className="card p-4">
                <p className="text-xs font-semibold tracking-[0.12em] text-[var(--accent)] uppercase">
                  {s.kind} · {s.status.replaceAll("_", " ")}
                </p>
                <h3 className="mt-1 font-semibold text-[var(--ink)]">{s.title}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {s.submitterName} ({s.submitterRole}) · {formatDate(s.createdAt)}
                </p>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">{s.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

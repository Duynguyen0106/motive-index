import type { Metadata } from "next";
import { Disclaimer } from "@/components/Disclaimer";

export const metadata: Metadata = {
  title: "Method",
  description:
    "How Motive Index turns public behavioral evidence into forensic psychological hypotheses.",
};

const dimensions = [
  ["Planning", "Premeditation, staging, mobility, adaptive problem-solving"],
  ["Affect", "Emotional display or flatness in public record"],
  ["Empathy / remorse", "Victim-centered vs self-protective conduct and statements"],
  ["Control & dominance", "Coercion, terror theater, narrative ownership"],
  ["Reality testing", "Ideological encapsulation vs organized instrumental goals"],
  ["Social functioning", "Charm, isolation, double life, group influence"],
  ["Situational stressors", "Loss, status threat, marginalization as context"],
  ["Pattern consistency", "Stability of scripts across time and settings"],
];

export default function MethodPage() {
  return (
    <div className="site-shell py-12 md:py-14">
      <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
        Method
      </p>
      <h1 className="display mt-3 max-w-3xl text-4xl text-[var(--ink)] md:text-5xl">
        Behavior first. Labels last.
      </h1>
      <p className="body-copy mt-5 max-w-2xl text-lg text-[var(--ink-soft)] md:text-xl">
        Motive Index does not diagnose people from headlines. It extracts
        observable public signals, scores them on a fixed forensic rubric, and
        forces competing explanations into the open.
      </p>

      <section className="mt-12">
        <h2 className="display text-3xl text-[var(--ink)]">Pipeline</h2>
        <ol className="mt-5 grid gap-3">
          {[
            [
              "01 — Ingest",
              "Public news clusters, court summaries, and curated historical sources enter as raw items.",
            ],
            [
              "02 — Dedupe & structure",
              "Same case across outlets becomes one dossier with a chronological event list.",
            ],
            [
              "03 — Signal extract",
              "Behavioral claims are stored with source linkage—no free-floating motive talk.",
            ],
            [
              "04 — Rubric analysis",
              "AI (or deterministic draft mode) fills constructs with evidence, counter-evidence, and confidence.",
            ],
            [
              "05 — Human review",
              "Featured dossiers publish only after review. Drafts stay labeled.",
            ],
          ].map(([title, body]) => (
            <li key={title} className="card p-5 md:grid md:grid-cols-[220px_1fr] md:gap-8 md:p-6">
              <h3 className="display text-xl text-[var(--ink)]">{title}</h3>
              <p className="body-copy mt-2 text-[var(--ink-soft)] md:mt-0 md:text-lg">
                {body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="display text-3xl text-[var(--ink)]">Rubric dimensions</h2>
        <ul className="card mt-5 divide-y divide-[var(--line)] overflow-hidden">
          {dimensions.map(([name, desc]) => (
            <li
              key={name}
              className="grid gap-1 px-5 py-4 md:grid-cols-[240px_1fr] md:items-baseline md:gap-8 md:px-6"
            >
              <span className="font-semibold text-[var(--ink)]">{name}</span>
              <span className="body-copy text-[var(--ink-soft)]">{desc}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 space-y-5">
        <h2 className="display text-3xl text-[var(--ink)]">Hard rules</h2>
        <div className="card p-6">
          <ul className="body-copy space-y-3 text-[var(--ink-soft)] md:text-lg">
            <li>No clinical certainty language about living persons.</li>
            <li>No graphic operational detail that could instruct harm.</li>
            <li>Every published construct needs evidence and counter-evidence.</li>
            <li>Every dossier includes “what we cannot know.”</li>
            <li>Victim dignity over spectacle.</li>
          </ul>
        </div>
        <Disclaimer />
      </section>
    </div>
  );
}

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
    <div className="site-shell py-12 md:py-16">
      <p className="text-xs font-semibold tracking-[0.2em] text-[var(--accent)] uppercase">
        Method
      </p>
      <h1 className="display mt-3 max-w-3xl text-5xl md:text-6xl">
        Behavior first. Labels last.
      </h1>
      <p className="serif mt-6 max-w-2xl text-xl leading-relaxed text-[var(--ink-soft)]">
        Motive Index does not diagnose people from headlines. It extracts
        observable public signals, scores them on a fixed forensic rubric, and
        forces competing explanations into the open.
      </p>

      <section className="mt-16 border-t border-[var(--line)] pt-12">
        <h2 className="display text-3xl md:text-4xl">Pipeline</h2>
        <ol className="mt-8 space-y-8">
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
            <li key={title} className="grid gap-2 md:grid-cols-[220px_1fr] md:gap-10">
              <h3 className="display text-2xl">{title}</h3>
              <p className="serif text-lg text-[var(--ink-soft)]">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 border-t border-[var(--line)] pt-12">
        <h2 className="display text-3xl md:text-4xl">Rubric dimensions</h2>
        <ul className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {dimensions.map(([name, desc]) => (
            <li
              key={name}
              className="grid gap-2 py-5 md:grid-cols-[240px_1fr] md:items-baseline"
            >
              <span className="font-semibold tracking-tight">{name}</span>
              <span className="serif text-[var(--ink-soft)]">{desc}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16 border-t border-[var(--line)] pt-12">
        <h2 className="display text-3xl md:text-4xl">Hard rules</h2>
        <ul className="mt-6 space-y-3 serif text-lg text-[var(--ink-soft)]">
          <li>No clinical certainty language about living persons.</li>
          <li>No graphic operational detail that could instruct harm.</li>
          <li>Every published construct needs evidence and counter-evidence.</li>
          <li>Every dossier includes “what we cannot know.”</li>
          <li>Victim dignity over spectacle.</li>
        </ul>
        <div className="mt-10">
          <Disclaimer />
        </div>
      </section>
    </div>
  );
}

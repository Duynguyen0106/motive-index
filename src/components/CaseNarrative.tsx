import type { CaseNarrative, DossierChapter } from "@/lib/types";

const CHAPTER_ORDER: DossierChapter["id"][] = [
  "origins",
  "formation",
  "escalation",
  "method",
  "motivation",
  "investigation",
  "aftermath",
];

function chapterNavLabel(id: DossierChapter["id"]): string {
  const labels: Record<DossierChapter["id"], string> = {
    origins: "Origins",
    formation: "Formation",
    escalation: "Escalation",
    method: "How it unfolded",
    motivation: "Motives",
    investigation: "Investigation",
    aftermath: "Aftermath",
  };
  return labels[id];
}

function ChapterBlock({ chapter }: { chapter: DossierChapter }) {
  return (
    <section id={`chapter-${chapter.id}`} className="scroll-mt-28 border-b border-[var(--line)] py-10 last:border-b-0">
      <div className="grid gap-8 lg:grid-cols-[10rem_1fr]">
        <div>
          <p className="label">{chapterNavLabel(chapter.id)}</p>
          {chapter.period ? (
            <p className="mt-2 text-sm tabular-nums text-[var(--muted)]">{chapter.period}</p>
          ) : null}
        </div>
        <div>
          <h2 className="display text-2xl text-[var(--ink)] md:text-3xl">{chapter.title}</h2>
          {chapter.lead ? (
            <p className="lede mt-4 text-[1.25rem] leading-relaxed text-[var(--ink)]">{chapter.lead}</p>
          ) : null}
          <div className="body-copy mt-5 space-y-4 text-[var(--ink-soft)] md:text-[1.0625rem]">
            {chapter.paragraphs.map((p, i) => (
              <p
                key={i}
                className={p.startsWith("[Translation") ? "rounded border border-[var(--line)] bg-[var(--bg-subtle)] px-3 py-2 text-sm italic" : undefined}
              >
                {p}
              </p>
            ))}
          </div>
          {chapter.psychNote ? (
            <aside className="note mt-6 text-sm">
              <p className="label mb-2">Forensic note</p>
              <p className="text-[var(--ink-soft)]">{chapter.psychNote}</p>
            </aside>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function CaseNarrativeView({
  narrative,
  isDraft,
}: {
  narrative: CaseNarrative;
  isDraft?: boolean;
}) {
  const chapters = CHAPTER_ORDER.map((id) => narrative.chapters.find((c) => c.id === id)).filter(
    Boolean,
  ) as DossierChapter[];

  return (
    <div className="grid gap-10 lg:grid-cols-[11rem_1fr]">
      {isDraft ? (
        <div className="note-warn note lg:col-span-2 text-sm">
          <p className="label mb-1">Draft narrative — not published</p>
          <p className="text-[var(--ink-soft)]">
            {narrative.reviewNote ??
              "This story was auto-generated from public sources. Editors must verify facts before approval."}
            {narrative.source ? ` Source: ${narrative.source}.` : ""}
            {narrative.generatedAt
              ? ` Generated ${new Date(narrative.generatedAt).toLocaleString()}.`
              : ""}
          </p>
        </div>
      ) : narrative.reviewNote ? (
        <div className="note lg:col-span-2 text-sm">
          <p className="label mb-1">Dossier provenance</p>
          <p className="text-[var(--ink-soft)]">{narrative.reviewNote}</p>
        </div>
      ) : null}
      <nav className="story-chapter-nav lg:hidden" aria-label="Story chapters">
        <p className="label mb-2">Jump to section</p>
        <div className="story-chapter-scroll">
          {chapters.map((c) => (
            <a key={c.id} href={`#chapter-${c.id}`} className="story-chapter-pill">
              {chapterNavLabel(c.id)}
            </a>
          ))}
        </div>
      </nav>
      <nav className="hidden lg:block" aria-label="Story chapters">
        <p className="label mb-3">In this dossier</p>
        <ol className="space-y-2 text-sm">
          {chapters.map((c) => (
            <li key={c.id}>
              <a href={`#chapter-${c.id}`} className="text-link">
                {chapterNavLabel(c.id)}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div>
        <p className="lede text-[1.35rem] text-[var(--ink)]">{narrative.hook}</p>
        <hr className="rule mt-8" />
        {chapters.map((c) => (
          <ChapterBlock key={c.id} chapter={c} />
        ))}
      </div>
    </div>
  );
}

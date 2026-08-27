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
              <p key={i}>{p}</p>
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

export function CaseNarrativeView({ narrative }: { narrative: CaseNarrative }) {
  const chapters = CHAPTER_ORDER.map((id) => narrative.chapters.find((c) => c.id === id)).filter(
    Boolean,
  ) as DossierChapter[];

  return (
    <div className="grid gap-10 lg:grid-cols-[11rem_1fr]">
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

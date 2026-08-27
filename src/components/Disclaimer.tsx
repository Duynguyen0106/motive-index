export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={`note ${compact ? "text-sm" : ""}`} aria-label="Scope disclaimer">
      <p className="label mb-2">Scope &amp; limits</p>
      <p className={`body-copy text-[var(--ink-soft)] ${compact ? "text-sm" : ""}`}>
        Educational forensic-behavioral analysis drawn from public records. Not
        clinical diagnosis, legal advice, or a verdict on any living person.
        Hypotheses cite sources and remain open to revision.
      </p>
    </aside>
  );
}

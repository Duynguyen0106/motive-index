export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`card border-l-4 border-l-[var(--accent)] px-5 py-4 ${compact ? "" : ""}`}>
      <p
        className={`body-copy text-[var(--muted)] ${compact ? "text-sm" : "text-base"}`}
      >
        Educational forensic-behavioral analysis of public records. Not clinical
        diagnosis, legal advice, or a verdict on any living person. Hypotheses
        require citations and stay open to competing explanations.
      </p>
    </div>
  );
}

export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <p
      className={`serif text-[var(--muted)] ${compact ? "text-sm" : "text-base"} leading-relaxed`}
    >
      Educational forensic-behavioral analysis of public records. Not clinical
      diagnosis, legal advice, or a verdict on any living person. Hypotheses
      require citations and stay open to competing explanations.
    </p>
  );
}

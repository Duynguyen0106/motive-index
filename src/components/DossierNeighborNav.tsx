import Link from "next/link";

type Neighbor = { slug: string; name: string };

export function DossierNeighborNav({
  prev,
  next,
  tab,
}: {
  prev?: Neighbor;
  next?: Neighbor;
  tab?: string;
}) {
  if (!prev && !next) return null;

  const tabQs = tab ? `?tab=${encodeURIComponent(tab)}` : "";

  return (
    <nav
      className="dossier-neighbor-nav mt-10 flex flex-wrap items-stretch justify-between gap-3 border-t border-[var(--line)] pt-8"
      aria-label="Adjacent dossiers"
    >
      {prev ? (
        <Link
          href={`/cases/${prev.slug}${tabQs}`}
          className="dossier-neighbor-link card card-hover flex min-w-0 flex-1 flex-col p-4 md:max-w-[48%]"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            ← Previous
          </span>
          <span className="mt-1 truncate font-medium text-[var(--ink)]">{prev.name}</span>
        </Link>
      ) : (
        <span className="hidden flex-1 md:block" aria-hidden />
      )}
      {next ? (
        <Link
          href={`/cases/${next.slug}${tabQs}`}
          className="dossier-neighbor-link card card-hover flex min-w-0 flex-1 flex-col p-4 text-right md:max-w-[48%]"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            Next →
          </span>
          <span className="mt-1 truncate font-medium text-[var(--ink)]">{next.name}</span>
        </Link>
      ) : null}
    </nav>
  );
}

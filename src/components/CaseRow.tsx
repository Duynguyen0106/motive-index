import Link from "next/link";
import type { CrimeCase } from "@/lib/types";

export function CaseRow({ crimeCase }: { crimeCase: CrimeCase }) {
  return (
    <Link
      href={`/cases/${crimeCase.slug}`}
      className="card card-hover group grid gap-2 p-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_auto] md:items-end md:gap-8 md:p-6"
    >
      <div>
        <p className="text-xs font-medium tracking-[0.14em] text-[var(--muted)] uppercase">
          {crimeCase.era} · {crimeCase.status}
        </p>
        <h3 className="display mt-2 text-2xl text-[var(--ink)] transition-colors group-hover:text-[var(--accent)] md:text-3xl">
          {crimeCase.name}
        </h3>
      </div>
      <p className="body-copy text-[var(--ink-soft)] md:pb-1">{crimeCase.subtitle}</p>
      <p className="text-sm text-[var(--muted)] md:justify-self-end md:pb-1">
        {crimeCase.analysis.status === "published"
          ? `${crimeCase.analysis.constructs.length} constructs`
          : crimeCase.analysis.status}
      </p>
    </Link>
  );
}

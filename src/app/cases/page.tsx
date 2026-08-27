import type { Metadata } from "next";
import { CaseRow } from "@/components/CaseRow";
import { getAllCases } from "@/lib/data";

export const metadata: Metadata = {
  title: "Archive",
  description: "Browse forensic psychological case dossiers.",
};

export default function CasesPage() {
  const cases = getAllCases();

  return (
    <div className="site-shell py-12 md:py-14">
      <p className="text-xs font-semibold tracking-[0.16em] text-[var(--accent)] uppercase">
        Archive
      </p>
      <h1 className="display mt-3 text-4xl text-[var(--ink)] md:text-5xl">
        Case dossiers
      </h1>
      <p className="body-copy mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
        Each dossier maps public behavioral signals to psychological constructs
        with confidence scores, counter-evidence, and explicit unknowns.
      </p>
      <div className="mt-8 grid gap-3">
        {cases.map((c) => (
          <CaseRow key={c.id} crimeCase={c} />
        ))}
      </div>
    </div>
  );
}

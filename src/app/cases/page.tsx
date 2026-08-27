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
    <div className="site-shell py-12 md:py-16">
      <p className="text-xs font-semibold tracking-[0.2em] text-[var(--accent)] uppercase">
        Archive
      </p>
      <h1 className="display mt-3 text-5xl md:text-6xl">Case dossiers</h1>
      <p className="serif mt-4 max-w-2xl text-lg text-[var(--ink-soft)]">
        Each dossier maps public behavioral signals to psychological constructs
        with confidence scores, counter-evidence, and explicit unknowns.
      </p>
      <div className="mt-10">
        {cases.map((c) => (
          <CaseRow key={c.id} crimeCase={c} />
        ))}
      </div>
    </div>
  );
}

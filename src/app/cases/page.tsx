import type { Metadata } from "next";
import { CaseRow } from "@/components/CaseRow";
import { PageHeader } from "@/components/PageHeader";
import { getAllCases } from "@/lib/data";

export const metadata: Metadata = {
  title: "Archive",
  description: "Browse forensic psychological case dossiers.",
};

export default function CasesPage() {
  const cases = getAllCases();

  return (
    <div className="py-12 md:py-14">
      <PageHeader
        label="Archive"
        title="Case dossiers"
        description="Each record maps public behavioral signals to psychological constructs—with confidence notes, counter-evidence, and explicit unknowns."
      />
      <div className="site-shell mt-8">
        <div className="index-table">
          <div className="index-head">
            <span>Year</span>
            <span>Case</span>
            <span className="text-right">Type</span>
          </div>
          {cases.map((c) => (
            <CaseRow key={c.id} crimeCase={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

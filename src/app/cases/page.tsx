import type { Metadata } from "next";
import { CasesGrid } from "@/components/CasesGrid";
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
        <CasesGrid cases={cases} />
      </div>
    </div>
  );
}

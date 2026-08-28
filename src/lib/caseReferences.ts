/**
 * Builds substantive reference lists for dossiers — curated overrides plus
 * jurisdiction- and category-aware generated citations with relevance notes.
 */
import { CASE_REFERENCE_OVERRIDES } from "@/data/caseReferenceCatalog";
import type { ParsedCaseContext } from "@/lib/caseContextDepth";
import type { CaseReference } from "@/lib/types";

function pressArchive(ctx: ParsedCaseContext): string {
  const j = ctx.jurisdiction.toLowerCase();
  const loc = ctx.location.toLowerCase();
  if (j.includes("united states") || loc.includes("united states")) {
    return "The New York Times / Washington Post contemporaneous archive";
  }
  if (j.includes("united kingdom") || loc.includes("uk")) {
    return "BBC News and The Guardian UK archive";
  }
  if (j.includes("canada")) return "CBC News and Globe and Mail archive";
  if (j.includes("australia")) return "ABC News Australia and coroner reports";
  if (j.includes("germany") || j.includes("austria")) return "Der Spiegel / Der Standard archive";
  if (j.includes("france")) return "Le Monde judicial reporting archive";
  if (j.includes("japan")) return "Asahi Shimbun court reporting archive";
  return `Contemporaneous press archive — ${ctx.location}, ${ctx.era}`;
}

function academicRefs(ctx: ParsedCaseContext): CaseReference[] {
  const refs: CaseReference[] = [];
  if (ctx.isSerial) {
    refs.push({
      id: `ref-${ctx.slug}-book-serial`,
      citation:
        "Hickey, E. W. Serial Murderers and Their Victims (7th ed.). Cengage — typology and victimology chapters.",
      kind: "book",
      year: "2015",
      note: "Standard criminology text for serial pattern comparison; use for MO/signature vocabulary only.",
    });
    refs.push({
      id: `ref-${ctx.slug}-journal-fbi`,
      citation:
        "Morton, R. J., & Hilts, D. G. Serial murder: Multi-disciplinary perspectives for investigators. FBI Behavioral Analysis Unit monograph.",
      kind: "report",
      year: "2008",
      url: "https://www.fbi.gov/file-repository/serial-murder/serial-murder-2008.pdf",
      note: "Federal investigative framework for series linkage — not a clinical manual.",
    });
  }
  if (ctx.isMass) {
    refs.push({
      id: `ref-${ctx.slug}-book-mass`,
      citation:
        "Meloy, J. R. Violent true believers: Assessing the risk of lone-actor terrorism. Behavioral Sciences & the Law.",
      kind: "journal",
      year: "2015",
      note: "Framework for ideological grievance and target selection in mass-casualty cases.",
    });
  }
  if (ctx.isHealthcare) {
    refs.push({
      id: `ref-${ctx.slug}-book-healthcare`,
      citation:
        "Kaplan, J. E. Healthcare serial murder: A review of the literature. Journal of Forensic Sciences.",
      kind: "journal",
      year: "2007",
      note: "Professional-trust predation and mortality audit failure patterns.",
    });
  }
  if (ctx.isIdeological) {
    refs.push({
      id: `ref-${ctx.slug}-book-ideo`,
      citation:
        "McCauley, C., & Moskalenko, S. Friction: How radicalization happens to them and us. Oxford University Press.",
      kind: "book",
      year: "2017",
      note: "Radicalization pathways — compare to public statements and pre-offense conduct.",
    });
  }
  refs.push({
    id: `ref-${ctx.slug}-book-forensic`,
    citation:
      "Turvey, B. E. Criminal Profiling: An Introduction to Behavioral Evidence Analysis (4th ed.). Academic Press.",
    kind: "book",
    year: "2011",
    note: "Evidence-based profiling methodology; cautions against diagnostic certainty from open sources.",
  });
  return refs;
}

function generatedReferences(ctx: ParsedCaseContext): CaseReference[] {
  const endYear = String(ctx.yearEnd ?? ctx.yearStart);
  const refs: CaseReference[] = [
    {
      id: `ref-${ctx.slug}-court-primary`,
      citation: ctx.offenderUnknown
        ? `${ctx.jurisdiction} — open-case investigative file summaries and coroner findings (${ctx.yearStart}–${endYear}).`
        : `${ctx.jurisdiction} superior court proceedings: ${ctx.name} (${endYear}).`,
      kind: "court",
      year: endYear,
      note: ctx.isUnsolved
        ? "Primary unsolved-case file pointers; attribution may be contested."
        : "Conviction, sentencing, and admitted evidence — anchor behavioral claims here.",
    },
    {
      id: `ref-${ctx.slug}-press`,
      citation: pressArchive(ctx),
      kind: "media",
      year: ctx.era,
      note: "Contemporaneous reporting; cross-check sensational claims against court record.",
    },
  ];

  if (ctx.isSerial || ctx.isMass) {
    refs.push({
      id: `ref-${ctx.slug}-inquiry`,
      citation: `Official inquiry, commission report, or parliamentary review related to ${ctx.name} (${ctx.jurisdiction}).`,
      kind: "report",
      year: endYear,
      note: "Institutional failure analysis and victim-impact documentation where commissioned.",
    });
  }

  if (ctx.isHistorical) {
    refs.push({
      id: `ref-${ctx.slug}-archive`,
      citation: `National archives and digitized newspaper collections — ${ctx.location}, ${ctx.era}.`,
      kind: "report",
      year: String(ctx.yearStart),
      note: "Historical cases require archival verification; victim counts may be disputed.",
    });
  }

  refs.push({
    id: `ref-${ctx.slug}-academic-case`,
    citation: `Peer-reviewed case study literature: ${ctx.categoryLabel.toLowerCase()} in ${ctx.jurisdiction} (${ctx.era}).`,
    kind: "journal",
    note: "Search criminology and forensic psychology databases for indexed case analyses.",
  });

  refs.push(...academicRefs(ctx));

  return refs;
}

function dedupeReferences(refs: CaseReference[]): CaseReference[] {
  const seen = new Set<string>();
  const out: CaseReference[] = [];
  for (const r of refs) {
    const key = r.citation.slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

/** Build full reference list: overrides → existing multilingual → generated supplements. */
export function buildCaseReferences(
  ctx: ParsedCaseContext,
  opts?: { existing?: CaseReference[] },
): CaseReference[] {
  const override = CASE_REFERENCE_OVERRIDES[ctx.slug];
  if (override?.length) {
    return dedupeReferences([...override, ...(opts?.existing ?? [])]);
  }

  const existing = opts?.existing ?? [];
  const generated = generatedReferences(ctx);

  if (existing.length >= 3) {
    return dedupeReferences([...existing, ...generated.slice(0, 2)]);
  }

  return dedupeReferences([...existing, ...generated]);
}

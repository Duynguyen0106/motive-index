import type { CrimeCase } from "@/lib/types";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectTerms(c: CrimeCase): string[] {
  const terms = new Set<string>();
  for (const raw of [c.name, c.nameOriginal, ...(c.aliases ?? [])]) {
    if (!raw) continue;
    const n = normalize(raw);
    if (n.length >= 4) terms.add(n);
    const parts = n.split(" ").filter((p) => p.length >= 5);
    if (parts.length >= 2) terms.add(parts[parts.length - 1]!);
  }
  return [...terms];
}

/** Match RSS headlines to archive dossiers by name / alias overlap. */
export function matchCaseSlugFromText(text: string, cases: CrimeCase[]): string | undefined {
  const hay = normalize(text);
  if (hay.length < 4) return undefined;

  let best: { slug: string; score: number } | undefined;

  for (const c of cases) {
    for (const term of collectTerms(c)) {
      if (!hay.includes(term)) continue;
      const score = term.includes(" ") ? term.length + 20 : term.length;
      if (!best || score > best.score) {
        best = { slug: c.slug, score };
      }
    }
  }

  return best?.score && best.score >= 6 ? best.slug : undefined;
}

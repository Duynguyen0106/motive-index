/**
 * Deep dossier registry — lazy narratives, timelines, and enrichment patches
 * for world and multilingual catalog cases.
 */
import { MULTILINGUAL_CASE_DEFS } from "@/data/multilingualCases";
import { ALL_WORLD_CASE_DEFS } from "@/data/worldCases";
import {
  buildMultilingualDeep,
  buildWorldDeep,
  type DeepCaseBundle,
} from "@/lib/deepContentBuilder";
import type { CaseNarrative } from "@/lib/types";

function defToMultilingualInput(d: (typeof MULTILINGUAL_CASE_DEFS)[number]) {
  return {
    slug: d.slug,
    name: d.name,
    subtitle: d.subtitle,
    overview: d.overview,
    jurisdiction: d.jurisdiction,
    location: d.location,
    era: d.era,
    yearStart: d.yearStart,
    yearEnd: d.yearEnd,
    status: d.status,
    crimeCategories: d.crimeCategories,
    offenderName: d.offenderName,
    offenderBackground: d.offenderNameOriginal
      ? `Documented in ${d.primarySourceLanguageLabel} press and court files as ${d.offenderNameOriginal}.`
      : undefined,
    nameOriginal: d.nameOriginal,
    offenderNameOriginal: d.offenderNameOriginal,
    primarySourceLanguage: d.primarySourceLanguage,
    primarySourceLanguageLabel: d.primarySourceLanguageLabel,
    translationNote: d.translationNote,
    sourceTitles: d.sources.map((s) => s.originalTitle ?? s.title),
    references: d.references,
  };
}

function defToWorldInput(d: (typeof ALL_WORLD_CASE_DEFS)[number]) {
  return {
    slug: d.slug,
    name: d.name,
    subtitle: d.subtitle,
    overview: d.overview,
    jurisdiction: d.jurisdiction,
    location: d.location,
    era: d.era,
    yearStart: d.yearStart,
    yearEnd: d.yearEnd,
    status: d.status,
    crimeCategories: d.crimeCategories,
    offenderName: d.offenderName,
    offenderBackground: d.offenderBackground,
  };
}

const worldDefBySlug = new Map(ALL_WORLD_CASE_DEFS.map((d) => [d.slug, d]));
const multilingualDefBySlug = new Map(MULTILINGUAL_CASE_DEFS.map((d) => [d.slug, d]));

export function getDeepCaseBundle(slug: string): DeepCaseBundle | undefined {
  const world = worldDefBySlug.get(slug);
  if (world) return buildWorldDeep(defToWorldInput(world));
  const ml = multilingualDefBySlug.get(slug);
  if (ml) return buildMultilingualDeep(defToMultilingualInput(ml));
  return undefined;
}

export function getDeepNarrative(slug: string): CaseNarrative | undefined {
  return getDeepCaseBundle(slug)?.narrative;
}

export const deepNarrativeCount = ALL_WORLD_CASE_DEFS.length + MULTILINGUAL_CASE_DEFS.length;

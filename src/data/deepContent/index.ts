/**
 * Deep dossier registry — narratives, timelines, and enrichment patches
 * for world and multilingual catalog cases.
 */
import { MULTILINGUAL_CASE_DEFS } from "@/data/multilingualCases";
import { WORLD_CASE_DEFS } from "@/data/worldCases";
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

function defToWorldInput(d: (typeof WORLD_CASE_DEFS)[number]) {
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

const multilingualBundles = Object.fromEntries(
  MULTILINGUAL_CASE_DEFS.map((d) => [d.slug, buildMultilingualDeep(defToMultilingualInput(d))]),
) as Record<string, DeepCaseBundle>;

const worldBundles = Object.fromEntries(
  WORLD_CASE_DEFS.map((d) => [d.slug, buildWorldDeep(defToWorldInput(d))]),
) as Record<string, DeepCaseBundle>;

export const deepCaseBundles: Record<string, DeepCaseBundle> = {
  ...worldBundles,
  ...multilingualBundles,
};

export function getDeepCaseBundle(slug: string): DeepCaseBundle | undefined {
  return deepCaseBundles[slug];
}

export function getDeepNarrative(slug: string): CaseNarrative | undefined {
  return deepCaseBundles[slug]?.narrative;
}

export const deepNarrativeCount = Object.keys(deepCaseBundles).length;

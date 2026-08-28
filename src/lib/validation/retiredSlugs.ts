/**
 * Slugs retired for factual inaccuracy or duplication.
 * Single source of truth — import here instead of duplicating in scripts.
 */

/** Removed from world catalog (superseded or wrong tier). */
export const RETIRED_WORLD_SLUGS = new Set([
  "javed-iqbal",
  "saeed-hanaei",
  "pedro-lopez",
  "yishai-schlissel",
  "dimitris-papageorgiou",
]);

/** Retired for fabricated entries, wrong-person attribution, or unverified legends. */
export const RETIRED_INACCURATE_SLUGS = new Set([
  "abdul-latif-rashid",
  "mira-bare",
  "volkmar-heinrich",
  "andres-bustamante",
  "gheorghe-solovan",
  "mehmet-oktas",
  "nguyen-thanh-vu",
  "werner-fischer",
  "pedro-lopez",
  "javed-iqbal",
  "saeed-hanaei",
  "yishai-schlissel",
  "dimitris-papageorgiou",
  "dimitris-papageorgiou-el",
  "lucjan-staniak",
  "nguyen-tien-dung",
  "laszlo-pandy",
]);

export const ALL_RETIRED_SLUGS = new Set([
  ...RETIRED_WORLD_SLUGS,
  ...RETIRED_INACCURATE_SLUGS,
]);

export function isRetiredSlug(slug: string): boolean {
  return ALL_RETIRED_SLUGS.has(slug);
}

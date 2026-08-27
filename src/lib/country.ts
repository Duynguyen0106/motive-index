import type { CrimeCase, CountryCode } from "@/lib/types";

export type { CountryCode };

export const COUNTRY_LABELS: Record<CountryCode, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  OTHER: "Other / unspecified",
};

const US_STATE_PATTERN =
  /\b(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming)\b/;

/** Infer country from free-text jurisdiction / location strings. */
export function inferCountry(jurisdiction?: string, location?: string): CountryCode {
  const text = `${jurisdiction ?? ""} ${location ?? ""}`.toLowerCase();

  if (/\b(united kingdom|england|scotland|wales|northern ireland| uk\b|, uk\b)/.test(text)) {
    return "GB";
  }
  if (/\bcanada\b/.test(text)) return "CA";
  if (/\baustralia\b/.test(text)) return "AU";
  if (
    /\b(united states|u\.s\.|usa\b|multi-state)/.test(text) ||
    US_STATE_PATTERN.test(text)
  ) {
    return "US";
  }

  return "OTHER";
}

export function resolveCaseCountry(
  c: Pick<CrimeCase, "country" | "jurisdiction" | "location">,
): CountryCode {
  return c.country ?? inferCountry(c.jurisdiction, c.location);
}

export function listCountryOptions(cases: CrimeCase[]): CountryCode[] {
  const codes = new Set<CountryCode>();
  for (const c of cases) {
    codes.add(resolveCaseCountry(c));
  }
  const order: CountryCode[] = ["US", "GB", "CA", "AU", "OTHER"];
  return order.filter((code) => codes.has(code));
}

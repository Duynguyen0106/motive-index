import type { CrimeCase, CountryCode } from "@/lib/types";

export type { CountryCode };

export const COUNTRY_LABELS: Record<CountryCode, string> = {
  AR: "Argentina",
  AT: "Austria",
  AU: "Australia",
  BE: "Belgium",
  BR: "Brazil",
  CA: "Canada",
  CH: "Switzerland",
  CL: "Chile",
  CN: "China",
  CO: "Colombia",
  CZ: "Czech Republic",
  DE: "Germany",
  DK: "Denmark",
  EG: "Egypt",
  ES: "Spain",
  FI: "Finland",
  FR: "France",
  GB: "United Kingdom",
  GR: "Greece",
  HU: "Hungary",
  ID: "Indonesia",
  IE: "Ireland",
  IL: "Israel",
  IN: "India",
  IR: "Iran",
  IT: "Italy",
  JP: "Japan",
  KE: "Kenya",
  KR: "South Korea",
  MX: "Mexico",
  MY: "Malaysia",
  NG: "Nigeria",
  NL: "Netherlands",
  NO: "Norway",
  NZ: "New Zealand",
  PE: "Peru",
  PH: "Philippines",
  PK: "Pakistan",
  PL: "Poland",
  PT: "Portugal",
  RO: "Romania",
  RU: "Russia",
  SE: "Sweden",
  SG: "Singapore",
  TH: "Thailand",
  TR: "Turkey",
  TW: "Taiwan",
  UA: "Ukraine",
  US: "United States",
  VN: "Vietnam",
  ZA: "South Africa",
  IQ: "Iraq",
  BD: "Bangladesh",
  LV: "Latvia",
  ET: "Ethiopia",
  SA: "Saudi Arabia",
  RS: "Serbia",
  BG: "Bulgaria",
  SK: "Slovakia",
  UZ: "Uzbekistan",
  OTHER: "Other / unspecified",
};

const US_STATE_PATTERN =
  /\b(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming)\b/;

/** Country name / region hints → ISO code (ordered — specific before generic). */
const COUNTRY_PATTERNS: [RegExp, CountryCode][] = [
  [/\b(united kingdom|england|scotland|wales|northern ireland| uk\b|, uk\b)/, "GB"],
  [/\b(united states|u\.s\.|usa\b|multi-state)/, "US"],
  [/\b(south korea|republic of korea| seoul\b)/, "KR"],
  [/\b(new zealand| nz\b)/, "NZ"],
  [/\b(south africa| za\b)/, "ZA"],
  [/\b(saudi arabia| riyadh\b)/, "SA"],
  [/\b(united arab emirates| uae\b)/, "OTHER"],
  [/\b(czech republic|prague|czechia)\b/, "CZ"],
  [/\b(iraq|baghdad)\b/, "IQ"],
  [/\b(bangladesh|dhaka)\b/, "BD"],
  [/\b(latvia|riga)\b/, "LV"],
  [/\b(ethiopia|addis ababa)\b/, "ET"],
  [/\b(serbia|belgrade)\b/, "RS"],
  [/\b(bulgaria|sofia)\b/, "BG"],
  [/\b(slovakia|bratislava)\b/, "SK"],
  [/\b(uzbekistan|tashkent)\b/, "UZ"],
  [/\bcanada\b/, "CA"],
  [/\baustralia\b/, "AU"],
  [/\bgermany|german\b/, "DE"],
  [/\bfrance|french\b/, "FR"],
  [/\bitaly|italian\b/, "IT"],
  [/\bspain|spanish\b/, "ES"],
  [/\bbelgium\b/, "BE"],
  [/\bnetherlands|dutch\b/, "NL"],
  [/\bsweden|swedish\b/, "SE"],
  [/\bnorway|norwegian\b/, "NO"],
  [/\bdenmark|danish\b/, "DK"],
  [/\bfinland|finnish\b/, "FI"],
  [/\bportugal|portuguese\b/, "PT"],
  [/\bgreece|greek\b/, "GR"],
  [/\bpoland|polish\b/, "PL"],
  [/\bromania|romanian\b/, "RO"],
  [/\bhungary|hungarian\b/, "HU"],
  [/\bswitzerland|swiss\b/, "CH"],
  [/\baustria|austrian\b/, "AT"],
  [/\bireland|irish\b/, "IE"],
  [/\brussia|russian|soviet\b/, "RU"],
  [/\bukraine|ukrainian\b/, "UA"],
  [/\bjapan|japanese|tokyo\b/, "JP"],
  [/\bchina|chinese\b/, "CN"],
  [/\bindia|indian\b/, "IN"],
  [/\biran|iranian\b/, "IR"],
  [/\bpakistan|pakistani\b/, "PK"],
  [/\bthailand|thai\b/, "TH"],
  [/\bsingapore\b/, "SG"],
  [/\btaiwan\b/, "TW"],
  [/\bindonesia|indonesian\b/, "ID"],
  [/\bmalaysia|malaysian\b/, "MY"],
  [/\bphilippines|filipino\b/, "PH"],
  [/\bvietnam|vietnamese\b/, "VN"],
  [/\bnigeria|nigerian\b/, "NG"],
  [/\bkenya|kenyan\b/, "KE"],
  [/\begypt|egyptian\b/, "EG"],
  [/\bturkey|turkish|turkiye\b/, "TR"],
  [/\bisrael|israeli|jerusalem\b/, "IL"],
  [/\bbrazil|brazilian\b/, "BR"],
  [/\bargentina|argentine\b/, "AR"],
  [/\bcolombia|colombian\b/, "CO"],
  [/\bchile|chilean\b/, "CL"],
  [/\bperu|peruvian\b/, "PE"],
  [/\bmexico|mexican\b/, "MX"],
];

export function inferCountry(jurisdiction?: string, location?: string): CountryCode {
  const text = `${jurisdiction ?? ""} ${location ?? ""}`.toLowerCase();

  for (const [pattern, code] of COUNTRY_PATTERNS) {
    if (pattern.test(text)) return code;
  }
  if (US_STATE_PATTERN.test(text)) return "US";

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
  return [...codes]
    .filter((c) => c !== "OTHER")
    .sort((a, b) => COUNTRY_LABELS[a].localeCompare(COUNTRY_LABELS[b]));
}

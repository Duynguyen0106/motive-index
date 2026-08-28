#!/usr/bin/env node
/**
 * Generate composite archive dossiers to scale the catalog toward 1000 cases.
 * Output: src/data/bulkCaseDefs.generated.json
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../src/data/bulkCaseDefs.generated.json");

/** Target new bulk rows (121 existing + 879 bulk = 1000). */
const BULK_COUNT = 879;

const CRIME_CATEGORIES = [
  "serial_murder",
  "homicide",
  "mass_violence",
  "domestic_homicide",
  "healthcare_murder",
  "terrorism_ideological",
  "fraud",
  "arson",
  "other",
];

const PSYCH_FACTORS = [
  "antisocial_traits",
  "psychopathy_traits",
  "power_control",
  "impression_management",
  "compartmentalization",
  "childhood_trauma",
  "paranoia",
  "narcissism",
  "empathy_deficit",
  "ideological_extremism",
];

const FRAMEWORKS = [
  "personality",
  "cognitive_behavioral",
  "social_learning",
  "attachment",
  "situational",
  "biological",
  "ideological",
  "group_influence",
];

const SUBTITLE_TEMPLATES = {
  serial_murder: [
    "Multi-victim pattern and investigative convergence",
    "Series behavior across jurisdictions",
    "Escalation, MO stability, and forensic linkage",
  ],
  homicide: [
    "Single-incident lethal violence and motive reconstruction",
    "Interpersonal conflict and lethal escalation",
    "Premeditation signals in a closed homicide",
  ],
  mass_violence: [
    "Public-space violence and situational triggers",
    "Ideological or grievance-driven mass attack",
    "Rapid escalation in a confined setting",
  ],
  domestic_homicide: [
    "Intimate-partner lethal violence",
    "Coercive control preceding homicide",
    "Domestic escalation and risk markers",
  ],
  healthcare_murder: [
    "Institutional trust and concealed harm",
    "Patient harm within healthcare settings",
    "Credential camouflage and delayed detection",
  ],
  terrorism_ideological: [
    "Ideological radicalization and attack planning",
    "Group influence and symbolic targeting",
    "Manifesto rhetoric and operational security",
  ],
  fraud: [
    "Instrumental deception and financial predation",
    "Impression management in white-collar harm",
    "Escalating fraud and institutional breach",
  ],
  arson: [
    "Firesetting pattern and accelerant use",
    "Symbolic targeting through arson",
    "Escalation from nuisance fires to lethal arson",
  ],
  other: [
    "Complex motive architecture in public record",
    "Behavioral signals across investigation phases",
    "Archival reconstruction of contested conduct",
  ],
};

const CITIES = [
  { country: "US", city: "Phoenix", region: "Arizona", lat: 33.4484, lng: -112.074 },
  { country: "US", city: "Philadelphia", region: "Pennsylvania", lat: 39.9526, lng: -75.1652 },
  { country: "US", city: "San Antonio", region: "Texas", lat: 29.4241, lng: -98.4936 },
  { country: "US", city: "Columbus", region: "Ohio", lat: 39.9612, lng: -82.9988 },
  { country: "US", city: "Charlotte", region: "North Carolina", lat: 35.2271, lng: -80.8431 },
  { country: "GB", city: "Manchester", region: "England", lat: 53.4808, lng: -2.2426 },
  { country: "GB", city: "Birmingham", region: "England", lat: 52.4862, lng: -1.8904 },
  { country: "GB", city: "Glasgow", region: "Scotland", lat: 55.8642, lng: -4.2518 },
  { country: "CA", city: "Calgary", region: "Alberta", lat: 51.0447, lng: -114.0719 },
  { country: "CA", city: "Montreal", region: "Quebec", lat: 45.5017, lng: -73.5673 },
  { country: "AU", city: "Brisbane", region: "Queensland", lat: -27.4698, lng: 153.0251 },
  { country: "AU", city: "Perth", region: "Western Australia", lat: -31.9505, lng: 115.8605 },
  { country: "DE", city: "Hamburg", region: "Germany", lat: 53.5511, lng: 9.9937 },
  { country: "DE", city: "Cologne", region: "Germany", lat: 50.9375, lng: 6.9603 },
  { country: "FR", city: "Lyon", region: "France", lat: 45.764, lng: 4.8357 },
  { country: "FR", city: "Marseille", region: "France", lat: 43.2965, lng: 5.3698 },
  { country: "IT", city: "Turin", region: "Italy", lat: 45.0703, lng: 7.6869 },
  { country: "IT", city: "Naples", region: "Italy", lat: 40.8518, lng: 14.2681 },
  { country: "ES", city: "Seville", region: "Spain", lat: 37.3891, lng: -5.9845 },
  { country: "ES", city: "Bilbao", region: "Spain", lat: 43.263, lng: -2.935 },
  { country: "NL", city: "Rotterdam", region: "Netherlands", lat: 51.9244, lng: 4.4777 },
  { country: "BE", city: "Antwerp", region: "Belgium", lat: 51.2194, lng: 4.4025 },
  { country: "SE", city: "Gothenburg", region: "Sweden", lat: 57.7089, lng: 11.9746 },
  { country: "NO", city: "Bergen", region: "Norway", lat: 60.3913, lng: 5.3221 },
  { country: "PL", city: "Krakow", region: "Poland", lat: 50.0647, lng: 19.945 },
  { country: "PL", city: "Gdansk", region: "Poland", lat: 54.352, lng: 18.6466 },
  { country: "RU", city: "Kazan", region: "Russia", lat: 55.8304, lng: 49.0661 },
  { country: "RU", city: "Novosibirsk", region: "Russia", lat: 55.0084, lng: 82.9357 },
  { country: "UA", city: "Lviv", region: "Ukraine", lat: 49.8397, lng: 24.0297 },
  { country: "UA", city: "Kharkiv", region: "Ukraine", lat: 49.9935, lng: 36.2304 },
  { country: "JP", city: "Osaka", region: "Japan", lat: 34.6937, lng: 135.5023 },
  { country: "JP", city: "Nagoya", region: "Japan", lat: 35.1815, lng: 136.9066 },
  { country: "CN", city: "Chengdu", region: "China", lat: 30.5728, lng: 104.0668 },
  { country: "CN", city: "Wuhan", region: "China", lat: 30.5928, lng: 114.3055 },
  { country: "IN", city: "Hyderabad", region: "India", lat: 17.385, lng: 78.4867 },
  { country: "IN", city: "Kolkata", region: "India", lat: 22.5726, lng: 88.3639 },
  { country: "BR", city: "Salvador", region: "Brazil", lat: -12.9777, lng: -38.5016 },
  { country: "BR", city: "Fortaleza", region: "Brazil", lat: -3.7319, lng: -38.5267 },
  { country: "MX", city: "Guadalajara", region: "Mexico", lat: 20.6597, lng: -103.3496 },
  { country: "MX", city: "Monterrey", region: "Mexico", lat: 25.6866, lng: -100.3161 },
  { country: "AR", city: "Cordoba", region: "Argentina", lat: -31.4201, lng: -64.1888 },
  { country: "ZA", city: "Durban", region: "South Africa", lat: -29.8587, lng: 31.0218 },
  { country: "NG", city: "Lagos", region: "Nigeria", lat: 6.5244, lng: 3.3792 },
  { country: "KE", city: "Mombasa", region: "Kenya", lat: -4.0435, lng: 39.6682 },
  { country: "TR", city: "Izmir", region: "Turkey", lat: 38.4237, lng: 27.1428 },
  { country: "GR", city: "Thessaloniki", region: "Greece", lat: 40.6401, lng: 22.9444 },
  { country: "RO", city: "Cluj-Napoca", region: "Romania", lat: 46.7712, lng: 23.6236 },
  { country: "CZ", city: "Brno", region: "Czech Republic", lat: 49.1951, lng: 16.6068 },
  { country: "HU", city: "Szeged", region: "Hungary", lat: 46.253, lng: 20.1414 },
  { country: "AT", city: "Graz", region: "Austria", lat: 47.0707, lng: 15.4395 },
  { country: "CH", city: "Basel", region: "Switzerland", lat: 47.5596, lng: 7.5886 },
  { country: "PT", city: "Porto", region: "Portugal", lat: 41.1579, lng: -8.6291 },
  { country: "IE", city: "Cork", region: "Ireland", lat: 51.8985, lng: -8.4756 },
  { country: "FI", city: "Tampere", region: "Finland", lat: 61.4978, lng: 23.761 },
  { country: "DK", city: "Aarhus", region: "Denmark", lat: 56.1629, lng: 10.2039 },
  { country: "NZ", city: "Christchurch", region: "New Zealand", lat: -43.5321, lng: 172.6362 },
  { country: "KR", city: "Busan", region: "South Korea", lat: 35.1796, lng: 129.0756 },
  { country: "TH", city: "Chiang Mai", region: "Thailand", lat: 18.7883, lng: 98.9853 },
  { country: "VN", city: "Da Nang", region: "Vietnam", lat: 16.0544, lng: 108.2022 },
  { country: "PH", city: "Cebu City", region: "Philippines", lat: 10.3157, lng: 123.8854 },
  { country: "ID", city: "Surabaya", region: "Indonesia", lat: -7.2575, lng: 112.7521 },
  { country: "MY", city: "Penang", region: "Malaysia", lat: 5.4164, lng: 100.3327 },
  { country: "SG", city: "Singapore", region: "Singapore", lat: 1.3521, lng: 103.8198 },
  { country: "PK", city: "Karachi", region: "Pakistan", lat: 24.8607, lng: 67.0011 },
  { country: "IR", city: "Tabriz", region: "Iran", lat: 38.0962, lng: 46.2738 },
  { country: "IQ", city: "Basra", region: "Iraq", lat: 30.5085, lng: 47.7804 },
  { country: "IL", city: "Haifa", region: "Israel", lat: 32.794, lng: 34.9896 },
  { country: "EG", city: "Alexandria", region: "Egypt", lat: 31.2001, lng: 29.9187 },
  { country: "CL", city: "Valparaiso", region: "Chile", lat: -33.0472, lng: -71.6127 },
  { country: "CO", city: "Medellin", region: "Colombia", lat: 6.2476, lng: -75.5658 },
  { country: "PE", city: "Arequipa", region: "Peru", lat: -16.409, lng: -71.5375 },
  { country: "BD", city: "Chittagong", region: "Bangladesh", lat: 22.3569, lng: 91.7832 },
  { country: "LV", city: "Riga", region: "Latvia", lat: 56.9496, lng: 24.1052 },
  { country: "SK", city: "Kosice", region: "Slovakia", lat: 48.7164, lng: 21.2611 },
  { country: "RS", city: "Novi Sad", region: "Serbia", lat: 45.2671, lng: 19.8335 },
  { country: "BG", city: "Plovdiv", region: "Bulgaria", lat: 42.1354, lng: 24.7453 },
  { country: "TW", city: "Kaohsiung", region: "Taiwan", lat: 22.6273, lng: 120.3014 },
  { country: "UZ", city: "Samarkand", region: "Uzbekistan", lat: 39.6542, lng: 66.9597 },
  { country: "SA", city: "Jeddah", region: "Saudi Arabia", lat: 21.4858, lng: 39.1925 },
  { country: "ET", city: "Addis Ababa", region: "Ethiopia", lat: 9.032, lng: 38.7469 },
];

const GIVEN = [
  "Adrian", "Akira", "Alberto", "Andrei", "Boris", "Carlos", "Chen", "David", "Elena", "Fatima",
  "Giuseppe", "Hassan", "Ivan", "James", "Kenji", "Lars", "Marco", "Nadia", "Omar", "Pavel",
  "Raj", "Stefan", "Tariq", "Ulrich", "Viktor", "Wei", "Youssef", "Zoran", "Amir", "Bruno",
  "Clara", "Dmitri", "Erik", "Farid", "Greta", "Henrik", "Ingrid", "Jorge", "Klaus", "Leila",
];

const FAMILY = [
  "Andersen", "Bianchi", "Carter", "Dubois", "Eriksson", "Fernandez", "Garcia", "Hoffman",
  "Ibrahim", "Johansson", "Kowalski", "Lopez", "Moretti", "Nguyen", "Olsen", "Petrov",
  "Rahman", "Silva", "Tanaka", "Ueda", "Varga", "Walsh", "Xu", "Yilmaz", "Zimmerman",
  "Bauer", "Costa", "Diaz", "Evans", "Fischer", "Gomez", "Hansen", "Ito", "Jensen", "Khan",
];

function pick(arr, seed) {
  return arr[seed % arr.length];
}

function eraFromYear(year) {
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
}

function jitter(value, seed, spread = 0.35) {
  const n = ((seed * 9301 + 49297) % 233280) / 233280 - 0.5;
  return Math.round((value + n * spread) * 10000) / 10000;
}

function statusFor(seed) {
  const r = seed % 10;
  if (r === 0) return "unsolved";
  if (r <= 2) return "historical";
  return "closed";
}

const defs = [];
const usedSlugs = new Set();

for (let i = 0; i < BULK_COUNT; i++) {
  const seed = i + 1;
  const city = pick(CITIES, seed);
  const crime = pick(CRIME_CATEGORIES, seed * 7 + 3);
  const yearStart = 1955 + (seed % 68);
  const yearSpan = crime === "serial_murder" ? 2 + (seed % 6) : seed % 3;
  const yearEnd = yearStart + yearSpan;
  const subjectId = `CS-${String(seed).padStart(4, "0")}`;
  const offenderName = subjectId;
  const slug = `archive-${city.country.toLowerCase()}-${String(seed).padStart(4, "0")}`;
  if (usedSlugs.has(slug)) continue;
  usedSlugs.add(slug);

  const location = `${city.city}, ${city.region}`;
  const jurisdiction = `${city.region}, ${city.country}`;
  const subtitle = pick(SUBTITLE_TEMPLATES[crime], seed);
  const status = statusFor(seed);
  const caseLabel = status === "unsolved" ? "Unsolved matter" : "Archival prosecution";

  defs.push({
    slug,
    name: `${caseLabel}: ${subjectId}`,
    subtitle,
    country: city.country,
    location,
    jurisdiction,
    yearStart,
    yearEnd: yearEnd > yearStart ? yearEnd : undefined,
    era: eraFromYear(yearStart),
    status,
    crimeCategories: [crime],
    offenderName,
    offenderBackground: `Synthetic teaching identifier ${subjectId}; procedurally generated from ${jurisdiction} public-record patterns. Not a real person — verify against primary sources before citation.`,
    tags: ["bulk-catalog", "composite-dossier", "synthetic-subject"],
    psychologicalFactors: [
      pick(PSYCH_FACTORS, seed),
      pick(PSYCH_FACTORS, seed + 5),
    ],
    theoreticalFrameworks: [pick(FRAMEWORKS, seed), pick(FRAMEWORKS, seed + 2)],
    overview: `Composite archival dossier (${yearStart}${yearEnd > yearStart ? `–${yearEnd}` : ""}, ${location}) synthesizing documented patterns of ${crime.replace(/_/g, " ")} prosecutions in ${jurisdiction}. Subject ${subjectId} is a synthetic teaching identifier — narrative and analysis are procedurally generated from jurisdictional templates for forensic-psychology instruction, not a verbatim transcription of a single trial file or real named offender.`,
    lat: jitter(city.lat, seed),
    lng: jitter(city.lng, seed + 17),
  });
}

fs.writeFileSync(OUT, JSON.stringify(defs, null, 0));
console.log(`Wrote ${defs.length} bulk case defs to ${OUT}`);

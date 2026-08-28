#!/usr/bin/env node
/**
 * Repair Wikidata-imported case coordinates:
 * - Replace null-island / placeholder (20,0) coords
 * - Infer city-level pins from case titles where possible
 * - Fall back to country centroids
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isInvalidMapCoord,
  resolveImportedCaseGeo,
} from "./lib/coordinateUtils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CASES_PATH = path.join(ROOT, "src/data/imported/wikidataCases.generated.json");

const COUNTRY_LABELS = {
  US: "United States",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  IQ: "Iraq",
  AU: "Australia",
  CA: "Canada",
  OTHER: "Other / unspecified",
};

function main() {
  const cases = JSON.parse(fs.readFileSync(CASES_PATH, "utf8"));
  let fixed = 0;
  let cityInferred = 0;
  let centroidFallback = 0;
  let stillInvalid = 0;

  for (const c of cases) {
    const before = { lat: c.lat, lng: c.lng };
    const resolved = resolveImportedCaseGeo(c);

    if (!resolved) {
      stillInvalid++;
      continue;
    }

    const changed =
      isInvalidMapCoord(before.lat, before.lng) ||
      before.lat !== resolved.point.lat ||
      before.lng !== resolved.point.lng;

    if (changed) {
      c.lat = Math.round(resolved.point.lat * 1e6) / 1e6;
      c.lng = Math.round(resolved.point.lng * 1e6) / 1e6;
      fixed++;

      if (resolved.accuracy === "city") {
        cityInferred++;
      } else {
        centroidFallback++;
        if (c.location.includes("(see Wikipedia)")) {
          const label = COUNTRY_LABELS[c.country] ?? c.country;
          c.location = `${label} (country estimate)`;
        }
      }
    }
  }

  fs.writeFileSync(CASES_PATH, JSON.stringify(cases));
  console.log(`Fixed ${fixed} of ${cases.length} imported cases`);
  console.log(`  City-level: ${cityInferred}`);
  console.log(`  Country centroid: ${centroidFallback}`);
  console.log(`  Unresolved: ${stillInvalid}`);
}

main();

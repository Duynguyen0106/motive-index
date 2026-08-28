#!/usr/bin/env node
/**
 * Unified catalog validation — run without a live server (CI-friendly).
 * Orchestrates definition, structural, and source-accuracy checks.
 */
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const STEPS = [
  { name: "Case definitions", script: "validate-case-defs.mjs" },
  { name: "Per-case provenance audit", script: "audit-all-cases.mjs" },
  { name: "Database audit", script: "audit-database.mjs" },
  { name: "Source validation", script: "validate-sources.mjs" },
];

let failed = 0;

console.log("=== Motive Index Catalog Validation ===\n");

for (const step of STEPS) {
  console.log(`-- ${step.name} --`);
  const result = spawnSync("npx", ["tsx", join(root, "scripts", step.script)], {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe",
  });
  const out = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
  if (out) console.log(out);
  if (result.status !== 0) {
    console.log(`\n✗ ${step.name} failed (exit ${result.status})\n`);
    failed += 1;
  } else {
    console.log(`\n✓ ${step.name} passed\n`);
  }
}

if (failed > 0) {
  console.log(`=== ${failed}/${STEPS.length} validation steps failed ===`);
  process.exit(1);
}

console.log("=== All catalog validation steps passed ===");

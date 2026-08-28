#!/usr/bin/env node
/**
 * Validate persisted .data/store.json against runtime provenance rules.
 * Run after ingest/moderation workflows or before production deploy.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const storePath = path.join(root, ".data", "store.json");
const runner = path.join(root, "scripts", "validate-store-runner.mjs");

if (!fs.existsSync(storePath)) {
  console.log("No .data/store.json — skipping store validation (seed on first run).");
  process.exit(0);
}

const result = spawnSync("node", [runner], { cwd: root, stdio: "inherit" });
process.exit(result.status ?? 1);


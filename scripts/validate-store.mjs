#!/usr/bin/env node
/**
 * Validate persisted .data/store.json against runtime provenance rules.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const runner = path.join(root, "scripts", "validate-store-runner.ts");

const result = spawnSync("npx", ["tsx", runner], { cwd: root, stdio: "inherit" });
process.exit(result.status ?? 1);

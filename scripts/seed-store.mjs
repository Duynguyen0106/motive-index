#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const runner = path.join(root, "scripts", "seed-store-runner.ts");

const result = spawnSync("npx", ["tsx", runner], { cwd: root, stdio: "inherit" });
process.exit(result.status ?? 1);

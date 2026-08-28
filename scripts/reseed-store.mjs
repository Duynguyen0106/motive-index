#!/usr/bin/env node
/**
 * Delete local store so the next app boot re-seeds from src/data catalog.
 * Usage: npm run db:reseed
 */
import fs from "node:fs";
import path from "node:path";

const storePath = path.join(process.cwd(), ".data", "store.json");

if (fs.existsSync(storePath)) {
  fs.unlinkSync(storePath);
  console.log("Deleted .data/store.json");
} else {
  console.log("No .data/store.json — already clean");
}

console.log("Restart the dev server or POST /api/reset to load the latest catalog.");

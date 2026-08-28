import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getStoreSnapshot } from "../src/lib/data";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const storePath = path.join(root, ".data", "store.json");

if (fs.existsSync(storePath)) {
  fs.unlinkSync(storePath);
}

const store = getStoreSnapshot();
fs.mkdirSync(path.dirname(storePath), { recursive: true });
fs.writeFileSync(storePath, JSON.stringify(store, null, 2));

console.log(`Seeded ${store.cases.length} cases to .data/store.json`);

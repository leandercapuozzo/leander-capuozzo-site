import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const dataPath = path.join(root, "data", "tiles.json");
const tiles = JSON.parse(await fs.readFile(dataPath, "utf8"));
const seen = new Set();
const errors = [];

for (const [index, tile] of tiles.entries()) {
  const label = `${index + 1}: ${tile.title || tile.url || "untitled"}`;
  if (!tile.url) errors.push(`${label} is missing url`);
  if (!tile.title) errors.push(`${label} is missing title`);
  if (!tile.alt) errors.push(`${label} is missing alt text`);
  if (!tile.image) errors.push(`${label} is missing image`);
  if (!tile.date || Number.isNaN(Date.parse(tile.date))) errors.push(`${label} has invalid date`);
  if (tile.url && seen.has(tile.url)) errors.push(`${label} duplicates ${tile.url}`);
  if (tile.url) seen.add(tile.url);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`${tiles.length} tiles ok.`);

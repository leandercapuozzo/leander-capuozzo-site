import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const dataPath = path.join(root, "data", "tiles.json");
const url = process.argv[2];

if (!url) {
  console.log('Usage: npm run remove-link -- "https://example.com/post"');
  process.exit(1);
}

const tiles = JSON.parse(await fs.readFile(dataPath, "utf8"));
const next = tiles.filter((tile) => tile.url !== url);

if (next.length === tiles.length) {
  console.log("No matching link found.");
  process.exit(0);
}

await fs.writeFile(dataPath, `${JSON.stringify(next, null, 2)}\n`);
console.log(`Removed ${tiles.length - next.length} link(s).`);

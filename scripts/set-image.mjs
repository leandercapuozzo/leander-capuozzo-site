import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const dataPath = path.join(root, "data", "tiles.json");
const [url, image] = process.argv.slice(2);

if (!url || !image) {
  console.log('Usage: npm run set-image -- "https://example.com/post" "https://example.com/image.jpg"');
  process.exit(1);
}

const tiles = JSON.parse(await fs.readFile(dataPath, "utf8"));
const tile = tiles.find((item) => item.url === url);

if (!tile) {
  console.log("No matching link found.");
  process.exit(1);
}

tile.image = image;
delete tile.zoom;
await fs.writeFile(dataPath, `${JSON.stringify(tiles, null, 2)}\n`);
console.log(`Updated image for: ${tile.title || tile.url}`);

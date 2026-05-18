import fs from "node:fs/promises";
import path from "node:path";
import https from "node:https";
import http from "node:http";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const dataPath = path.join(root, "data", "tiles.json");

function usage() {
  console.log("Usage: npm run add-link -- <url> [--title \"Title\"] [--image \"https://...\"] [--source \"Source\"] [--note \"Note\"]");
}

function parseArgs(argv) {
  const args = { url: "" };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item.startsWith("--")) {
      args[item.slice(2)] = argv[i + 1] || "";
      i += 1;
    } else if (!args.url) {
      args.url = item;
    }
  }
  return args;
}

function request(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https:") ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          "user-agent": "Mozilla/5.0 link-preview-bot",
          accept: "text/html,application/xhtml+xml"
        },
        timeout: 9000
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 4) {
          res.resume();
          resolve(request(new URL(res.headers.location, url).toString(), redirects + 1));
          return;
        }

        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
          if (body.length > 300000) req.destroy();
        });
        res.on("end", () => resolve(body));
      }
    );
    req.on("timeout", () => req.destroy(new Error("Request timed out")));
    req.on("error", reject);
  });
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function meta(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const property = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  const contentFirst = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, "i");
  const match = html.match(property) || html.match(contentFirst);
  return match ? decodeEntities(match[1].trim()) : "";
}

function titleFromHtml(html) {
  const title = meta(html, "og:title") || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "";
  return decodeEntities(title).replace(/\s+/g, " ").trim();
}

function hostSource(url) {
  return new URL(url).hostname.replace(/^www\./, "");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.url) {
    usage();
    process.exit(1);
  }

  const url = new URL(args.url).toString();
  const tiles = JSON.parse(await fs.readFile(dataPath, "utf8"));
  if (tiles.some((tile) => tile.url === url)) {
    console.log("Link already exists in data/tiles.json");
    return;
  }

  let inferred = {};
  try {
    const html = await request(url);
    inferred = {
      title: titleFromHtml(html),
      image: meta(html, "og:image"),
      source: meta(html, "og:site_name")
    };
  } catch (error) {
    console.warn(`Metadata fetch failed, adding link with fallbacks: ${error.message}`);
  }

  const entry = {
    title: args.title || inferred.title || hostSource(url),
    url,
    source: args.source || inferred.source || hostSource(url),
    date: new Date().toISOString().slice(0, 10),
    addedAt: new Date().toISOString()
  };

  if (args.image || inferred.image) entry.image = args.image || inferred.image;
  if (args.note) entry.note = args.note;

  tiles.unshift(entry);
  await fs.writeFile(dataPath, `${JSON.stringify(tiles, null, 2)}\n`);
  console.log(`Added: ${entry.title}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

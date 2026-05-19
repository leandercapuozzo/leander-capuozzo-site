const mosaic = document.querySelector("#mosaic");
const screenshotBase = "https://image.thum.io/get/width/900/crop/900/noanimate/";
const initializeDelay = 650;

function sourceFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "link";
  }
}

function previewImage(tile) {
  if (tile.image) return tile.image;
  return `${screenshotBase}${tile.url}`;
}

function renderTile(tile) {
  const link = document.createElement("a");
  link.className = "tile";
  link.href = tile.url;
  link.target = "_blank";
  link.rel = "noopener";
  link.ariaLabel = tile.title || sourceFromUrl(tile.url);
  link.style.setProperty("--image", `url("${previewImage(tile)}")`);
  if (tile.zoom) link.style.setProperty("--zoom", tile.zoom);
  if (tile.fit) link.style.setProperty("--fit", tile.fit);
  if (tile.imageTransform) link.style.setProperty("--image-transform", tile.imageTransform);

  const probe = new Image();
  probe.referrerPolicy = "no-referrer";
  probe.onload = () => {
    link.classList.add("is-loaded");
  };
  probe.onerror = () => {
    link.style.removeProperty("--image");
    link.classList.add("is-missing");
  };
  probe.src = previewImage(tile);

  return link;
}

function finishInitialize() {
  mosaic.classList.remove("is-initializing");
}

function setGrid(count) {
  const width = document.documentElement.clientWidth;
  const height = window.visualViewport?.height || window.innerHeight;
  const footer = document.querySelector(".contact");
  const footerHeight = footer?.getBoundingClientRect().height || 54;
  const availableHeight = Math.max(80, height - footerHeight);
  let best = { cols: count, rows: 1, size: Math.min(width / count, availableHeight), score: Infinity };

  for (let cols = 1; cols <= count; cols += 1) {
    const rows = Math.ceil(count / cols);
    const size = Math.min(width / cols, availableHeight / rows);
    const gridWidth = size * cols;
    const gridHeight = size * rows;
    const emptyCells = cols * rows - count;
    const unusedWidth = width - gridWidth;
    const unusedHeight = availableHeight - gridHeight;
    const score = unusedWidth + unusedHeight + emptyCells * size * 0.08;

    if (score < best.score - 0.1 || (Math.abs(score - best.score) <= 0.1 && size > best.size)) {
      best = { cols, rows, size, score };
    }
  }

  mosaic.style.setProperty("--cols", best.cols);
  mosaic.style.setProperty("--rows", best.rows);
  mosaic.style.setProperty("--tile-size", `${best.size}px`);
}

async function boot() {
  const response = await fetch("./data/tiles.json", { cache: "no-store" });
  const tiles = await response.json();
  const sorted = [...tiles].sort((a, b) => {
    const aTime = Date.parse(a.date || "1970-01-01");
    const bTime = Date.parse(b.date || "1970-01-01");
    if (bTime === aTime) {
      return String(a.title || "").localeCompare(String(b.title || ""));
    }
    return bTime - aTime;
  });

  setGrid(sorted.length);
  mosaic.replaceChildren(...sorted.map(renderTile));
  window.addEventListener("resize", () => setGrid(sorted.length));
  window.visualViewport?.addEventListener("resize", () => setGrid(sorted.length));

  window.setTimeout(finishInitialize, initializeDelay);
}

boot().catch((error) => {
  finishInitialize();
  mosaic.textContent = `Could not load links: ${error.message}`;
});

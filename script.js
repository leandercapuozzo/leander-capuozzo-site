const mosaic = document.querySelector("#mosaic");
const aboutToggle = document.querySelector(".about-toggle");
const aboutPanel = document.querySelector("#about-panel");
const aboutScrim = document.querySelector(".about-scrim");
const aboutCloseButtons = document.querySelectorAll("[data-about-close]");
const screenshotBase = "https://image.thum.io/get/width/900/crop/900/noanimate/";
const hoverTitle = document.createElement("div");
let hoverX = 0;
let hoverY = 0;
let titleX = 0;
let titleY = 0;
let titleFrame = null;

hoverTitle.className = "hover-title";
hoverTitle.setAttribute("aria-hidden", "true");
document.body.append(hoverTitle);

function setAboutOpen(isOpen) {
  aboutToggle?.setAttribute("aria-expanded", String(isOpen));
  aboutPanel?.setAttribute("aria-hidden", String(!isOpen));
  aboutPanel?.classList.toggle("is-open", isOpen);
  if (aboutScrim) aboutScrim.hidden = !isOpen;
  if (isOpen) aboutPanel?.querySelector(".about-close")?.focus();
}

aboutToggle?.addEventListener("click", () => {
  setAboutOpen(aboutToggle.getAttribute("aria-expanded") !== "true");
});

aboutCloseButtons.forEach((button) => {
  button.addEventListener("click", () => setAboutOpen(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setAboutOpen(false);
});

function moveHoverTitle() {
  titleX += (hoverX - titleX) * 0.72;
  titleY += (hoverY - titleY) * 0.72;
  hoverTitle.style.transform = "translate3d(" + titleX + "px, " + titleY + "px, 0)";

  if (hoverTitle.classList.contains("is-visible")) {
    titleFrame = requestAnimationFrame(moveHoverTitle);
  } else {
    titleFrame = null;
  }
}

function updateHoverTarget(event) {
  const offsetX = 18;
  const offsetY = 18;
  const margin = 10;
  const maxX = window.innerWidth - hoverTitle.offsetWidth - margin;
  const maxY = window.innerHeight - hoverTitle.offsetHeight - margin;
  hoverX = Math.max(margin, Math.min(event.clientX + offsetX, maxX));
  hoverY = Math.max(margin, Math.min(event.clientY + offsetY, maxY));
}

function showHoverTitle(text, event) {
  hoverTitle.textContent = text;
  hoverTitle.classList.add("is-visible");
  updateHoverTarget(event);
  titleX = hoverX;
  titleY = hoverY;
  if (!titleFrame) moveHoverTitle();
}

function hideHoverTitle() {
  hoverTitle.classList.remove("is-visible");
}

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
  link.ariaLabel = tile.alt || tile.title || sourceFromUrl(tile.url);
  if (tile.alt) {
    link.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "touch") showHoverTitle(tile.alt, event);
    });
    link.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "touch") updateHoverTarget(event);
    });
    link.addEventListener("pointerleave", hideHoverTitle);
    link.addEventListener("blur", hideHoverTitle);
  }
  link.style.setProperty("--image", `url("${previewImage(tile)}")`);
  if (tile.zoom) link.style.setProperty("--zoom", tile.zoom);
  if (tile.fit) link.style.setProperty("--fit", tile.fit);
  if (tile.imageTransform) link.style.setProperty("--image-transform", tile.imageTransform);

  const probe = new Image();
  probe.referrerPolicy = "no-referrer";
  probe.onerror = () => {
    link.style.removeProperty("--image");
    link.classList.add("is-missing");
  };
  probe.src = previewImage(tile);

  return link;
}

function setGrid(count) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const footer = document.querySelector(".contact");
  const footerHeight = footer?.getBoundingClientRect().height || 54;
  const availableHeight = Math.max(80, height - footerHeight);

  if (width <= 900) {
    const maxMobileCols = Math.min(5, count);
    let cols = maxMobileCols;
    for (let candidate = 1; candidate <= maxMobileCols; candidate += 1) {
      const rows = Math.ceil(count / candidate);
      const size = width / candidate;
      if (rows * size <= availableHeight) {
        cols = candidate;
        break;
      }
    }
    const rows = Math.ceil(count / cols);
    mosaic.style.setProperty("--cols", cols);
    mosaic.style.setProperty("--rows", rows);
    mosaic.style.setProperty("--tile-size", `${width / cols}px`);
    return;
  }

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
}

boot().catch((error) => {
  mosaic.textContent = `Could not load links: ${error.message}`;
});

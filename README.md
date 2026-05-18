# Leander Capuozzo Personal Site

Static mosaic site for `leandercapuozzo.com`.

## Run

```sh
npm run dev
```

Open `http://localhost:4173`.

## Add A Link

Links live in `data/tiles.json`; the page renders all of them and sorts by each linked item's publish date.

```sh
npm run add-link -- "https://example.com/post"
```

Manual image override:

```sh
npm run add-link -- "https://example.com/post" --image "https://example.com/image.jpg" --title "Custom title"
```

OpenClaw text target:

> Add this link to Leander site: https://example.com/post

The action for OpenClaw is:

```sh
cd /Users/bot2/clawd/leander-capuozzo-site
npm run add-link -- "https://example.com/post"
```

Remove a dead link:

```sh
npm run remove-link -- "https://example.com/post"
```

Replace a thumbnail:

```sh
npm run set-image -- "https://example.com/post" "https://example.com/image.jpg"
```

Preflight:

```sh
npm run check
```

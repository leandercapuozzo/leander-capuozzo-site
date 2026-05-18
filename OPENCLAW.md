# OpenClaw Site Updates

When Leander texts something like:

> Add this link to Leander site: https://example.com/post

Run:

```sh
cd /Users/bot2/clawd/leander-capuozzo-site
npm run add-link -- "https://example.com/post"
```

Optional manual image override when the automatic preview is weak:

```sh
npm run add-link -- "https://example.com/post" --image "https://example.com/image.jpg" --title "Custom title"
```

Remove a dead link:

```sh
npm run remove-link -- "https://example.com/post"
```

Replace a bad thumbnail:

```sh
npm run set-image -- "https://example.com/post" "https://example.com/image.jpg"
```

Check before deploy:

```sh
npm run check
```

The homepage renders every tile in `data/tiles.json`, sorts by linked-media publish `date`, and fits the square grid above the footer.

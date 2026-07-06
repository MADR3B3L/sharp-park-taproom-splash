# Sharp Park Taproom Splash

Static marketing site for Sharp Park Taproom.

This project is intentionally simple:

- plain HTML, CSS, and JavaScript
- no framework build step
- GitHub Pages friendly
- editable content separated into data files
- Cloudflare Pages friendly, including live owner publishing

## What is here

- `index.html`
  Main landing page.
- `menu.html`
  Printable / menu-friendly tap list view.
- `styles.css`
  Main site styling.
- `assets/content-data.js`
  Editable site copy, hours, colors, vendors, and calendar data.
- `assets/taps-data.js`
  Editable tap list source used by the site.
- `site-options.html`
  No-code editing surface for content and tap data.
- `functions/api/*`
  Same-origin live API for the hosted dashboard (`/api/site-data`, `/api/content`, `/api/taps`).
- `wrangler.jsonc`
  Cloudflare Pages config with the KV binding used by the live dashboard.

## Local preview

Because the site is static and uses relative paths, it can be opened directly,
but a simple local server is better for testing:

```bash
cd sharp-park-taproom-splash
python3 -m http.server 8080
```

Then open:

- `http://localhost:8080/`
- `http://localhost:8080/site-options.html`

## Hosted URLs

- Public site: `https://sharppark-taproom.pages.dev/`
- Hosted owner dashboard: `https://sharppark-taproom.pages.dev/site-options`
- Menu page: `https://sharppark-taproom.pages.dev/menu`

The hosted dashboard can publish live edits when the browser has the owner
access code stored locally. Without that code, the same page still falls back
to file-save/download mode.

## GitHub Pages

This folder is ready for GitHub Pages hosting:

1. Push it to a GitHub repository.
2. In GitHub:
   - open `Settings`
   - open `Pages`
   - set `Source` to `Deploy from a branch`
   - choose the `main` branch and `/ (root)`
3. Wait for the first deploy to finish.

The `.nojekyll` file is included so Pages serves the project as plain static
files with no extra processing.

## Editing content

Most business-facing edits happen in:

- `assets/content-data.js`
- `assets/taps-data.js`

Or through:

- `site-options.html`

## Notes

- The site is already usable as a static public splash site.
- The floating homepage bubble is currently forced to `Lobo` via
  `vendors.bubbleCurrentVendor` so the live surface stays truthful.
- Mobile is partially responsive now, but another polish pass is still worth
  doing before calling it fully tuned for phone-first traffic.

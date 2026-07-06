# Sharp Park Taproom — "Site Options" handoff brief

**STATUS: BUILT (2026-07-04).** Both deliverables below are implemented and
verified — see `assets/content.json`, `assets/content.js`, `site-options.html/css/js`.
Verified non-destructive with content.json present, missing, and malformed (all
three render the site identically, no console errors). Git-backed (`git log`
in this folder has the before/after commits). Rest of this doc is the original
design brief, kept for reference.

**UPDATE (2026-07-05):** The dashboard now has two modes:
- local file mode for double-click / offline editing
- live hosted mode on Cloudflare Pages, backed by KV via `/api/site-data`,
  `/api/content`, and `/api/taps`

Hosted surface:
- site: `https://sharppark-taproom.pages.dev/`
- dashboard: `https://sharppark-taproom.pages.dev/site-options`
- menu: `https://sharppark-taproom.pages.dev/menu`

The live dashboard stores the owner access code in browser local storage, then
publishes directly to the hosted data store instead of downloading replacement
files.

Goal: leave Alex (non-developer) able to change words, hours, colors, and the
beer list himself — no code, no LLM, never assed-out. Turn the finished site
from a frozen artifact into a **living content-map he owns.**

## Core principle
The beer list already proves the model: `assets/taps.csv` is DATA, not code —
one file feeds both the website and the printable `menu.html`. Everything else
(hero copy, hours, address, about text, brand colors) is currently HARDCODED in
`index.html` / `styles.css`. That hardcoded stuff is the only place Alex gets
stuck. **Fix = pull the rest of the editable content out into data too**, then
put a simple no-LLM editor over it.

## Current state (verified 2026-07-04)
Files: `index.html`, `styles.css`, `menu.html`, `menu.css`, `assets/taps.csv`,
`assets/taps.js`.
- `taps.csv` columns: `tap,beer,brewery,style,abv,active` — 13 rows, active=yes/no.
- `taps.js` already fetches the CSV with a local fallback (`TAPS_SOURCE`), and
  the plan (documented in its header) is to move it to a published Google Sheet
  so Alex edits from his phone. **Keep that plan for the beer list.**

## Deliverable 1 — non-destructive content extraction
Extract the hardcoded editable strings/colors into a new `assets/content.json`,
read at load and injected into the DOM. MUST be additive with fallback so it
CANNOT break the current site.

Safe method (mirror how `taps.js` already fails gracefully):
1. Keep every current word EXACTLY where it is in `index.html` as the built-in
   default.
2. Tag editable elements with a data attribute, e.g. `data-edit="hero.title"`.
3. Small script: for each `[data-edit]`, if `content.json` has that key, replace
   the text/attr; else leave the HTML default untouched.
4. Result: `content.json` missing or malformed → site is byte-for-byte identical
   to today. It can only override, never subtract.
5. Do it on a git commit first so there's a one-command revert. Show the site
   rendering identically before/after as proof.

Fields to extract (all present in current index.html):
- `hero.eyebrow` = "Sharp Park · Pacifica, CA"
- `hero.title` = "Craft beer. / Local food. / Community."
- `hero.sub` = the "9+ rotating taps…" line
- `about.body` = the Kris/Alex story paragraph
- `figures` = 4 cards: "17 ft / ash wood bar", "9+ / rotating taps",
  "Thu–Sun / food trucks", "Dog / friendly patio"
- `visit.address` = "100 Santa Rosa Ave, Suite 3 / Pacifica, CA 94044"
- `hours` = Mon Closed, Tue–Thu 4–9pm, Fri 3–10pm, Sat 12–10pm, Sun 12–9pm
- `social.instagram` = https://www.instagram.com/sharpparktaproom/
- brand colors: pull the CSS custom properties from `styles.css` into
  `content.json` too (accent, etc.), injected as CSS variables at load with the
  stylesheet values as fallback.

## Deliverable 2 — `site-options.html` (the no-LLM editor)
A single local page = "Site Options." Pure HTML/JS form over the data. NO LLM,
NO server logic. This is the same shape as LivePatch's Developer Options panel
(a face over `dev-config.json`) — here it's a face over `content.json` +
`taps.csv`:
- Text inputs for each content string (hero, about, address, hours…).
- Native color pickers for the brand colors.
- A small table editor for the beer list (add/remove row, toggle active).
- Save writes the updated `content.json` / `taps.csv`.

Saving from a static page (pick ONE, note the tradeoff):
- **Google Sheet** for taps (already planned) — most bulletproof for a phone,
  zero app. Content can ride a second sheet or stay in `content.json`.
- **Browser File System Access API** (`showSaveFilePicker`) — Alex edits in
  Site Options and saves the file back locally. Branded, owned, offline. Chrome/
  Edge only.
- **Download + replace** — generates the updated file for Alex to drop in.
  Works everywhere, clumsiest.

## Why this matters (the product thesis)
You don't hand a friend a finished site (a dead artifact he'll break). You hand
him a living content-map he can tend — type a change, pick a color, flip a beer,
never call you at 11pm. The build was the easy 20%; leaving him able to keep it
alive without a developer is the actual product. Taproom = site #1; the Site
Options layer then sits on ANY site built this data-first way.

## Guardrails
- Do NOT alter layout/CSS structure or the taps pipeline — content extraction is
  additive only.
- Git commit before touching anything; keep HTML defaults as permanent fallback.
- No LLM anywhere in the runtime — a color change needs a color picker, not AI.
- Verify: with `content.json` absent, the site must render exactly as it does now.

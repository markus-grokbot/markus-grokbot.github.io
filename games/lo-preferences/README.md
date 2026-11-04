# Lo · Preferences (Lynx Dash variant)

Run with Lo the lynx; every 30 s of active running the game pauses for one preference card about a project area.
Card types: **up/down-prioritise** an area, **rate an aspect** on −− … ++, **multiple-choice** direction/phrasing picks.
Choosing the same preference 3× (`confirmAt` in the data) marks it a **strong current preference**; counts show as 1/3, 2/3, strong.
After the first pass through the deck, cards that can confirm a pending (1/3, 2/3) preference are re-asked first.

## Open
- Offline: double-click `index.html` (uses `data/areas.js`, the packed copy of the JSON).
- Served: `python3 -m http.server` here, open http://localhost:8000/ (reads `data/areas.json` live).
- Debug: `?segment=5` (seconds per run segment), `?fast=4` (sim speed).

Setup: tick project areas, pick 5 / 10 / 15 min or custom. Cards = minutes × 60 / 30 (15 min → 30 cards). Settings persist in
localStorage (`lo-prefs.settings.v1`), last result in `lo-prefs.results.v1`. Export JSON or Markdown at the end.

## Add a project area (no code changes)
1. In `data/areas.json` add to `areas`: `{"id":"my-area","name":"My area","description":"…","defaultOn":true}`
2. Add cards to `cards` with `"area":"my-area"`:
   - `{"id":"my-area-ud1","area":"my-area","type":"updown","prompt":"Spend more time on My area"}` → prefs `my-area:up` / `my-area:down`
   - `{"id":"my-area-r1","area":"my-area","type":"rate","aspect":"my-area-value","prompt":"How valuable is …?"}` → prefs `my-area-value:+|0|-`
   - `{"id":"my-area-c1","area":"my-area","type":"choice","prompt":"Which next?","options":[{"label":"A","pref":"my-area:a"},{"label":"B","pref":"my-area:b"}]}`
   Cards sharing a pref key (two updown cards, two rate cards with the same `aspect`, same option `pref`) confirm each other.
   Aim for ≥5 cards per area, 2 phrasings of the key questions.
3. `node tools/pack.js` (validates and regenerates `data/areas.js` for offline use).

## Files
`index.html`, `game.js` (UI), `prefs.js` (pure card/pref logic), `timer.js` (active-time segment timer), `engine.js` (Lynx Dash runner engine,
copied from `games/runner/engine.js`), `data/areas.json` (+ packed `areas.js`), `tools/gen.js` (one-off initial generator), `test/test.js` (`node test/test.js`).

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

## Countdown & mobile
Before every card the game pauses and shows a 3-2-1 countdown (`?countdown=ms` to change); options then ignore taps for 300 ms, so stray jump taps can't pick.
On phones the jump button fills the lower screen (full width, ≥42% height) and page zoom (pinch / double-tap) is disabled.

## Executors
Each area row has checkboxes for which executors may act on the choices; the master row above sets one executor for all areas (indeterminate when mixed).
Executors come from the top-level `executors` array in `data/areas.json` (`{"id","name","defaultOn"}`) — add more there. Default: all on, including OpenCode on Lenovo — tick/untick Lenovo depending on whether your Lenovo is available (`execDefaultsVersion` 2 re-ticks it once for older saved settings).
Selections persist in localStorage and are exported as `executors` (JSON) / "Executors per area" (Markdown).

## Project ladder (cross-session ledger)
Every finished normal game adds one session to a ledger in localStorage (`lo-prefs.ledger.v1`): `{version:1, sessions:[{at, mode, area, answered, delta:{areaId:score}, up:{areaId:n}}]}`.
Per area: **score** = up votes (+1) − down votes (−1) + `rateWeight` (default 0.25) × sign of answers on rate cards marked `"priority": true` (++/+ → +0.25, −/−− → −0.25).
**upSessions** = number of sessions with at least one up vote for the area. Decision rounds are logged but never move the ladder.
The **Project ladder** panel (setup + end screens) shows each area's progress bar = min(score/minScore, upSessions/minUpSessions).

### Threshold
`data/areas.json` → `"threshold": {"minScore": 5, "minUpSessions": 2, "rateWeight": 0.25}` (default: net score ≥ 5 **and** up-voted in ≥ 2 sessions).
Override per area: `{"id":"bend", …, "threshold": {"minScore": 8}}`. When an area crosses, the end screen shows **⭐ Suggested project: X** with a **🎯 Start decision round** button
(also on the ladder row), and the export lists it in `"suggested": [...]`.

### Decision rounds
Each area has a `decisions` array (8 cards: scope ×2, first deliverable, executors, timeline, public vs private, success metric, start now/wait). A decision round draws only that area's
decision cards (same 30 s runs, countdown, 3× confirmation; ≥ 2× deck size cards). Pref keys look like `dec:<area>:<topic>:<option>` and `dec:<area>:go:up|down`.
Export has `"mode": "decision"`, `"area": "<id>"`.

### Import / multiple devices
**⬆ Import JSON** (setup + end screen) accepts one or more exported JSON files. Exports include the full `ledger`; a file without a ledger is imported as a single session.
Sessions are merged and deduplicated by their `at` timestamp, so re-importing is harmless.

### How Grok Bot reads an export
- `mode: "normal"` — `strong` = confirmed preferences, `areaRanking` = this session, `standings` = ladder totals, `suggested` = areas over threshold → propose starting them.
- `mode: "decision"` + `area` — act on `strong` prefs with `dec:<area>:…` keys (scope, first deliverable, executor, timeline, visibility, metric), using `executors[area]` for who may run it; building (1/3, 2/3) ones are tentative.

## Add a project area (no code changes)
1. In `data/areas.json` add to `areas`: `{"id":"my-area","name":"My area","description":"…","defaultOn":true}`
2. Add cards to `cards` with `"area":"my-area"`:
   - `{"id":"my-area-ud1","area":"my-area","type":"updown","prompt":"Spend more time on My area"}` → prefs `my-area:up` / `my-area:down`
   - `{"id":"my-area-r1","area":"my-area","type":"rate","aspect":"my-area-value","prompt":"How valuable is …?"}` → prefs `my-area-value:+|0|-`
   - `{"id":"my-area-c1","area":"my-area","type":"choice","prompt":"Which next?","options":[{"label":"A","pref":"my-area:a"},{"label":"B","pref":"my-area:b"}]}`
   Cards sharing a pref key (two updown cards, two rate cards with the same `aspect`, same option `pref`) confirm each other.
   Aim for ≥5 cards per area, 2 phrasings of the key questions. Mark rate cards that express priority with `"priority": true`.
   Add 6–10 `decisions` cards to the area (`choice`, or `updown` with a `key`), each with `"area"` and `"topic"`.
3. `node tools/pack.js` (validates and regenerates `data/areas.js` for offline use).

## Files
`index.html`, `game.js` (UI), `prefs.js` (pure card/pref logic), `timer.js` (active-time segment timer), `engine.js` (Lynx Dash runner engine,
copied from `games/runner/engine.js`), `data/areas.json` (+ packed `areas.js`), `tools/gen.js` (one-off initial generator), `test/test.js` (`node test/test.js`).

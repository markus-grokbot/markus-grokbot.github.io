# Shared qualities + "Which game now?" recommender

## Qualities model (`qualities.js`, registry `qualities.registry.json`)
Ten qualities, each 0–100 with `confidence` (0–1, n/(n+k)) and `evidence` strings: focus, reaction, pace, consistency,
accuracy, planning, riskTaking, endurance (50 = steady, >50 warming up, <50 tiring), decisionSpeed, decisiveness.
Per-game adapters (`runner`, `tetris`, `parcels`, `pairwise`) read a gameplay log by content and return partial qualities; `compute(log)`
merges them confidence-weighted (combo = tetris + pairwise, Lynx Dash = runner + pairwise). Label `rough` below 0.5 confidence.
These are gameplay estimates used to pick a game. They are not assessments of a person and use no clinical meaning.

Logs from 1.2.0 carry `qualities` (computed at the end of the run); older logs are scored on read.

### Lynx Dash focus assessment
Penalty classes and weights (`games/runner/tuning.json` → `focus.weights`): running into a cactus **3**, hit by a crow **2**
(crows are the projectile class: they fly in 8 % faster than the ground scrolls, so no extra acorn was needed), missed coin **1**.
`focus = 100 × (1 − Σ w·rate / Σ w)` with rate = hits / opportunities (obstacles faced, crows faced, coins offered), so it is
comparable across speeds and run lengths. Computed per 30 s segment, per round (pooled), and as a within-round trend
(slope in points per segment: > +1 warming up, < −1 tiring, else steady). Engine 0.2.0 logs exposure counters
(`obstaclesFaced, projectilesFaced, crashesObstacle, crashesProjectile, coinsOffered, coinsMissed`); 0.1.0 logs are estimated
(obstacles ≈ jumps + ducks + crashes, coins offered ≈ 0.5 × obstacles) and capped at confidence 0.45.

## Profile (`tools/profile.js`)
`node games/shared/tools/profile.js` → `games/data/player-profile.human.json`: human logs only (logs/human, games/*/logs/human),
per quality an exponentially weighted mean (half-life 5 logs, newest heaviest), pooled confidence, n logs, and per-game values.

## Recommender (`recommend.js`)
`Recommend.recommend(task, minutesAvailable, state)` → ranked `[{game, path, minutes, score, why}]`. Tasks: warm-up, focus-check,
tone-data, creative-input, break, triage (mail triage warm-up / triage data → Parcel Panic). State = `stateFromLogs(logs)`: mean focus and endurance over the last 6 h, minutes played in the
last hour. Rules: focus-check → Lynx Dash; warm-up → Tetris (Lynx Dash if recent focus < 60); tone-data → Lynx Dash, or Tone Pit
when short on time / tired (≥ 30 min this hour or endurance < 40); games longer than the time available drop; low recent focus on
tone-data adds a "short break" option, because tired picks are noisier. `games/index.html` runs it on localStorage logs.
Task `triage` (Mail triage warm-up / triage data) → Parcel Panic first (each sort also grades the local Ollama models; see games/parcels/LOOP.md), Tetris second; with low recent focus it notes that drops near the middle or changed minds count less. Since game 0.3.0 Parcel Panic is a calm 2D priority field (urgency × importance → priority 0-100 and a 'your queue' list); bins v2 at `?v=2`, classic v1 at `?v=1`.

### Parcel Panic modes (round 4)
`?mode=handling` is a second stage after priority. It should be recommended once a priority log exists for the current round. Sim logs and ledger files (`*.sim.json`) never feed the recommender's human signals or the human ledger.

`?mode=session` (game 0.5.0, entry `parcelsSession`, ~8 min) chains warm-up → priority → handling → cluster (×2 cycles) → outputs. Recommended second for `triage` when there are ≥ 8 minutes and he isn't tired. Session logs go through `tools/session-process.js`; sim session logs only touch `*.sim.json` and `outputs/sim/`. See games/parcels/SESSION.md.

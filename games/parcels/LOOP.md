# Parcel Panic × Ollama loop

Parcel Panic (`/games/parcels/`) is mail triage as an arcade game: fictional inbox parcels fall down a belt and you sort the
glowing one into **Reply · Archive · Later · Needs info · Spam/ignore** (swipe → ← ↑ ↓ or tap a bin; "Needs info" is tap only).
4 time-based waves (35/35/40/40 s, speed 1.0→1.95× and +15 % within each wave), combos, misses, and one A/B question between
waves (which of two model-written summary badges makes a parcel quicker to sort, or *Neither*). About 3.5–4 minutes.

Local Ollama models compete to triage **like Markus**. The static page can't call Ollama, so the loop runs on the box between rounds:

```
round-N.json ──play──▶ log in logs/human/ ──next-round.js──▶ grade + leaderboard ──▶ models get feedback ──▶ round-(N+1).json
```

## Round file (`rounds/round-NNN.json`, schema `parcels-round` 1.0.0)
`parcels[]` (id, senderType, sender, subject, snippet, badge, author = `seed` or a model, anchor), `bins`, `models{<model>{labels,
summaries, rubric, authored, stats}}`, `abQuestions[]` (3, model A vs model B summary for one parcel), `reference` (seed author's own
bins: sanity check only, plus anchors for the accuracy quality). The game never shows `models[*].labels` (blind); only the A/B
summaries are shown, without saying which model wrote which. `rounds/index.json` → `current` = the round the page loads
(`?round=<id>` overrides). Everything is **synthetic**: no real mail, names or addresses.

## Steps of `tools/next-round.js` (round N → N+1)
1. **Grade.** Each model's blind bin for every parcel Markus sorted is compared with his bin. Each of his sorts is weighted by
   how sure he looked: changed mind ×0.4; slower than his median → median/time (floor 0.3); × wave focus
   (1 − (misses + 0.5·changes)/shown, floor 0.3); × (0.5 + 0.5·round focus/100) from the shared qualities. Missed parcels don't count;
   repeats (once all parcels were shown) feed consistency only. Model score = 0.7 weighted agreement + 0.2 A/B win rate for its
   summaries + 0.1 "clarity" of parcels it wrote (mean weight of Markus's sorts on them), renormalised over the parts present.
2. **Leaderboard** `data/model-scores.json` (human only; history per round, latest, trend, ranking). Sim runs go to
   `data/model-scores.sim.json` and are never mixed in.
3. **Feedback → generation.** Each model gets its agreement, its top-10 weighted misses (subject, its bin, his bin), his sorts per
   sender type and its A/B record, and is asked for a revised 3–5 rule rubric plus 10 new fictional parcels with its own bins.
4. **Validate + build.** Parcels must pass: JSON shape, known senderType/bin, lengths, snippet ≥ 20 chars, no placeholders,
   no emails/URLs/phone numbers, no person-like sender names, no real big-brand names, no copy of the prompt example, no duplicate
   subjects. One retry with the problems listed. Round N+1 = 20 carried parcels from N (most disputed first) + the valid model
   parcels, shuffled deterministically; then **every model labels every parcel blind** using its own new rubric and writes
   summaries; 3 A/B questions are picked. A model that writes poor parcels simply gets fewer in, and a bad rubric shows up as
   lower agreement next round.

Determinism: temperature 0, seed 42, num_ctx 4096, fixed prompts; every call is saved in `runs/<next-round>/` (prompt, sha256,
raw output, timing, token counts) with a `manifest.json` (grades, rejects, rubrics, wall time).

## Markus: play and upload a round
1. Play https://markus-grokbot.github.io/games/parcels/ on the phone, then tap **⬇ Download log** on the summary screen
   (file `human-parcels-round-001-<runid>.json`).
2. On GitHub: repo `markus-grokbot/markus-grokbot.github.io` → `logs/human/` → **Add file → Upload files** → commit.

## Box: run the next round
```
cd /workspace/site && git pull
node games/parcels/tools/next-round.js            # current round (rounds/index.json) + newest matching log in logs/human/
git add games/parcels logs && git commit -m "Parcel Panic: grade round-001, build round-002" && git push
```
Ollama must be up (this box: `OLLAMA_HOST=127.0.0.1:11555 OLLAMA_MODELS=/workspace/media-pipeline/ollama/models
/workspace/media-pipeline/ollama/bin/ollama serve`); the script tries `$OLLAMA_URL`, :11555, then :11434. Takes ~3–5 min on CPU.
Options: `--round round-001 --log logs/human/<file>.json`, `--models a,b`, `--per-model 10`, `--carry 20`, `--force` (re-grade).

## Sim / dry run (never touches the human leaderboard or `current`)
```
node games/parcels/sim/run-sim.js --round round-001 --skill casual --seed 1        # -> logs/sim/parcels-round-001-casual-seed1.json
node games/parcels/tools/next-round.js --sim --log logs/sim/parcels-round-001-casual-seed1.json   # -> rounds/round-002-sim.json
node games/parcels/sim/headless-check.mjs "http://127.0.0.1:8765/games/parcels/?sim=1&fast=16"   # Chrome 390x844, JS errors
```
The human pipeline refuses sim logs and sim rounds; `--sim` refuses human logs.

## Seeding
`tools/seed-round.js` built round-001 from `tools/seed-parcels.json` (40 hand-written fictional parcels) and blind predictions
+ summaries from llama3.2:3b and qwen2.5:1.5b (`runs/round-001-seed/`).

## v2 "field" interaction (game 0.2.0, default; classic v1 at `?v=1` → `classic.html`)
Markus's round-1 feedback: v1 was too fast to feel his sorts were accurate (21/58 missed, median sort 4.5 s). So round-001 was
graded with `--round-weight 0.5` (every decision weight ×0.5 and `roundWeight: 0.5` + note stored in `data/model-scores.json`
rounds/history; within one round the weighted agreement is a ratio and does not change, the factor matters in the per-model
`cumulative` score = roundWeight-weighted mean over rounds).

v2: one parcel at a time drifts from the top to the centre of a 2D field and shows a countdown (wave 1 6.0 s, wave 2 5.2 s,
wave 3 4.4 s, each tightening 8 % within the wave; 3 × 50 s waves, 0.9 s gap). Drag with a finger **anywhere on the field**
(relative 1:1 drag, pointer capture, `touch-action:none`, document touchmove blocked, so the page never scrolls); a ring
marker shows the exact point, the card stays on-screen; `navigator.vibrate(12)` when entering a strong zone (Android only).
Release = commit; timeout while held = commit at that spot (`timedOut:true`); never touched = miss.

Axis mapping (`axes.js`, version 1.0.0), coordinates in [-1,1]:
| axis | −1 | +1 |
|---|---|---|
| x | act now (Reply, Needs info) | not now (Later, Archive) |
| y | noise (Spam) | worth it (Reply, Later) |

Zone centres: Reply (−0.65, 0.62), Needs info (−0.65, −0.05), Later (0.65, 0.62), Archive (0.65, −0.05), Spam (0, −0.78);
drawn as soft radial gradients. Logged per parcel: x, y, distance to each centre, `soft` = softmax(−d²/0.22), `bin` = argmax,
`confX` = |x|, `confY` = |y|, `conf` = max. Partial sorting: a clear x with y near 0 still splits between e.g. Reply/Needs info
and pays points ∝ the stronger axis (60 + 60·conf + 40·time left; conf < 0.25 = "undecided", 10 pts, combo reset).

Grading v2 logs (`tools/lib.js grade`): agreement = human `soft[modelBin]` (expected agreement), decision weight × (0.5 + 0.5·conf).
Per axis, each model bin has a target (Reply (−1, 1), Needs info (−0.8, 0.3), Later (0.8, 0.6), Archive (1, −0.2), Spam (–, −1))
and `axisX`/`axisY` = confidence-weighted 1 − |human − target|/2, reported in the leaderboard (score formula unchanged:
0.7 agreement + 0.2 A/B + 0.1 authored clarity). v1 logs grade as one-hot at the zone centre, so their numbers are unchanged.
Qualities: accuracy = mean soft prob on anchor bins, decisiveness = mean `conf` (merged with A/B).
Sim: `node games/parcels/sim/run-sim2.js --round round-002 --skill good --seed 1` (bot aims at its guess's centre with noise,
sometimes one axis only). Browser: `?sim=1&skill=good&fast=16`; drag test: `node games/parcels/sim/drag-check.mjs`.

## v3 "priority" (game 0.3.0, default from round-003; bins v2 at `?v=2`, classic v1 at `?v=1`)
Markus after round-002: "noticeably better, but should to a large extent be used for priority, not ultimate decisions."
Same calm drag field, countdown and pace as v2, but the axes are priority, not verdicts (`priority.js` 1.0.0):

| axis | left / bottom | right / top |
|---|---|---|
| x = urgency | **now** (urgency 100) | **can wait** (0) |
| y = importance | **low value** (0) | **matters** (100) |

urgency = 100·(1−x)/2, importance = 100·(1+y)/2, **priority = 0.6·importance + 0.4·urgency** (0–100). Quadrants are
labels only: 🔥 **Handle first** (now + matters), 📅 **Schedule** (can wait + matters), 👀 **Quick skim** (now + low value),
💤 **Deprioritise** (can wait + low value). Axis confidence = |x|, |y|. No Archive/Spam verdicts. The round end shows
**Your queue**: every parcel (first placement) sorted by priority. Log: decisions carry urgency, importance, priority,
quadrant, confX/confY; summary.parcels.queue/quadrants/meanPriority.

Model task from round-003: blind **{urgency, importance} 0–100 per parcel** (`labelAllPriority`, stored in
`round.models[m].positions`, round `task: "priority"`) plus the summary badge; the parcels they write carry `authorPos`.
Grading (`grade().priority`): per axis 1 − |model − human|/100, weighted by Markus's confidence on that axis × decision
weight; `priority.agreement` is the score's agreement term for priority rounds; also urgency/importance separately and the
mean absolute priority error. A/B summaries and authored clarity are unchanged.

**History mapping** (approximate, so bin rounds stay comparable): old bins → (urgency, importance): Reply (85, 80),
Needs info (75, 55), Later (20, 75), Archive (20, 30), Spam (10, 5). v2 drops convert directly (act now ≈ urgent,
worth it ≈ matters). Rounds 001–002 keep their bin-based `score`; their `priority` block uses this mapping for both the model
labels and v1 human sorts, so it is an estimate, not a measured position.
Sim: `node games/parcels/sim/run-sim3.js --round round-003`; browser `?sim=1&skill=good&fast=16`; `next-round.js --grade-only` re-grades without Ollama generation.

## Round 4: handling stage + consistency ledger (v0.4.0)

**Handling mode** (`?mode=handling`, same drag field). Parcels: `round.handling.parcels`. These are the parcels his latest priority run put in 🔥 Handle first, then 📅 Schedule, highest priority first, up to 16. Parcels already settled for handling are left out.
- x: best automated ◀ ▶ best manually reviewed. `manual = 100(1+x)/2`, `automation = 100 − manual`.
- y: relative budget spend, high at the top. `spend = 100(1+y)/2`.
- Tier (handling.js): manual > 60 → manual review. The spend then counts as a reserve for later agentic work. Manual 40–60 → hybrid (tier prep + review). Otherwise the tier comes from spend: local Ollama <25, OpenCode free <50, Codex <75, Grok Build.
- Output: `summary.parcels.plan[]` holds {automation, manual, spend, budgetShare (% of the pool, spend-weighted), tier, quadrant}, plus `budgetPool` {automatedShare, manualReserveShare}. This is an assessment only. Nothing runs.
- Models predict {manual, spend} per handling parcel (`models[m].handling`). They are graded per axis, weighted by his confidence on that axis (`grades[m].handling`, `scoreWithHandling = .75·score + .25·handling`).

**Consistency ledger.** The human ledger is `data/parcel-ledger.json`. The sim writes only `parcel-ledger.sim.json`. The rule is in ledger.js (RULE v1.0.0):
- Two evaluations are *consistent* when they share a quadrant, lie within 0.5 field units (25 points) of each other, and both have conf ≥ 0.25.
- **Settled** = the last 3 counting human evaluations of that mode are pairwise-consecutively consistent. Settled parcels leave the rotation.
- An undecided drop resets the streak.
- 5 counting tries without settling → **manual-review**, which also leaves the rotation.
- Model evaluations are stored but never count toward settling. v1 bin drops are stored with counts:false.
- Round build: the ledger's open parcels come first (closest to settling, then fewest tries), then never-counted ones, then the models' new parcels. engine.source spaces repeats within a round (min gap ≤ 8).
- The end screen previews the ledger effect of the run. It is applied when the log is graded.

Grading with both logs: `node tools/next-round.js --round round-004 --log <priority.json>,<handling.json> --force`. To rebuild the ledger: `node games/parcels/tools/ledger.js --rebuild`.

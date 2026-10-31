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

# Lo · Cambio (Lynx Dash variant)

This is a variant of `../lo-preferences`. It reuses that folder's `engine.js`, `prefs.js` and `timer.js` unchanged. The only shared change is that `importSessions` also accepts `game: "lo-cambio"`. The cards feed the Cambio support-copilot project, and **all content is synthetic**.
Its own files are `game.js` (a fork of the lo-preferences page), `cambio.js` (log → Cambio records), `data/areas.json` (source) and the generated `data/core.js` (levels 1–2, loaded first) + `data/cards-l3.js` (level-3 ticket cards, loaded in the background).

Regenerate: `node tools/gen.js <cambio-associate-ai-engineer checkout> && node tools/pack.js`. Test: `node test/test.js`.

## Levels (Casual ↔ Data slider)
| Level | Cards | Weight | Review |
|---|---|---|---|
| 1 | scope + talking (incl. Fri round-5 rules/golden-label cards) | ×0.25 | weekend |
| 2 | + edge cases (incl. Fri G-003 / space-PNR), abbreviations (27) | ×0.5 | weekend |
| 3 | + synthetic ticket judgments (category, route, needs_human, contains_pii, naturalness × 56 tickets + up/down) | ×1 | Monday |
| 4 | data creation on **existing** synthetic tickets/abbreviations: ticket rewrite (`ticket_edit.v1`), bulk label (`bulk_label.v1`), abbreviation verification + optional source (`abbreviation_verification.v1`), optional PII spans (`pii_span_annotation.v1`) | ×1.5, counted only with ≥80% performance | immediate |
| 5 | new-ticket authoring from scratch (`new_ticket.v1`) + higher-volume passes: **coming later** (Run disabled; `?preview45=1` still replays lower-level cards at strict weighting) | ×2, counted only with ≥80% performance | immediate |

Card interval: 30 s at levels 1–2, 15 s at levels 3–5.

## Export (`result.cambio`, schema `lo-cambio.export.v1`)
- `golden_label_votes[]`: `{ticket_id, field: category|route|needs_human|contains_pii, vote, dataset_label, agrees, weight, ms, at, card}`. The `ticket_id` is the `id` in `prep/synthetic-data/merged/clean.json`. A vote with `agrees: false` is a review candidate. Votes with weight ≥1 can become golden labels.
- `naturalness[]`: `{ticket_id, rating -2..2}`. Low ratings mark tickets to rewrite (level 4).
- `scope_decisions[]`: `{decision_id, choice, label}`. These feed the README scope freeze in cambio-support-copilot.
- `abbreviation_picks[]`: `{abbr, picked, picked_ambiguous, dont_know, dataset_expansions, dataset_ambiguous, in_dataset}`. A pick with `in_dataset: false` needs checking against `prep/swedish-medical-abbreviations.json`.
- `edge_case_votes[]` + `edge_case_ranking[]`: which `prep/local-models/REPORT.md` failure to feature.
- `talking_point_ranking[]`: `{id, label, wins, shown, score, rank}`.
- `level45`: `{status: "level-4-playable", level5: "coming-later", schemas: {ticket_edit.v1, new_ticket.v1, bulk_label.v1, abbreviation_verification.v1, pii_span_annotation.v1}, records: [...]}`. Level-4 answers fill `records` with the matching schema. `new_ticket.v1` stays unused until level 5. Low `naturalness[]` ratings still mark tickets to rewrite at level 4.

## Round 2 (2026-11-04)
- +11 scope suggestion cards (`sc2-*`, incl. tiebreaks `sc2-tb-backup`, `sc2-tb-live-fail` that reuse the round-1 decision ids), +10 "which point to lead with" talking cards (`tp2-*`).
- Abbreviation cards carry `reveal` (expansions + one-line example); shown after every answer, incl. "Don't know" (still exported as `dont_know`).
- Areas with an empty executor list fall back to defaults, so `costPlan.areas.talking.allowedExecutors` is no longer empty. Cache param `v=c3`.

## Round 3 (2026-11-05): typed overrides
Every card now has an optional **"✍ Or write your own"** field (16px, so iOS doesn't zoom). Typing is optional. If you pick a choice with an empty field, nothing changes. If you type text and then pick a choice, the typed text is the authoritative answer and the choice is kept as context. If you type text and press "Send my own answer" (or Enter), it is a text-only reply. Abbreviation reveals still show after a typed reply, and the countdown and card intervals are unchanged. Cache param `v=c4`.
Export additions are optional fields, so `lo-cambio.export.v1` consumers keep working:
- In `log[]`: `manualReply` (string) and `overridden: true`. A text-only entry has `choice: "manual"` and `pref: null`, so it adds no preference count.
- Records in `golden_label_votes`, `scope_decisions`, `abbreviation_picks` and `edge_case_votes` that have a picked choice plus text also get `manualReply` and `overridden: true`.
- New `manual_replies[]`: `{card, area, kind, ref, field, prompt, manualReply, overridden, selected_choice, selected_label, selected_value, dataset_label, dataset_expansions, ms, at}`. `selected_*` is null for text-only replies. Text-only replies appear **only** here, never as votes.
- Consumers should treat `manualReply` as the player's stated preference or judgment. It takes precedence over the picked choice. Do not discard it.

## Round 4 (2026-11-05): data-creation level 4
Level 4 is playable. Slide Casual ↔ Data to **4**, keep the tickets / abbreviations areas on, ▶ Run. Interval stays 15 s; 3-second countdown unchanged. Typed override still works; for rewrite cards the **"Or write your own"** box **is** the edit field (larger textarea). Abbreviation-verification cards add an optional **Source URL** field (16px); suggested sources are real public pages (e.g. Socialstyrelsens termbank, 1177) when checked — otherwise leave blank and paste your own. Do not invent citations.
Export: `cambio.level45.records[]` entries use `ticket_edit.v1`, `bulk_label.v1`, `abbreviation_verification.v1` (with `source_url` when provided), and `pii_span_annotation.v1`. Level 5 (author new tickets from scratch) stays gated. Cache param `v=c5`.

## Round 5 (2026-11-06 Fri): rules + golden labels
Friday work is **rules and golden labels**, not RAG/UI. Play Casual **1–3** with areas **scope / talking / edge / tickets** on (abbr optional — regenerating already covers ADL, KAVA, UL, us, inf, MAS, ssk, usk).

**Locked already (do not re-open):** backup = recording + offline report (`both`); live failure = patient-data handoff (`patient-handoff`); talking-point lead = Human approval gate + audit trace (18:09 export 2/3).

**New L1 scope decisions (`sc5-*`, `decision_id`s):** `g003-fix`, `luhn-invalid-policy`, `name-access-no-valid-pnr`, `rules-pii-second`, `g003-interview-example`, `golden-label-source`, `pii-shape-luhn-fail`, `personnummer-shapes`. Plus Friday talking pairs (`tp5-*`) and up/down cards for rules vs golden-label priority.

**L2 edge (`ec5-*`):** `samordningsnummer`, `g003-handoff`, `space-pnr`, `luhn-invalid-shapes` (rating + pair → `edge_case_votes`).

**L3 tickets:** regenerated from `clean.json` (**56** tickets). The 14 new gap ids are `grok-build-gaps-2026-11-05:G-001`…`G-010` and `local-qwen2.5-7b-2026-11-05:L-001`…`L-004`. Each gets category / route / needs_human / contains_pii / naturalness cards.

**Codex leftovers for golden labels (play these carefully):**
- **G-008** (*Saknar funktion för att jämföra två vårdtillfällen…*): dataset `needs_human=true` + `human_handoff` vs Codex `needs_human=false` + `kb_answer`.
- **G-009** (*Beställning av avvikelsestatistik per enhet*): dataset `needs_human=false` vs Codex `needs_human=true` (both keep `dev_team`).
Adopted already (do not re-litigate): G-001 priority high, G-006 critical, G-003 category `login_access`. G-003 remains the known rules xfail (samordningsnummer miss → `awaiting_approval`).

**How to play Friday:** slide Casual ↔ Data to **1–3**, keep **scope**, **talking**, **edge**, **tickets** checked, ▶ Run. Interval 30 s at 1–2, 15 s at 3. Export still `lo-cambio.export.v1`. Cache param `v=c6`.

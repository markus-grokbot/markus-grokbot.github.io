# Lo · Cambio (Lynx Dash variant)

This is a variant of `../lo-preferences`. It reuses that folder's `engine.js`, `prefs.js` and `timer.js` unchanged. The only shared change is that `importSessions` also accepts `game: "lo-cambio"`. The cards feed the Cambio support-copilot project, and **all content is synthetic**.
Its own files are `game.js` (a fork of the lo-preferences page), `cambio.js` (log → Cambio records), `data/areas.json` and the generated `data/areas.js`.

Regenerate: `node tools/gen.js <cambio-associate-ai-engineer checkout> && node tools/pack.js`. Test: `node test/test.js`.

## Levels (Casual ↔ Data slider)
| Level | Cards | Weight | Review |
|---|---|---|---|
| 1 | scope (14), talking points (16) | ×0.25 | weekend |
| 2 | + edge cases (21), abbreviations (27) | ×0.5 | weekend |
| 3 | + synthetic ticket judgments (211: category, route, needs_human, contains_pii, naturalness × 42 tickets + 1) | ×1 | Monday |
| 4–5 | data creation: **coming later** (Run disabled; `?preview45=1` plays the level 1–3 cards at strict weighting) | ×1.5 / ×2, counted only with ≥80% performance | immediate |

Card interval: 30 s at levels 1–2, 15 s at levels 3–5.

## Export (`result.cambio`, schema `lo-cambio.export.v1`)
- `golden_label_votes[]`: `{ticket_id, field: category|route|needs_human|contains_pii, vote, dataset_label, agrees, weight, ms, at, card}`. The `ticket_id` is the `id` in `prep/synthetic-data/merged/clean.json`. A vote with `agrees: false` is a review candidate. Votes with weight ≥1 can become golden labels.
- `naturalness[]`: `{ticket_id, rating -2..2}`. Low ratings mark tickets to rewrite (level 4).
- `scope_decisions[]`: `{decision_id, choice, label}`. These feed the README scope freeze in cambio-support-copilot.
- `abbreviation_picks[]`: `{abbr, picked, picked_ambiguous, dont_know, dataset_expansions, dataset_ambiguous, in_dataset}`. A pick with `in_dataset: false` needs checking against `prep/swedish-medical-abbreviations.json`.
- `edge_case_votes[]` + `edge_case_ranking[]`: which `prep/local-models/REPORT.md` failure to feature.
- `talking_point_ranking[]`: `{id, label, wins, shown, score, rank}`.
- `level45`: `{status: "coming-later", schemas: {ticket_edit.v1, new_ticket.v1, bulk_label.v1, abbreviation_verification.v1, pii_span_annotation.v1}, records: []}`.

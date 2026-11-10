#!/usr/bin/env python3
"""Helpers for interview-prep Lo cards. Facts only; no employee names."""
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "intervju-cards.json"
ACC = ROOT / "data" / "_intervju_accum.jsonl"

AREAS = [
    {
        "id": "intervju",
        "name": "Intervju \u00b7 fakta",
        "description": "Scored mock-interview questions (adaptive difficulty). Facts from the public demo and the redacted briefing.",
        "level": 1,
        "defaultOn": True,
        "decisions": [],
    },
    {
        "id": "kalibrering",
        "name": "Intervju \u00b7 kalibrering",
        "description": "Open personal questions: no correct answer. Picks and free text export as calibration cues.",
        "level": 1,
        "defaultOn": True,
        "decisions": [],
    },
]


def opt(cid, choices):
    return [{"label": lab, "pref": "cam:iq:%s:%s" % (cid, val), "value": val} for lab, val in choices]


def scored(cid, difficulty, prompt, choices, correct, hint, reword, explain, aliases=None):
    values = [v for _, v in choices]
    if correct not in values:
        raise SystemExit("%s: correct %r not in %s" % (cid, correct, values))
    if len(choices) < 3:
        raise SystemExit("%s: need >=3 options" % cid)
    return {
        "id": cid,
        "area": "intervju",
        "level": 1,
        "difficulty": difficulty,
        "type": "choice",
        "prompt": prompt,
        "options": opt(cid, choices),
        "correct": correct,
        "hint": hint,
        "reword": reword,
        "explain": explain,
        "aliases": aliases or [],
        "scored": True,
        "adaptive": True,
        "source": "interview-prep-2026-11-10",
    }


def cal(cid, theme, prompt, choices, tip, consistency_of=None):
    if not (2 <= len(choices) <= 4):
        raise SystemExit("%s: calibration needs 2-4 stances, got %d" % (cid, len(choices)))
    cambio = {"kind": "calibration", "theme": theme}
    if consistency_of:
        cambio["consistencyOf"] = consistency_of
    return {
        "id": cid,
        "area": "kalibrering",
        "level": 1,
        "difficulty": 1,
        "type": "choice",
        "kind": "calibration",
        "prompt": prompt,
        "options": [{"label": lab, "pref": "cam:cal:%s:%s" % (cid, val), "value": val} for lab, val in choices],
        "tip": tip,
        "scored": False,
        "adaptive": True,
        "cambio": cambio,
        "source": "interview-prep-2026-11-10",
    }


def append(cards):
    ACC.parent.mkdir(parents=True, exist_ok=True)
    with ACC.open("a", encoding="utf-8") as f:
        for c in cards:
            f.write(json.dumps(c, ensure_ascii=False) + "\n")
    print("appended", len(cards), "->", ACC)


def assemble():
    cards = []
    if ACC.exists():
        for line in ACC.read_text(encoding="utf-8").splitlines():
            if line.strip():
                cards.append(json.loads(line))
    ids = [c["id"] for c in cards]
    dups = [i for i, n in Counter(ids).items() if n > 1]
    if dups:
        raise SystemExit("duplicate ids: %s" % dups)
    scored_cards = [c for c in cards if c.get("scored")]
    by = Counter(c["difficulty"] for c in scored_cards)
    print("scored per difficulty:", dict(sorted(by.items())))
    for d in range(1, 6):
        if by[d] < 15:
            raise SystemExit("need >=15 scored at difficulty %d, got %d" % (d, by[d]))
    blob = json.dumps(cards, ensure_ascii=False)
    for bad in ["Martin Rehn", "martin.rehn", "@cambio.se"]:
        if bad.lower() in blob.lower():
            raise SystemExit("redaction failed: %s" % bad)
    doc = {
        "version": 1,
        "note": "Interview-prep cards for Lo Cambio adaptive rounds. Factual cards are scored; calibration cards are not.",
        "areas": AREAS,
        "cards": cards,
    }
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    cal_n = sum(1 for c in cards if c.get("kind") == "calibration")
    print("wrote %s (%d scored, %d calibration, %d bytes)" % (OUT, len(scored_cards), cal_n, OUT.stat().st_size))

#!/usr/bin/env python3
"""Quality-review Taboo card decks via Codex.

For each batch of N cards, ask Codex to flag any cards that are:
  - culturally inappropriate, NSFW, ageist, etc.
  - too obscure for ordinary players
  - have poor / unrelated forbidden words
  - ambiguous topic
  - too similar in spirit to another card in the batch

Resumable: writes verdicts to backend/data/_review_<lang>.json keyed by card id;
re-runs skip cards already reviewed.

Usage:
  python scripts/review_cards.py --language en --batch-size 30
  python scripts/review_cards.py --language pt --batch-size 30
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DECK_PATHS = {
    "en": REPO / "backend/data/taboo_cards_english.json",
    "pt": REPO / "backend/data/taboo_cards_portuguese.json",
}
SIDE_PATHS = {
    "en": REPO / "backend/data/_review_en.json",
    "pt": REPO / "backend/data/_review_pt.json",
}
LANG_NAME = {"en": "English", "pt": "Brazilian Portuguese"}


def build_prompt(language: str, cards: list[dict]) -> str:
    block = "\n".join(
        f'{i+1}. id={c["id"]}  wordToGuess="{c["wordToGuess"]}"  forbiddenWords={c["forbiddenWords"]}'
        for i, c in enumerate(cards)
    )
    return f"""You are quality-reviewing {LANG_NAME[language]} Taboo party-game cards.

For each card below, output ONE line:
  <id> | ok
or
  <id> | flagged | <short reason>

Flag a card ONLY for these reasons:
  - inappropriate (NSFW, drug-glorifying, slur-adjacent, politically charged)
  - too obscure (ordinary players won't recognize wordToGuess)
  - poor forbidden words (don't relate to the topic, or so unrelated that
    they'd never come up naturally)
  - ambiguous wordToGuess (multiple equally common meanings, hard to clue)

Do NOT flag for stylistic preferences. Most cards should be 'ok'.

CARDS:
{block}

OUTPUT: one line per card, in the same order. No prose, no headers.
"""


def call_codex(prompt: str, timeout: int = 240) -> str:
    proc = subprocess.run(
        ["codex", "exec", "--skip-git-repo-check"],
        input=prompt,
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    return proc.stdout


def parse_verdicts(text: str, expected_ids: set[str]) -> dict[str, dict]:
    """Extract `id | ok` or `id | flagged | reason` lines."""
    verdicts: dict[str, dict] = {}
    for line in text.splitlines():
        line = line.strip()
        if "|" not in line:
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 2:
            continue
        card_id = parts[0].strip()
        if card_id not in expected_ids:
            continue
        verdict = parts[1].lower()
        if verdict == "ok":
            verdicts[card_id] = {"verdict": "ok"}
        elif verdict == "flagged":
            reason = " | ".join(parts[2:]) if len(parts) > 2 else "(no reason)"
            verdicts[card_id] = {"verdict": "flagged", "reason": reason}
    return verdicts


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--language", choices=["en", "pt"], required=True)
    ap.add_argument("--batch-size", type=int, default=30)
    ap.add_argument("--max-batches", type=int, default=200)
    args = ap.parse_args()

    deck_path = DECK_PATHS[args.language]
    side_path = SIDE_PATHS[args.language]

    cards = json.loads(deck_path.read_text())
    reviewed: dict[str, dict] = json.loads(side_path.read_text()) if side_path.exists() else {}

    unreviewed = [c for c in cards if c["id"] not in reviewed]
    print(f"[review {args.language}] {len(cards)} cards total, {len(reviewed)} reviewed, {len(unreviewed)} remaining")

    batches_run = 0
    while unreviewed and batches_run < args.max_batches:
        batch = unreviewed[: args.batch_size]
        prompt = build_prompt(args.language, batch)
        batches_run += 1
        t0 = time.time()
        print(f"[batch {batches_run}] reviewing {len(batch)} cards...", flush=True)
        try:
            response = call_codex(prompt)
        except subprocess.TimeoutExpired:
            print(f"[batch {batches_run}] codex timeout, skipping batch")
            unreviewed = unreviewed[args.batch_size:]
            continue
        except Exception as e:
            print(f"[batch {batches_run}] codex error: {e}")
            unreviewed = unreviewed[args.batch_size:]
            continue

        expected = {c["id"] for c in batch}
        verdicts = parse_verdicts(response, expected)
        reviewed.update(verdicts)
        side_path.write_text(json.dumps(reviewed, ensure_ascii=False, indent=2))

        dt = time.time() - t0
        ok = sum(1 for v in verdicts.values() if v["verdict"] == "ok")
        flagged = sum(1 for v in verdicts.values() if v["verdict"] == "flagged")
        missing = len(batch) - len(verdicts)
        print(
            f"[batch {batches_run}] {ok} ok, {flagged} flagged, {missing} missing "
            f"in {dt:.1f}s; total reviewed={len(reviewed)}",
            flush=True,
        )
        unreviewed = [c for c in cards if c["id"] not in reviewed]

    flagged_total = sum(1 for v in reviewed.values() if v["verdict"] == "flagged")
    print(f"[done {args.language}] reviewed {len(reviewed)} cards, {flagged_total} flagged")
    return 0


if __name__ == "__main__":
    sys.exit(main())

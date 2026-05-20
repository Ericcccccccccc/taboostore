#!/usr/bin/env python3
"""Generate Taboo cards via Codex in batches.

Usage:
  python scripts/generate_cards.py --language en --target 1500 --batch-size 25
  python scripts/generate_cards.py --language pt --target 2000 --batch-size 25

Reads the live deck JSON, generates cards until the deck reaches `target`,
saves after every successful batch. Resumable: if interrupted, re-run.

Each batch is validated by `scripts/validate_cards.py` logic (inlined here for
in-memory checks). Invalid cards are dropped with a log line.
"""
from __future__ import annotations

import argparse
import json
import random
import subprocess
import sys
import time
import unicodedata
import uuid
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DATA = {
    "en": REPO / "backend/data/taboo_cards_english.json",
    "pt": REPO / "backend/data/taboo_cards_portuguese.json",
}
LANG_NAME = {"en": "English", "pt": "Brazilian Portuguese"}


def norm(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFKD", s.casefold()) if not unicodedata.combining(c)
    )


def load_deck(path: Path) -> list[dict]:
    return json.loads(path.read_text())


def save_deck(path: Path, cards: list[dict]) -> None:
    path.write_text(json.dumps(cards, ensure_ascii=False, indent=2))


def card_valid(card: dict, existing_words_norm: set[str]) -> tuple[bool, str]:
    word = card.get("wordToGuess")
    fb = card.get("forbiddenWords")
    if not isinstance(word, str) or not word.strip():
        return False, "empty wordToGuess"
    if not isinstance(fb, list) or len(fb) != 5:
        return False, f"forbiddenWords has {len(fb) if isinstance(fb, list) else 0}/5"
    wn = norm(word.strip())
    if wn in existing_words_norm:
        return False, f"duplicate wordToGuess '{word}'"
    normed = [norm(f.strip()) if isinstance(f, str) else "" for f in fb]
    if any(not n for n in normed):
        return False, "empty forbidden word"
    if len(set(normed)) != 5:
        return False, "forbidden words not unique within card"
    for f, fn in zip(fb, normed):
        if fn in wn:
            return False, f"forbidden word '{f}' is substring of '{word}'"
    return True, ""


CATEGORY_HINTS = [
    "kitchen tools & cooking implements",
    "professions and occupations (concrete roles, not famous people)",
    "specific sports, hobbies, and pastimes",
    "musical instruments and music genres",
    "vehicles and transportation (specific types)",
    "geographic features and natural landmarks",
    "weather phenomena and astronomy",
    "specific foods, dishes, and ingredients",
    "specific animals (less common, e.g. tapir, anteater, octopus)",
    "tools, hardware, and DIY items",
    "office supplies and stationery",
    "garments and accessories (specific items)",
    "household furniture and fixtures",
    "feelings, emotions, abstract concepts",
    "actions and verbs (running, juggling, climbing)",
    "specific buildings or rooms (greenhouse, attic, balcony)",
    "art and craft supplies / techniques",
    "celebrations, holidays, and traditions",
    "body parts (less common — knuckle, eyelash, shin)",
    "everyday consumer products with a specific function",
]


def build_prompt(language: str, batch_size: int, exclusions: list[str], category_hint: str) -> str:
    return f"""You are generating Taboo party-game cards in {LANG_NAME[language]}.

Output ONLY a JSON array of {batch_size} objects with this exact shape:
  {{ "wordToGuess": "...", "forbiddenWords": ["...","...","...","...","..."] }}

THEME FOR THIS BATCH: {category_hint}
Lean toward this theme but mix in a few cards from adjacent categories so the
batch isn't monotone. AVOID the obvious archetypal nouns — pick specific,
concrete, slightly-less-obvious ones that still feel familiar to ordinary
players.

HARD constraints (invalid output will be dropped):
- wordToGuess is one common noun or short two-word noun phrase. Not a
  sentence, not a brand novelty, suitable for any age.
- forbiddenWords MUST contain exactly 5 strings, all different from each other
  (case-insensitive), and NONE of them can appear as a substring of
  wordToGuess (case + diacritic insensitive). Example: for "Camarão" you
  cannot use "Mar" (cama-MAR-ão).
- The 5 forbidden words must be the 5 most natural words a clue-giver would
  reach for when describing wordToGuess — concrete nouns or verbs, common in
  everyday speech, not obscure.
- No phrases. No proper nouns of individual people. No politically charged
  topics. No NSFW content. No drug content.
- ALL wordToGuess values must be DISTINCT from each other within this batch
  AND from the exclusion list below. If unsure, pick a different word.

EXCLUSION LIST — these wordToGuess values are already used; do not reuse:
{json.dumps(exclusions, ensure_ascii=False)}

Output: a JSON array only. No surrounding prose, no markdown fences.
"""


def parse_json_array(text: str) -> list[dict]:
    """Extract the first JSON array out of arbitrary text."""
    start = text.find("[")
    if start == -1:
        return []
    depth = 0
    for i in range(start, len(text)):
        if text[i] == "[":
            depth += 1
        elif text[i] == "]":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(text[start : i + 1])
                except json.JSONDecodeError:
                    return []
    return []


def call_codex(prompt: str, timeout: int = 240) -> str:
    """Invoke codex exec, return stdout text."""
    proc = subprocess.run(
        ["codex", "exec", "--skip-git-repo-check"],
        input=prompt,
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    return proc.stdout


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--language", choices=["en", "pt"], required=True)
    ap.add_argument("--target", type=int, required=True)
    ap.add_argument("--batch-size", type=int, default=25)
    ap.add_argument("--sample-size", type=int, default=200, help="Existing words to send as exclusion sample.")
    ap.add_argument("--max-batches", type=int, default=200, help="Safety cap; one batch ~= one codex call.")
    args = ap.parse_args()

    path = DATA[args.language]
    cards = load_deck(path)
    print(f"[start] {path.name}: {len(cards)} cards, target {args.target}")

    batches_run = 0
    while len(cards) < args.target and batches_run < args.max_batches:
        existing_words_norm = {norm(c["wordToGuess"]) for c in cards}
        existing_words = [c["wordToGuess"] for c in cards]
        # Send the full exclusion list — at 1500 words × ~10 chars it's ~15KB,
        # well within context. Sampling causes too many duplicates.
        exclusions = existing_words
        category_hint = CATEGORY_HINTS[batches_run % len(CATEGORY_HINTS)]

        prompt = build_prompt(args.language, args.batch_size, exclusions, category_hint)
        batches_run += 1
        t0 = time.time()
        print(f"[batch {batches_run}] requesting {args.batch_size} cards... ({len(cards)}/{args.target})", flush=True)
        try:
            response = call_codex(prompt)
        except subprocess.TimeoutExpired:
            print(f"[batch {batches_run}] codex timeout, skipping")
            continue
        except Exception as e:
            print(f"[batch {batches_run}] codex error: {e}")
            continue

        proposed = parse_json_array(response)
        if not proposed:
            print(f"[batch {batches_run}] no JSON array parsed; response head: {response[:300]!r}")
            continue

        accepted = 0
        rejected = []
        for p in proposed:
            ok, reason = card_valid(p, existing_words_norm)
            if not ok:
                rejected.append((p.get("wordToGuess", "?"), reason))
                continue
            cards.append(
                {
                    "id": str(uuid.uuid4()),
                    "wordToGuess": p["wordToGuess"].strip(),
                    "forbiddenWords": [str(w).strip() for w in p["forbiddenWords"]],
                }
            )
            existing_words_norm.add(norm(p["wordToGuess"].strip()))
            accepted += 1

        save_deck(path, cards)
        dt = time.time() - t0
        print(
            f"[batch {batches_run}] accepted {accepted}/{args.batch_size} "
            f"({len(rejected)} rejected) in {dt:.1f}s, deck now {len(cards)}",
            flush=True,
        )
        if rejected:
            for word, reason in rejected[:5]:
                print(f"  - reject '{word}': {reason}")

    print(f"[done] {path.name}: {len(cards)} cards after {batches_run} batches")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Validate Taboo card JSON decks.

Checks per card:
  - id present (auto-generates uuid4 with --fix-ids)
  - wordToGuess: non-empty string
  - forbiddenWords: list of exactly 5 strings
  - forbidden words unique within card (case + diacritic-insensitive)
  - no forbidden word is a substring of wordToGuess (case + diacritic-insensitive)
  - wordToGuess unique across the deck (case + diacritic-insensitive)

Exit 0 if all pass; 1 with a numbered list of failures otherwise.
"""
from __future__ import annotations

import argparse
import json
import sys
import unicodedata
import uuid
from pathlib import Path


def normalize(s: str) -> str:
    """Lowercase + strip diacritics."""
    return "".join(
        c for c in unicodedata.normalize("NFKD", s.casefold()) if not unicodedata.combining(c)
    )


def validate_deck(cards: list[dict], deck_label: str) -> tuple[list[str], list[dict]]:
    """Return (errors, cleaned_cards). cleaned_cards may have added uuid ids if missing."""
    errors: list[str] = []
    seen_words: dict[str, int] = {}      # normalized wordToGuess -> first index
    seen_ids: set[str] = set()
    cleaned: list[dict] = []

    for i, card in enumerate(cards):
        if not isinstance(card, dict):
            errors.append(f"{deck_label}[{i}]: not an object")
            continue

        card_id = card.get("id")
        word = card.get("wordToGuess")
        forbidden = card.get("forbiddenWords")

        # id
        if not card_id or not isinstance(card_id, str):
            errors.append(f"{deck_label}[{i}]: missing or non-string id (wordToGuess={word!r})")
        elif card_id in seen_ids:
            errors.append(f"{deck_label}[{i}]: duplicate id {card_id}")
        else:
            seen_ids.add(card_id)

        # wordToGuess
        if not word or not isinstance(word, str) or not word.strip():
            errors.append(f"{deck_label}[{i}]: empty or non-string wordToGuess")
            cleaned.append(card)
            continue
        word_norm = normalize(word.strip())
        if word_norm in seen_words:
            errors.append(
                f"{deck_label}[{i}]: duplicate wordToGuess {word!r} (first seen at index {seen_words[word_norm]})"
            )
        else:
            seen_words[word_norm] = i

        # forbiddenWords
        if not isinstance(forbidden, list):
            errors.append(f"{deck_label}[{i}] '{word}': forbiddenWords missing or not a list")
        elif len(forbidden) != 5:
            errors.append(
                f"{deck_label}[{i}] '{word}': forbiddenWords has {len(forbidden)} entries, expected 5"
            )
        else:
            normed = [normalize(f.strip()) if isinstance(f, str) else "" for f in forbidden]
            if any(not n for n in normed):
                errors.append(f"{deck_label}[{i}] '{word}': forbiddenWords contains empty/non-string")
            elif len(set(normed)) != 5:
                dupes = [f for f in forbidden if normed.count(normalize(f.strip())) > 1]
                errors.append(
                    f"{deck_label}[{i}] '{word}': forbiddenWords not unique (dupes: {dupes})"
                )
            for f, fn in zip(forbidden, normed):
                if fn and fn in word_norm:
                    errors.append(
                        f"{deck_label}[{i}] '{word}': forbidden word {f!r} appears inside wordToGuess"
                    )

        cleaned.append(card)

    return errors, cleaned


def maybe_fix_ids(cards: list[dict]) -> int:
    added = 0
    seen_ids: set[str] = set()
    for card in cards:
        cid = card.get("id")
        if not cid or not isinstance(cid, str) or cid in seen_ids:
            card["id"] = str(uuid.uuid4())
            added += 1
        seen_ids.add(card["id"])
    return added


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+", type=Path)
    ap.add_argument("--fix-ids", action="store_true", help="Auto-generate uuid4 for missing/duplicate ids and rewrite the file in place.")
    args = ap.parse_args()

    total_errors = 0
    for path in args.files:
        with path.open() as f:
            data = json.load(f)
        # Tolerate either a top-level list or {"cards": [...]}
        if isinstance(data, dict) and "cards" in data:
            cards = data["cards"]
            wrap = lambda c: {**data, "cards": c}
        else:
            cards = data
            wrap = lambda c: c

        if args.fix_ids:
            added = maybe_fix_ids(cards)
            if added:
                with path.open("w") as f:
                    json.dump(wrap(cards), f, ensure_ascii=False, indent=2)
                print(f"[{path.name}] generated {added} new ids")

        errors, _ = validate_deck(cards, path.name)
        total_errors += len(errors)
        if errors:
            print(f"\n{'=' * 60}")
            print(f"{path.name}: {len(errors)} error(s)")
            print(f"{'=' * 60}")
            for i, err in enumerate(errors, 1):
                print(f"  {i:4d}. {err}")
        else:
            print(f"[{path.name}] OK ({len(cards)} cards)")

    if total_errors:
        print(f"\nTotal errors across all files: {total_errors}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

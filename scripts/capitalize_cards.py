#!/usr/bin/env python3
"""Normalize wordToGuess and each forbiddenWord so the first character is uppercase.

NOT true title-case — only the first code point is uppercased; the rest of the
string is preserved exactly. Examples:
  "mechanical pencil"   -> "Mechanical pencil"
  "Pão de queijo"       -> "Pão de queijo"  (already capitalized)
  "BAGPIPES"            -> "BAGPIPES"        (all-caps stays all-caps)
  ""                    -> ""                (empty preserved)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path


def upper_first(s):
    if not isinstance(s, str) or not s:
        return s
    return s[0].upper() + s[1:]


def process(path: Path) -> int:
    cards = json.loads(path.read_text())
    changed = 0
    for c in cards:
        new_word = upper_first(c.get("wordToGuess", ""))
        if new_word != c.get("wordToGuess"):
            c["wordToGuess"] = new_word
            changed += 1
        fw = c.get("forbiddenWords", [])
        new_fw = [upper_first(w) for w in fw]
        if new_fw != fw:
            c["forbiddenWords"] = new_fw
            changed += 1
    path.write_text(json.dumps(cards, ensure_ascii=False, indent=2))
    return changed


if __name__ == "__main__":
    for arg in sys.argv[1:]:
        n = process(Path(arg))
        print(f"{arg}: {n} field(s) updated")

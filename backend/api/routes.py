from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Literal
import json
import random
import string
import time
from pathlib import Path
from datetime import datetime
from .models import (
    Card,
    CardsResponse,
    HandoffState,
    HandoffCreateResponse,
    HandoffStatusResponse,
)

router = APIRouter()

# Cache for card data
_card_cache: dict[str, List[Card]] = {}


def load_cards_from_file(language: str) -> List[Card]:
    """Load and validate cards from JSON file with error handling."""
    if language in _card_cache:
        return _card_cache[language]

    data_dir = Path(__file__).parent.parent / "data"

    if language == "en":
        file_path = data_dir / "taboo_cards_english.json"
    elif language == "pt":
        file_path = data_dir / "taboo_cards_portuguese.json"
    else:
        raise ValueError(f"Invalid language: {language}")

    if not file_path.exists():
        raise FileNotFoundError(f"Card file not found: {file_path}")

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Validate JSON structure
        cards = [Card(**card) for card in data]
        _card_cache[language] = cards
        return cards
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in {file_path}: {e}")
    except Exception as e:
        raise ValueError(f"Error loading cards from {file_path}: {e}")


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint to verify server status."""
    return {"status": "healthy"}


@router.post("/report-problem")
async def report_problem_card(
    word: str = Body(..., embed=True, description="The problematic card word")
) -> dict[str, str]:
    """
    Report a problematic card.

    Appends the word to a problems.txt file with timestamp.
    The file is stored in /tmp which is writable in production.
    """
    try:
        # Use /tmp directory which is writable in production
        import os
        problems_dir = Path("/tmp/taboo_problems")
        problems_dir.mkdir(parents=True, exist_ok=True)

        # Problems file path
        problems_file = problems_dir / "reported_cards.txt"

        # Append the problematic word with timestamp
        timestamp = datetime.now().isoformat()
        with open(problems_file, "a", encoding="utf-8") as f:
            f.write(f"{timestamp}\t{word}\n")

        # Log to console as well for visibility
        print(f"Problem reported: {timestamp} - {word}")

        return {"status": "success", "message": f"Problem reported for card: {word}"}

    except Exception as e:
        # If /tmp fails, just log to console
        print(f"Problem report (console only): {datetime.now().isoformat()} - {word}")
        return {"status": "success", "message": f"Problem logged for card: {word} (console only)"}


@router.get("/cards", response_model=CardsResponse)
async def get_cards(
    language: Literal["en", "pt", "both"] = Query(
        default="both",
        description="Language filter for cards: en (English), pt (Portuguese), or both"
    )
) -> CardsResponse:
    """
    Retrieve cards with optional language filtering.

    Returns cards in randomized order for game variety.
    """
    try:
        cards: List[Card] = []

        if language == "both":
            en_cards = load_cards_from_file("en")
            pt_cards = load_cards_from_file("pt")
            cards = en_cards + pt_cards
        else:
            cards = load_cards_from_file(language)

        # Randomize order for game variety
        randomized_cards = cards.copy()
        random.shuffle(randomized_cards)

        return CardsResponse(
            cards=randomized_cards,
            total=len(randomized_cards)
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")


# --- Game handoff (pass-the-phone) -----------------------------------------
# Ephemeral in-memory store. Single-worker only (TODO.md flags multi-worker).
_handoffs: dict[str, dict] = {}
HANDOFF_TTL_SECONDS = 30 * 60
HANDOFF_ALPHABET = string.ascii_uppercase


def _purge_expired_handoffs() -> None:
    now = time.time()
    expired = [k for k, v in _handoffs.items() if now - v["created_at"] > HANDOFF_TTL_SECONDS]
    for k in expired:
        del _handoffs[k]


def _generate_handoff_code() -> str:
    for _ in range(20):
        code = "".join(random.choices(HANDOFF_ALPHABET, k=4))
        if code not in _handoffs:
            return code
    raise HTTPException(status_code=503, detail="Too many active handoffs, try again")


@router.post("/handoff", response_model=HandoffCreateResponse)
async def create_handoff(state: HandoffState) -> HandoffCreateResponse:
    """Stash game state, return a 4-letter code."""
    _purge_expired_handoffs()
    code = _generate_handoff_code()
    _handoffs[code] = {
        "state": state.model_dump(),
        "created_at": time.time(),
        "claimed": False,
    }
    return HandoffCreateResponse(code=code, expires_in=HANDOFF_TTL_SECONDS)


@router.get("/handoff/{code}/status", response_model=HandoffStatusResponse)
async def handoff_status(code: str) -> HandoffStatusResponse:
    """Poll whether a handoff has been claimed. Does not consume."""
    _purge_expired_handoffs()
    entry = _handoffs.get(code.upper())
    if not entry:
        return HandoffStatusResponse(exists=False, claimed=False)
    return HandoffStatusResponse(exists=True, claimed=entry["claimed"])


@router.get("/handoff/{code}", response_model=HandoffState)
async def claim_handoff(code: str) -> HandoffState:
    """Return the game state and mark the handoff as claimed (one-time use)."""
    _purge_expired_handoffs()
    entry = _handoffs.get(code.upper())
    if not entry or entry["claimed"]:
        raise HTTPException(status_code=404, detail="Code not found, expired, or already claimed")
    entry["claimed"] = True
    return HandoffState(**entry["state"])

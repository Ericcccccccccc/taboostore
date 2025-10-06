from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Literal
import json
import random
from pathlib import Path
from datetime import datetime
from .models import Card, CardsResponse

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

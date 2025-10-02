from pydantic import BaseModel
from typing import List


class Card(BaseModel):
    id: str
    wordToGuess: str
    forbiddenWords: List[str]


class CardsResponse(BaseModel):
    cards: List[Card]
    total: int

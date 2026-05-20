from pydantic import BaseModel
from typing import List, Any, Dict


class Card(BaseModel):
    id: str
    wordToGuess: str
    forbiddenWords: List[str]


class CardsResponse(BaseModel):
    cards: List[Card]
    total: int


class HandoffState(BaseModel):
    teamNames: List[str]
    rounds: List[Dict[str, Any]]
    currentTeamIdx: int
    gameSettings: Dict[str, Any]


class HandoffCreateResponse(BaseModel):
    code: str
    expires_in: int


class HandoffStatusResponse(BaseModel):
    exists: bool
    claimed: bool

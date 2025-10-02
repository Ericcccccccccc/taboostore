# PR-002: Backend API Implementation

## Objective
Create the FastAPI backend with endpoints for card retrieval and health checks.

## Prerequisites
- PR-001 completed (project structure in place)

## Tasks

### Required Files to Create

1. **`backend/main.py`** - FastAPI application entry point
2. **`backend/api/models.py`** - Pydantic models for data validation
3. **`backend/api/routes.py`** - API endpoint definitions

### Implementation Details

#### `backend/api/models.py`
```python
from pydantic import BaseModel
from typing import List

class Card(BaseModel):
    id: str
    wordToGuess: str
    forbiddenWords: List[str]

class CardsResponse(BaseModel):
    cards: List[Card]
    total: int
```

#### `backend/main.py`
- FastAPI app initialization
- CORS middleware configuration
- Mount API routes
- Static file serving for card data
- Health check endpoint

#### `backend/api/routes.py`
- `GET /api/health` - Returns server status
- `GET /api/cards` - Returns cards with language filter
  - Query param: `language` (en|pt|both)
  - Load JSON files from data folder
  - Filter based on language parameter
  - Return randomized order

### Key Requirements
- CORS must allow frontend origin
- Error handling for missing files
- Validate JSON structure on load
- Cache card data in memory for performance
- Type hints on all functions

## Acceptance Criteria
- [ ] Server starts on port 8000
- [ ] /api/health returns 200 with status
- [ ] /api/cards returns proper JSON structure
- [ ] Language filtering works correctly
- [ ] CORS allows localhost:5173 (Vite dev)
- [ ] API documentation available at /docs

## Testing Commands
```bash
# Start server
cd backend && uvicorn main:app --reload

# Test health endpoint
curl http://localhost:8000/api/health

# Test cards endpoint
curl http://localhost:8000/api/cards?language=en
curl http://localhost:8000/api/cards?language=pt
curl http://localhost:8000/api/cards?language=both
```

## Notes
- Keep endpoints stateless
- Design for future mobile app compatibility
- No authentication for MVP
- Consider API versioning structure for future

## Completion Documentation
When complete, move this file to `task/complete/` and add:
- List of all files created/modified
- Any deviations from plan and reasoning
- Sample API responses
- Performance notes (load time, memory usage)
# Taboo Store - Web Game Application

## Project Overview

Taboo Store is a minimal, production-ready web implementation of the classic Taboo word-guessing game. Players give clues to help others guess a word without using forbidden words. Built with React and FastAPI for a clean, extensible architecture.

**Live URL**: https://itaboo.store
**Repository**: Main branch only, no feature branches for MVP
**Status**: MVP Development

## Core Features

- **Anonymous Play**: No authentication required
- **Multi-language**: English, Portuguese, or 50/50 alternating mode
- **Smart Card Tracking**: No repeats until all cards seen (sessionStorage)
- **Configurable Settings**: Timer duration, pass limits, language selection
- **Clean Results**: Track correct/missed/passed cards with final summary

## Technical Stack

### Backend
- **Python 3.11+** with **FastAPI** for REST API
- **Pydantic** for data validation
- **uvicorn** as ASGI server
- JSON file storage (no database for MVP)

### Frontend
- **React 18** with functional components and hooks
- **Vite** for fast builds and HMR
- **sessionStorage** for client-side state persistence
- Vanilla CSS (no frameworks)

### Infrastructure
- **Docker** & **Docker Compose** for containerization
- **Caddy** reverse proxy for HTTPS and domain routing
- Port **5555** for application access

## Architecture Decisions

### Why These Choices?

**FastAPI over Flask/Django**
- Automatic API documentation
- Built-in async support
- Type hints and validation
- Minimal boilerplate

**React without Redux**
- Simple state needs don't justify Redux complexity
- useState + Context sufficient for game state
- sessionStorage handles persistence

**No Database**
- JSON files sufficient for card data
- No user data to persist
- Simplifies deployment and maintenance

**Docker from Start**
- Consistent development/production environments
- Easy deployment to any Linux VM
- Isolated dependencies

## Project Structure

```
taboostore/
├── claude.md                    # This file
├── .gitignore                   # Git ignore patterns
├── docker-compose.yml           # Container orchestration
├── deploy-local.sh                    # Deployment automation
├── task/                        # PR task management
│   ├── incomplete/             # Pending tasks
│   └── complete/               # Completed tasks
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py                 # FastAPI application
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes.py           # API endpoints
│   │   └── models.py           # Pydantic models
│   └── data/                    # JSON card files
│       ├── taboo_cards_english.json
│       └── taboo_cards_portuguese.json
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── public/
    │   └── favicon.ico
    └── src/
        ├── index.js             # React entry point
        ├── App.js               # Main app component
        ├── App.css              # Global styles
        ├── api/
        │   └── client.js        # API communication
        ├── components/
        │   ├── StartScreen.js   # Settings and game start
        │   ├── GameScreen.js    # Active gameplay
        │   ├── EndScreen.js     # Results display
        │   └── styles.css       # Component styles
        ├── hooks/
        │   ├── useTimer.js      # Timer countdown logic
        │   └── useCards.js      # Card management
        └── utils/
            ├── gameLogic.js     # Core game rules
            └── storage.js       # sessionStorage wrapper
```

## API Documentation

### Endpoints

#### `GET /api/health`
Health check endpoint for monitoring.

**Response**: `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### `GET /api/cards?language={language}`
Retrieve cards for specified language(s).

**Parameters**:
- `language`: `en` | `pt` | `both` (default: `both`)

**Response**: `200 OK`
```json
{
  "cards": [
    {
      "id": "uuid-here",
      "wordToGuess": "Pizza",
      "forbiddenWords": ["Food", "Italian", "Cheese", "Round", "Delivery"]
    }
  ],
  "total": 150
}
```

## Component Architecture

### StartScreen
**Purpose**: Game configuration and initialization
**State**: Settings (timer, passes, language)
**Props**: `onStartGame(settings)`

### GameScreen
**Purpose**: Active gameplay with timer and scoring
**State**:
- `currentCard`: Active card being played
- `timeRemaining`: Countdown in seconds
- `passesRemaining`: Available passes
- `score`: {correct, missed, passed}

**Props**: `settings`, `onGameEnd(results)`

### EndScreen
**Purpose**: Display final results and card history
**State**: None (receives results as props)
**Props**: `results`, `onPlayAgain()`, `onReturnToMenu()`

## State Management Pattern

### Application State Flow
```
StartScreen (settings)
    → GameScreen (active game)
    → EndScreen (results)
    → StartScreen (reset)
```

### SessionStorage Schema
```javascript
{
  "seenCards": {
    "en": ["id1", "id2", ...],
    "pt": ["id3", "id4", ...]
  },
  "lastShuffleTime": "2024-01-15T10:30:00Z"
}
```

### Game Settings Interface
```javascript
{
  timerDuration: 60,     // seconds: 60, 75, 90, 105, 120
  passLimit: 1,          // 0, 1, 2, 3, 5, -1 (infinite)
  language: "both"       // "en", "pt", "both"
}
```

## Development Workflow

### Local Development

1. **Install Dependencies**
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

2. **Run Development Servers**
```bash
# Backend (from backend/)
uvicorn main:app --reload --port 8000

# Frontend (from frontend/)
npm run dev
```

3. **Access Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Docker Development

```bash
# Build and run all services
docker-compose up --build

# Access at http://localhost:5555
```

## Testing Strategy

### Manual Testing Checklist
- [ ] Timer counts down correctly
- [ ] Pass counter decrements properly
- [ ] Cards don't repeat until all seen
- [ ] Language alternation works in 50/50 mode
- [ ] Score tallies accurately
- [ ] End screen shows all cards with status
- [ ] SessionStorage persists across refreshes
- [ ] Responsive on mobile devices

### API Testing
```bash
# Health check
curl http://localhost:8000/api/health

# Get English cards
curl http://localhost:8000/api/cards?language=en

# Get all cards
curl http://localhost:8000/api/cards?language=both
```

## Deployment Guide

### Prerequisites
- Ubuntu 20.04+ VM with Docker installed
- Domain pointed to VM IP (itaboo.store)
- SSH access to VM

### Deployment Steps

1. **Clone Repository**
```bash
ssh user@vm-ip
git clone [repo-url]
cd taboostore
```

2. **Run Deployment Script**
```bash
chmod +x deploy-local.sh
./deploy-local.sh
```

The script will:
- Build Docker images
- Start containers via docker-compose
- Configure Caddy if needed
- Set up HTTPS certificates
- Route domain to port 5555

### Manual Deployment
```bash
# Build and start in detached mode
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Restart if needed
docker-compose restart
```

## Code Style Guidelines

### JavaScript/React
- Functional components only
- Hooks for state and effects
- Destructure props and state
- Async/await over promises
- Clear variable names over comments

```javascript
// Good
const CardDisplay = ({ card, onCorrect, onMissed }) => {
  const { wordToGuess, forbiddenWords } = card;

  return (
    <div className="card">
      <h2>{wordToGuess}</h2>
      <div className="divider" />
      <ul>{forbiddenWords.map(word => <li key={word}>{word}</li>)}</ul>
    </div>
  );
};

// Avoid
function CardDisplay(props) {
  // Display the card
  return <div>...</div>;
}
```

### Python/FastAPI
- Type hints for all functions
- Pydantic models for validation
- Async endpoints where beneficial
- Clear error messages

```python
# Good
from typing import List, Optional
from pydantic import BaseModel

class Card(BaseModel):
    id: str
    wordToGuess: str
    forbiddenWords: List[str]

@app.get("/api/cards", response_model=List[Card])
async def get_cards(language: Optional[str] = "both") -> List[Card]:
    """Retrieve cards for specified language."""
    return load_cards(language)

# Avoid
@app.get("/api/cards")
def get_cards(language=None):
    # returns cards
    return cards
```

### CSS
- Mobile-first approach
- CSS custom properties for theming
- BEM-like naming for clarity
- Flexbox/Grid over floats

```css
/* Good */
.game-screen {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md);
}

.game-screen__timer {
  font-size: 2rem;
  color: var(--color-primary);
}

/* Avoid */
.gameScreen {
  padding: 20px;
}
```

## Performance Considerations

### Frontend
- Memoize expensive computations
- Lazy load components if needed
- Minimize re-renders with proper deps
- Use React.memo for pure components

### Backend
- Cache card data in memory
- Use async for I/O operations
- Implement request throttling if needed
- CORS configured for specific origins

## Security Notes

### Current Implementation
- No authentication (by design)
- No user data storage
- CORS configured for frontend origin
- Input validation via Pydantic
- No SQL (no injection risk)

### Future Considerations
- Rate limiting for API endpoints
- Content Security Policy headers
- API key for mobile apps
- WebSocket authentication for multiplayer

## Future Enhancements

### Phase 2 Features
- User accounts and statistics
- Multiplayer rooms
- Custom card packs
- Sound effects
- Animations

### Mobile Apps
- React Native sharing core logic
- API versioning (v1, v2)
- Offline mode with sync
- Push notifications

### Scalability
- Redis for session management
- PostgreSQL for user data
- CDN for static assets
- Horizontal scaling with load balancer

## Troubleshooting

### Common Issues

**Frontend can't reach backend**
- Check CORS settings in backend
- Verify Docker network configuration
- Ensure API_URL environment variable is set

**Cards repeating before all seen**
- Clear sessionStorage
- Check card ID uniqueness
- Verify shuffle logic

**Timer not stopping at zero**
- Check useEffect cleanup
- Verify clearInterval called
- Test edge cases (tab switching)

**Deploy script fails**
- Check Docker daemon running
- Verify port 5555 available
- Ensure Caddy has permissions

## Contributing Guidelines

### PR Process
1. Pick task from `task/incomplete/`
2. Create implementation following task requirements
3. Test thoroughly
4. Move task to `task/complete/` with completion notes
5. Commit with clear message

### Commit Messages
```
feat: Add timer countdown hook
fix: Resolve card duplication issue
docs: Update API documentation
style: Format code with prettier
refactor: Extract card logic to utils
```

## License

MIT License - See LICENSE file

## Contact

Project maintained by [Your Name]
Issues: [GitHub Issues URL]
Email: [Contact Email]

---

*Last updated: [Date]*
*Version: 1.0.0 (MVP)*
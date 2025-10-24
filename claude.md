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

## Project Structure

```
taboostore/
├── claude.md                    # This file
├── .gitignore                   # Git ignore patterns
├── docker-compose.yml           # Container orchestration
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
            ├── localization.js  # eng vs pt
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


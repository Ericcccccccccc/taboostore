# PR-005: Game Logic & State Management

## Objective
Implement core game logic including timer management, card tracking, scoring, and sessionStorage integration.

## Prerequisites
- PR-004 completed (game screens)

## Tasks

### Required Files to Create

1. **`frontend/src/hooks/useTimer.js`** - Timer countdown hook
2. **`frontend/src/hooks/useCards.js`** - Card management hook
3. **`frontend/src/utils/gameLogic.js`** - Core game rules
4. **`frontend/src/utils/storage.js`** - sessionStorage wrapper

### Implementation Details

#### `useTimer.js`
Custom hook for countdown timer:
```javascript
export function useTimer(duration, onTimeUp) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);

  // Start, pause, reset functions
  // useEffect for countdown
  // Cleanup on unmount

  return { timeRemaining, isRunning, start, pause, reset };
}
```

#### `useCards.js`
Hook for card management with sessionStorage:
```javascript
export function useCards(language) {
  const [currentCard, setCurrentCard] = useState(null);
  const [seenCards, setSeenCards] = useState([]);
  const [availableCards, setAvailableCards] = useState([]);

  // Load cards from API
  // Track seen cards in sessionStorage
  // Get next card logic
  // Reshuffle when all seen

  return { currentCard, nextCard, resetCards };
}
```

#### `gameLogic.js`
Core game functions:
```javascript
// Card selection based on language mode
export function selectNextCard(cards, seenIds, language, isAlternating) { }

// Check if reshuffle needed
export function shouldReshuffle(totalCards, seenCount) { }

// Language alternation for 50/50 mode
export function getNextLanguage(currentLang, mode) { }

// Score calculation
export function calculateFinalScore(results) { }
```

#### `storage.js`
SessionStorage utilities:
```javascript
const STORAGE_KEY = 'taboo_game_state';

export const storage = {
  getSeenCards: (language) => { },
  saveSeenCards: (language, cardIds) => { },
  clearSeenCards: () => { },
  getLastShuffle: () => { },
  setLastShuffle: () => { }
};
```

### State Management Pattern

#### Game Flow
1. **Start**: Load settings, clear old session data
2. **Playing**: Track current card, update score, manage timer
3. **Card Action**: Mark as correct/missed/passed, get next
4. **Time Up**: Compile results, transition to end
5. **End**: Display results, offer replay

#### SessionStorage Schema
```javascript
{
  "seenCards": {
    "en": ["id1", "id2", ...],
    "pt": ["id3", "id4", ...],
    "lastUpdated": "2024-01-15T10:30:00Z"
  },
  "currentSession": {
    "startTime": "2024-01-15T10:30:00Z",
    "settings": { /* ... */ }
  }
}
```

### Key Requirements
- Timer must be accurate (requestAnimationFrame if needed)
- Cards never repeat until all seen
- 50/50 mode strictly alternates languages
- Pass counter decrements correctly
- Handle edge cases (tab switching, refresh)
- Clean up intervals/timeouts

## Acceptance Criteria
- [ ] Timer counts down accurately
- [ ] Cards don't repeat in session
- [ ] SessionStorage persists across refresh
- [ ] Reshuffle works when all cards seen
- [ ] Language alternation in 50/50 mode
- [ ] Score tallies correctly
- [ ] Memory leaks prevented (cleanup)

## Testing Scenarios
- [ ] Play through all cards - verify reshuffle
- [ ] Refresh mid-game - cards still no repeat
- [ ] Switch tabs - timer continues correctly
- [ ] Use all passes - button disables
- [ ] 50/50 mode - languages alternate
- [ ] Clear storage - fresh game state

## Notes
- Consider performance with large card sets
- Handle API failures gracefully
- Ensure timer precision for competitive play
- Test on slow devices

## Completion Documentation
When complete, move this file to `task/complete/` and add:
- List of all files created/modified
- Any deviations from plan and reasoning
- Performance metrics (timer accuracy)
- Edge cases handled
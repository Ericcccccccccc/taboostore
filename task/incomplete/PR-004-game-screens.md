# PR-004: Game Screen Components

## Objective
Implement the three main game screens: StartScreen, GameScreen, and EndScreen.

## Prerequisites
- PR-003 completed (frontend foundation)

## Tasks

### Required Files to Create

1. **`frontend/src/components/StartScreen.js`** - Game configuration screen
2. **`frontend/src/components/GameScreen.js`** - Active gameplay screen
3. **`frontend/src/components/EndScreen.js`** - Results display screen
4. **`frontend/src/components/styles.css`** - Component-specific styles

### Implementation Details

#### `StartScreen.js`
Settings form with:
- Timer duration selector (60, 75, 90, 105, 120 seconds)
- Pass limit selector (0, 1, 2, 3, 5, ∞)
- Language mode (English, Portuguese, 50/50)
- Start Game button

```javascript
function StartScreen({ onStartGame }) {
  const [settings, setSettings] = useState({
    timerDuration: 60,
    passLimit: 1,
    language: 'both'
  });

  // Form handlers
  // Validation
  // Submit to parent
}
```

#### `GameScreen.js`
Active game with:
- Current card display (word + forbidden words)
- Timer countdown
- Score display (correct/missed/passed)
- Action buttons (Correct, Missed, Pass)
- Pass counter

Layout:
```
┌─────────────────────────┐
│    Timer: 45s           │
│                         │
│    PIZZA                │
│    ═════════════════    │
│    • Food               │
│    • Italian            │
│    • Cheese             │
│    • Round              │
│    • Delivery           │
│                         │
│ ✓ Correct  ✗ Missed     │
│      ↻ Pass (1)         │
│                         │
│ Score: 5 ✓  2 ✗  1 ↻   │
└─────────────────────────┘
```

#### `EndScreen.js`
Results summary with:
- Final score (X correct, Y missed, Z passed)
- Card list with status indicators
- Play Again button
- Return to Menu button

```javascript
function EndScreen({ results, onPlayAgain, onReturnToMenu }) {
  // Display final score
  // List all cards with their status
  // Action buttons
}
```

### Component Structure

Each component should:
- Be a functional component
- Use hooks for state
- Handle its own UI logic
- Communicate via props
- Include PropTypes validation

### Styling Requirements
- Clear visual hierarchy
- Prominent timer display
- Color-coded buttons (green/red/yellow)
- Thick divider between word and forbidden words
- Mobile-optimized touch targets (min 44px)
- Smooth transitions between screens

## Acceptance Criteria
- [ ] StartScreen validates settings before starting
- [ ] GameScreen displays cards clearly
- [ ] Timer counts down visually
- [ ] Buttons respond to clicks/taps
- [ ] EndScreen shows comprehensive results
- [ ] All screens responsive on mobile
- [ ] Clean transitions between screens

## Testing Checklist
- [ ] Settings form validation works
- [ ] Timer displays correctly
- [ ] Card layout is readable
- [ ] Buttons have proper hover/active states
- [ ] Results calculate accurately
- [ ] Navigation between screens smooth

## Notes
- Mock card data for testing if API not ready
- Consider accessibility (ARIA labels)
- Ensure touch-friendly on mobile
- Test on various screen sizes

## Completion Documentation
When complete, move this file to `task/complete/` and add:
- List of all files created/modified
- Any deviations from plan and reasoning
- Screenshots of all three screens
- Mobile vs desktop comparison
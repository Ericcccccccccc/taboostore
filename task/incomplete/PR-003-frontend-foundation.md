# PR-003: Frontend Foundation

## Objective
Set up React application structure with routing between screens and API client.

## Prerequisites
- PR-001 completed (project structure)
- PR-002 completed (backend API running)

## Tasks

### Required Files to Create

1. **`frontend/src/index.js`** - React DOM render entry point
2. **`frontend/src/App.js`** - Main app component with screen routing
3. **`frontend/src/App.css`** - Global styles and CSS variables
4. **`frontend/src/api/client.js`** - API communication layer

### Implementation Details

#### `frontend/src/index.js`
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

#### `frontend/src/App.js`
- Main component managing screen state
- Three screens: 'start', 'game', 'end'
- Pass props to child components
- Handle screen transitions

```javascript
function App() {
  const [currentScreen, setCurrentScreen] = useState('start');
  const [gameSettings, setGameSettings] = useState(null);
  const [gameResults, setGameResults] = useState(null);

  // Screen transition handlers
  // Component rendering based on currentScreen
}
```

#### `frontend/src/api/client.js`
- Centralized API communication
- Base URL configuration
- Error handling
- Response parsing

```javascript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
  getCards: async (language) => { /* ... */ },
  checkHealth: async () => { /* ... */ }
};
```

#### `frontend/src/App.css`
- CSS custom properties for theming
- Mobile-first responsive design
- Base typography and spacing
- Button styles
- Layout utilities

### Key Requirements
- Functional components only
- Clean prop passing
- Error boundaries for robustness
- Loading states during API calls
- Responsive from 320px width

## Acceptance Criteria
- [ ] App renders without errors
- [ ] Screen navigation works
- [ ] API client connects to backend
- [ ] CSS variables defined for consistent theming
- [ ] Mobile responsive layout
- [ ] Clean component structure

## Testing Commands
```bash
# Install and run
cd frontend
npm install
npm run dev

# Should see app at http://localhost:5173
# Console should show no errors
# API health check should succeed
```

## Notes
- No routing library - simple state-based screens
- Prepare for component addition in next PRs
- Keep App.js lean - logic in child components
- Use CSS modules or BEM naming to avoid conflicts

## Completion Documentation
When complete, move this file to `task/complete/` and add:
- List of all files created/modified
- Any deviations from plan and reasoning
- Screenshot of running app
- Console output verification
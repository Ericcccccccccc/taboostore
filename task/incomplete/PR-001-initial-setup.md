# PR-001: Initial Project Setup

## Objective
Set up the foundational project structure, configuration files, and development environment.

## Scope
Create the basic project scaffold with proper folder structure, dependency management, and git configuration.

## Tasks

### Required Files to Create

1. **`.gitignore`** - Git ignore patterns for both Python and Node.js
2. **`backend/requirements.txt`** - Python dependencies
3. **`backend/__init__.py`** - Make backend a Python package
4. **`backend/api/__init__.py`** - API package initialization
5. **`frontend/package.json`** - Node.js dependencies and scripts
6. **`frontend/vite.config.js`** - Vite configuration
7. **`frontend/index.html`** - HTML entry point

### Folder Structure to Create
```
backend/
├── api/
├── data/
frontend/
├── public/
├── src/
    ├── api/
    ├── components/
    ├── hooks/
    └── utils/
```

### Move Existing Files
- Move `taboo_cards_english.json` → `backend/data/`
- Move `taboo_cards_portuguese.json` → `backend/data/`

### Dependencies to Include

**Backend (`requirements.txt`)**:
```
fastapi==0.109.0
uvicorn[standard]==0.25.0
pydantic==2.5.0
python-multipart==0.0.6
```

**Frontend (`package.json`)**:
```json
{
  "name": "taboo-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}
```

## Acceptance Criteria
- [ ] All folders created according to structure
- [ ] JSON files moved to backend/data/
- [ ] Dependencies properly specified
- [ ] .gitignore covers common patterns
- [ ] Vite configured for React development
- [ ] Project can be initialized with npm install and pip install

## Notes
- Keep dependencies minimal - only what's needed for MVP
- Use latest stable versions
- Ensure cross-platform compatibility

## Completion Documentation
When complete, move this file to `task/complete/` and add:
- List of all files created/modified
- Any deviations from plan and reasoning
- Commands to verify setup works
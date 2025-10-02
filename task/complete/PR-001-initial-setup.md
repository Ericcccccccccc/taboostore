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
- [x] All folders created according to structure
- [x] JSON files moved to backend/data/
- [x] Dependencies properly specified
- [x] .gitignore covers common patterns
- [x] Vite configured for React development
- [x] Project can be initialized with npm install and pip install

## Notes
- Keep dependencies minimal - only what's needed for MVP
- Use latest stable versions
- Ensure cross-platform compatibility

## Completion Documentation

### Status: COMPLETED

### Files Created

1. **`/home/eric/PROJECTS/taboostore/backend/__init__.py`** - Backend package initialization
2. **`/home/eric/PROJECTS/taboostore/backend/api/__init__.py`** - API package initialization
3. **`/home/eric/PROJECTS/taboostore/backend/requirements.txt`** - Python dependencies (FastAPI, Uvicorn, Pydantic, python-multipart)
4. **`/home/eric/PROJECTS/taboostore/frontend/package.json`** - Node.js configuration with React, Vite, and dev dependencies
5. **`/home/eric/PROJECTS/taboostore/frontend/vite.config.js`** - Vite configuration with React plugin
6. **`/home/eric/PROJECTS/taboostore/frontend/index.html`** - HTML entry point with root div and module script

### Files Already Present (No Action Required)

1. **`.gitignore`** - Already exists with comprehensive patterns for Python, Node.js, Docker, and more
2. **`backend/data/taboo_cards_english.json`** - Already moved to correct location
3. **`backend/data/taboo_cards_portuguese.json`** - Already moved to correct location

### Folder Structure

All required folders already exist:
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

### Deviations from Plan

**NONE** - All tasks completed exactly as specified.

### Verification Commands

To verify the setup works:

```bash
# Backend - Install Python dependencies
cd /home/eric/PROJECTS/taboostore/backend
python3 -m pip install -r requirements.txt

# Frontend - Install Node.js dependencies
cd /home/eric/PROJECTS/taboostore/frontend
npm install

# Frontend - Run development server
npm run dev

# Backend - Run FastAPI server (once API is implemented)
cd /home/eric/PROJECTS/taboostore/backend
uvicorn api.main:app --reload
```

### Next Steps

PR-001 is complete. The project is now ready for:
- PR-002: Backend API implementation
- PR-003: Frontend foundation

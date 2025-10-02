# PR-007: Docker Configuration

## Objective
Containerize the application with Docker and Docker Compose for consistent development and deployment.

## Prerequisites
- PR-002 completed (backend working)
- PR-003 completed (frontend working)

## Tasks

### Required Files to Create

1. **`backend/Dockerfile`** - Python container configuration
2. **`frontend/Dockerfile`** - Node.js container configuration
3. **`docker-compose.yml`** - Multi-container orchestration
4. **`.dockerignore`** - Exclude unnecessary files

### Implementation Details

#### `backend/Dockerfile`
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Run with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### `frontend/Dockerfile`
Multi-stage build for optimization:
```dockerfile
# Build stage
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

#### `docker-compose.yml`
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend/data:/app/data
    environment:
      - ENVIRONMENT=production
    networks:
      - taboo-network

  frontend:
    build: ./frontend
    ports:
      - "5555:80"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://backend:8000
    networks:
      - taboo-network

networks:
  taboo-network:
    driver: bridge
```

#### `frontend/nginx.conf`
```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### `.dockerignore`
```
# Python
__pycache__
*.pyc
.env
venv/
.pytest_cache/

# Node
node_modules/
npm-debug.log
.env.local

# IDE
.vscode/
.idea/

# Git
.git/
.gitignore

# Documentation
*.md
```

### Environment Configuration

Create environment files:
- `backend/.env.example`
- `frontend/.env.example`

With appropriate variables:
```bash
# Backend
CORS_ORIGINS=http://localhost:5555,https://itaboo.store
ENVIRONMENT=production

# Frontend
VITE_API_URL=http://localhost:8000
```

### Build Optimization

- Use multi-stage builds
- Leverage Docker layer caching
- Minimize image sizes
- Use Alpine Linux where possible
- Only copy necessary files

## Acceptance Criteria
- [ ] Backend container builds and runs
- [ ] Frontend container builds and runs
- [ ] Containers communicate via Docker network
- [ ] Application accessible on port 5555
- [ ] Data persists across container restarts
- [ ] Images are under 200MB each
- [ ] Build time under 2 minutes

## Testing Commands
```bash
# Build and run
docker-compose up --build

# Test application
curl http://localhost:5555
curl http://localhost:5555/api/health

# Check container sizes
docker images

# Test persistence
docker-compose down
docker-compose up
# Verify data still present
```

## Production Considerations
- [ ] Health checks configured
- [ ] Restart policies set
- [ ] Resource limits defined
- [ ] Logging configured
- [ ] Security scanning on images

## Notes
- Keep images lean for faster deployments
- Use specific version tags, not 'latest'
- Consider using Docker BuildKit
- Test on Linux, Mac, and Windows

## Completion Documentation
When complete, move this file to `task/complete/` and add:
- Final image sizes
- Build times
- Any optimization techniques used
- Docker commands for management
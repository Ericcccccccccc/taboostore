#!/bin/bash
set -e

# Deployment script for Taboo Store
# This script is idempotent and can be run multiple times safely

# Configuration
DOMAIN="itaboo.store"
APP_PORT="5555"
FRONTEND_PORT="8080"
COMPOSE_FILE="docker-compose.yml"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
LOG_FILE="deployment-$(date +%Y%m%d-%H%M%S).log"
exec 1> >(tee -a "${LOG_FILE}")
exec 2>&1

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Error handler
error_handler() {
    log_error "Deployment failed at line $1"
    log_info "Check logs at: ${LOG_FILE}"
    exit 1
}

trap 'error_handler ${LINENO}' ERR

# Rollback function
rollback() {
    log_warning "Rolling back deployment..."
    if [ -n "${BACKUP_COMMIT}" ]; then
        git reset --hard "${BACKUP_COMMIT}"
        docker-compose -f "${COMPOSE_FILE}" up -d --build --force-recreate
        log_success "Rollback complete"
    fi
}

echo "=========================================="
echo "   Taboo Store Deployment Script"
echo "=========================================="
echo ""
log_info "Starting deployment to ${DOMAIN}..."
log_info "Timestamp: $(date)"
echo ""

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please run ./scripts/install-dependencies.sh first"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed. Please run ./scripts/install-dependencies.sh first"
    exit 1
fi

log_success "Docker and Docker Compose are installed"

# Check if docker daemon is running
if ! docker info &> /dev/null; then
    log_error "Docker daemon is not running. Please start Docker first"
    exit 1
fi

log_success "Docker daemon is running"

# Store current commit for potential rollback
BACKUP_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "")
log_info "Current commit: ${BACKUP_COMMIT}"

# Pull latest changes if in git repo
if [ -d .git ]; then
    log_info "Pulling latest changes from git..."
    git pull origin main || log_warning "Git pull failed or no remote configured"
fi

# Build and deploy containers with zero-downtime
log_info "Building Docker images..."
docker-compose -f "${COMPOSE_FILE}" build --no-cache

log_info "Starting new containers..."
# Use --scale and --no-recreate for zero-downtime if possible
# For now, we'll do a simple restart with minimal downtime
docker-compose -f "${COMPOSE_FILE}" up -d --force-recreate

# Wait for services to be healthy
log_info "Waiting for services to become healthy..."
RETRY_COUNT=0
MAX_RETRIES=30

while [ ${RETRY_COUNT} -lt ${MAX_RETRIES} ]; do
    if docker-compose -f "${COMPOSE_FILE}" ps | grep -q "healthy"; then
        log_success "Services are healthy"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
done

echo ""

if [ ${RETRY_COUNT} -eq ${MAX_RETRIES} ]; then
    log_error "Services failed to become healthy within timeout"
    log_info "Container logs:"
    docker-compose -f "${COMPOSE_FILE}" logs --tail=50
    rollback
    exit 1
fi

# Health check
log_info "Performing health checks..."

# Check backend
if curl -sf http://localhost:${APP_PORT}/api/health > /dev/null; then
    log_success "Backend health check passed"
else
    log_error "Backend health check failed"
    docker-compose -f "${COMPOSE_FILE}" logs backend
    rollback
    exit 1
fi

# Check frontend
if curl -sf http://localhost:${FRONTEND_PORT}/ > /dev/null; then
    log_success "Frontend health check passed"
else
    log_error "Frontend health check failed"
    docker-compose -f "${COMPOSE_FILE}" logs frontend
    rollback
    exit 1
fi

# Setup Caddy if needed
if ! command -v caddy &> /dev/null; then
    log_warning "Caddy is not installed. Installing Caddy..."

    # Install Caddy
    sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt update
    sudo apt install -y caddy

    log_success "Caddy installed successfully"
fi

# Configure Caddy
log_info "Configuring Caddy reverse proxy..."

if [ -f caddy/Caddyfile ]; then
    sudo cp caddy/Caddyfile /etc/caddy/Caddyfile

    # Validate Caddyfile
    if sudo caddy validate --config /etc/caddy/Caddyfile; then
        log_success "Caddyfile is valid"
    else
        log_error "Caddyfile validation failed"
        exit 1
    fi

    # Reload Caddy
    if sudo systemctl is-active --quiet caddy; then
        sudo systemctl reload caddy
        log_success "Caddy configuration reloaded"
    else
        sudo systemctl start caddy
        sudo systemctl enable caddy
        log_success "Caddy started and enabled"
    fi
else
    log_warning "Caddyfile not found, skipping Caddy configuration"
fi

# Cleanup old images
log_info "Cleaning up old Docker images..."
docker image prune -f > /dev/null 2>&1 || true

# Display container status
echo ""
log_info "Container Status:"
docker-compose -f "${COMPOSE_FILE}" ps

echo ""
echo "=========================================="
log_success "Deployment completed successfully!"
echo "=========================================="
echo ""
log_info "Application Details:"
echo "  - Backend API: http://localhost:${APP_PORT}"
echo "  - Frontend: http://localhost:${FRONTEND_PORT}"
if command -v caddy &> /dev/null; then
    echo "  - Public URL: https://${DOMAIN}"
fi
echo ""
log_info "Deployment log saved to: ${LOG_FILE}"
echo ""
log_info "Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Container stats: docker stats"
echo "  - Health check: ./scripts/health-check.sh"
echo ""

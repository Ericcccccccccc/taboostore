#!/bin/bash
#
# Deploy Taboo Store to Oracle Cloud Server
# Idempotent script - safe to run multiple times
#

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Server configuration
SERVER_IP="170.9.233.1"
SERVER_USER="ubuntu"
SSH_KEY="$HOME/Documents/tech/notatherapist/oracle-ssh.key"
APP_DIR="/opt/taboostore"

# SSH options - suppress banner with -q
SSH_OPTS="-q -i $SSH_KEY -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -o StrictHostKeyChecking=no -o LogLevel=ERROR"
SSH_CMD="ssh $SSH_OPTS $SERVER_USER@$SERVER_IP"

echo -e "${CYAN}============================================${NC}"
echo -e "${CYAN}     Taboo Store - Oracle Cloud Deploy     ${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""
echo -e "${BLUE}Server:${NC} $SERVER_USER@$SERVER_IP"
echo -e "${BLUE}App Directory:${NC} $APP_DIR"
echo ""

# Function to run remote commands without banner
remote_exec() {
    $SSH_CMD bash -s
}

# Check SSH connectivity
echo -e "${YELLOW}Checking SSH connectivity...${NC}"
if ! $SSH_CMD "echo 'Connected'" 2>/dev/null; then
    echo -e "${RED}Failed to connect to server!${NC}"
    echo -e "${RED}Check SSH key at: $SSH_KEY${NC}"
    exit 1
fi
echo -e "${GREEN}✓ SSH connection successful${NC}"
echo ""

# Deploy application
echo -e "${YELLOW}Deploying application...${NC}"

remote_exec << 'ENDSSH'
set -e

# Colors for remote output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Setup directory and clone/update repository
echo "Setting up repository..."
sudo mkdir -p /opt/taboostore
sudo chown ubuntu:ubuntu /opt/taboostore
cd /opt

if [ -d "taboostore/.git" ]; then
    echo "Updating existing repository..."
    cd taboostore
    git fetch origin
    git reset --hard origin/main
    git pull origin main
else
    echo "Cloning repository..."
    sudo rm -rf taboostore
    sudo git clone https://github.com/Ericcccccccccc/taboostore.git
    sudo chown -R ubuntu:ubuntu taboostore
    cd taboostore
fi

# Make scripts executable
chmod +x deploy-*.sh scripts/*.sh 2>/dev/null || true

# 2. Create production environment file if needed
if [ ! -f .env.production ]; then
    echo "Creating production environment..."
    cat > .env.production << 'EOF'
# Production Environment Variables
DOMAIN=itaboo.store
SERVER_IP=170.9.233.1
BACKEND_PORT=5555
FRONTEND_PORT=8080

# FastAPI Settings
API_ENV=production
API_HOST=0.0.0.0
API_PORT=5555
CORS_ORIGINS=["https://itaboo.store","http://localhost:8080"]

# Frontend Settings
VITE_API_URL=/api

# Docker Settings
COMPOSE_PROJECT_NAME=taboostore
EOF
fi

echo -e "${GREEN}✓ Repository ready${NC}"
ENDSSH

echo -e "${GREEN}✓ Application deployed${NC}"
echo ""

# Configure Caddy
echo -e "${YELLOW}Configuring Caddy...${NC}"

remote_exec << 'ENDSSH'
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Caddy Docker container is running
if ! docker ps --format '{{.Names}}' | grep -q '^caddy$'; then
    echo -e "${RED}Error: Caddy Docker container is not running${NC}"
    echo "Please ensure Caddy container is running first"
    exit 1
fi

# Find Caddy config directory
CADDY_CONFIG_DIR=""

# Try to find the actual Caddyfile location from Docker inspect
CADDY_MOUNT=$(docker inspect caddy 2>/dev/null | grep -B1 '"Destination": "/etc/caddy"' | grep Source | sed 's/.*"Source": "\(.*\)".*/\1/' | head -1)

if [ -n "$CADDY_MOUNT" ] && [ -d "$CADDY_MOUNT" ]; then
    CADDY_CONFIG_DIR="$CADDY_MOUNT"
elif [ -f "/opt/caddy/Caddyfile" ]; then
    CADDY_CONFIG_DIR="/opt/caddy"
elif [ -f "/home/ubuntu/caddy/Caddyfile" ]; then
    CADDY_CONFIG_DIR="/home/ubuntu/caddy"
else
    # Default location
    CADDY_CONFIG_DIR="/opt/caddy"
    sudo mkdir -p "$CADDY_CONFIG_DIR"
fi

echo "Using Caddy config directory: $CADDY_CONFIG_DIR"
CADDYFILE="$CADDY_CONFIG_DIR/Caddyfile"

# Check if itaboo.store is already configured
if [ -f "$CADDYFILE" ] && grep -q "itaboo.store" "$CADDYFILE"; then
    echo -e "${BLUE}itaboo.store already configured in Caddy${NC}"
else
    echo "Adding itaboo.store to Caddyfile..."

    # Backup existing Caddyfile
    if [ -f "$CADDYFILE" ]; then
        sudo cp "$CADDYFILE" "$CADDYFILE.backup.$(date +%Y%m%d-%H%M%S)"
    fi

    # Add configuration
    sudo tee -a "$CADDYFILE" > /dev/null << 'EOF'

# Taboo Store Configuration
itaboo.store {
    # Handle API routes
    handle /api/* {
        reverse_proxy localhost:5555 {
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Handle frontend (everything else)
    handle {
        reverse_proxy localhost:8080 {
            header_up Host {host}
            header_up X-Real-IP {remote}
            header_up X-Forwarded-For {remote}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    encode gzip zstd

    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    log {
        output file /var/log/caddy/itaboo-access.log
        format json
    }
}

www.itaboo.store {
    redir https://itaboo.store{uri} permanent
}
EOF
    echo -e "${GREEN}✓ Configuration added${NC}"
fi

# Reload Caddy
echo "Reloading Caddy..."
docker exec caddy caddy reload --config /etc/caddy/Caddyfile 2>/dev/null || docker restart caddy

echo -e "${GREEN}✓ Caddy configured${NC}"
ENDSSH

echo -e "${GREEN}✓ Caddy configuration complete${NC}"
echo ""

# Build and start Docker containers
echo -e "${YELLOW}Building and starting containers...${NC}"

remote_exec << 'ENDSSH'
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd /opt/taboostore

# Stop existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down 2>/dev/null || true

# Build images with production config and explicit build args
echo "Building Docker images..."
# First build backend
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache backend
# Then build frontend with the correct API URL
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache --build-arg VITE_API_URL=https://itaboo.store frontend

# Start containers with production config
echo "Starting containers..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for services
echo "Waiting for services to start..."
sleep 10

# Check status
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Containers are running${NC}"
else
    echo -e "${RED}✗ Containers failed to start${NC}"
    docker-compose logs --tail=20
    exit 1
fi
ENDSSH

echo -e "${GREEN}✓ Docker containers deployed${NC}"
echo ""

# Verify deployment
echo -e "${YELLOW}Verifying deployment...${NC}"

remote_exec << 'ENDSSH'
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "Running health checks..."

# Check backend
if curl -sf http://localhost:5555/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API healthy${NC}"
else
    echo -e "${RED}✗ Backend API not responding${NC}"
fi

# Check frontend
if curl -sf http://localhost:8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend accessible${NC}"
else
    echo -e "${RED}✗ Frontend not responding${NC}"
fi

# Check Caddy
if docker ps | grep -q caddy; then
    echo -e "${GREEN}✓ Caddy container running${NC}"
else
    echo -e "${RED}✗ Caddy not running${NC}"
fi

# Check if itaboo.store is configured
if docker exec caddy caddy list-modules 2>/dev/null | grep -q "http.handlers.reverse_proxy" || \
   docker exec caddy cat /etc/caddy/Caddyfile 2>/dev/null | grep -q "itaboo.store"; then
    echo -e "${GREEN}✓ itaboo.store configured in Caddy${NC}"
else
    echo -e "${YELLOW}⚠ Could not verify itaboo.store configuration${NC}"
fi

# Show running containers
echo ""
echo -e "${BLUE}Running containers:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -10
ENDSSH

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}     Deployment Complete!                   ${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${CYAN}Your app should be accessible at:${NC}"
echo -e "${BLUE}  https://itaboo.store${NC}"
echo ""
echo -e "${YELLOW}Note:${NC} DNS must point to $SERVER_IP"
echo -e "${YELLOW}Commands on server:${NC}"
echo -e "  ${CYAN}cd /opt/taboostore${NC}"
echo -e "  ${CYAN}docker-compose logs -f${NC}      # View logs"
echo -e "  ${CYAN}docker-compose restart${NC}      # Restart"
echo -e "  ${CYAN}docker exec caddy cat /etc/caddy/Caddyfile${NC}  # View Caddy config"
echo ""
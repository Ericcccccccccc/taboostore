# PR-008: Deployment Configuration

## Objective
Create deployment scripts and configuration for production deployment to Ubuntu VM with Caddy reverse proxy.

## Prerequisites
- PR-007 completed (Docker setup working)
- Domain (itaboo.store) pointed to VM IP
- Ubuntu 20.04+ VM with SSH access

## Tasks

### Required Files to Create

1. **`deploy.sh`** - Automated deployment script
2. **`caddy/Caddyfile`** - Caddy reverse proxy configuration
3. **`scripts/install-dependencies.sh`** - System dependency installer
4. **`.env.production`** - Production environment variables

### Implementation Details

#### `deploy.sh`
Idempotent deployment script:
```bash
#!/bin/bash
set -e

# Configuration
DOMAIN="itaboo.store"
APP_PORT="5555"
VM_USER="ubuntu"
VM_HOST="your-vm-ip"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting deployment to ${DOMAIN}...${NC}"

# Check if running locally or on VM
if [ "$1" == "remote" ]; then
    # Deploy to remote VM
    rsync -avz --exclude 'node_modules' --exclude '__pycache__' \
          --exclude '.git' . ${VM_USER}@${VM_HOST}:~/taboostore/

    ssh ${VM_USER}@${VM_HOST} "cd ~/taboostore && ./deploy.sh local"
    exit 0
fi

# Local deployment (on VM)
# 1. Install dependencies if needed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installing Docker...${NC}"
    ./scripts/install-dependencies.sh
fi

# 2. Stop existing containers
docker-compose down 2>/dev/null || true

# 3. Build and start new containers
echo -e "${GREEN}Building and starting containers...${NC}"
docker-compose -f docker-compose.yml up -d --build

# 4. Setup Caddy if needed
if ! command -v caddy &> /dev/null; then
    echo -e "${YELLOW}Installing Caddy...${NC}"
    # Install Caddy
    sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
    sudo apt update
    sudo apt install caddy
fi

# 5. Configure Caddy
sudo cp caddy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy

# 6. Health check
sleep 5
if curl -f http://localhost:${APP_PORT}/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Deployment successful!${NC}"
    echo -e "${GREEN}✓ Application available at https://${DOMAIN}${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    docker-compose logs
    exit 1
fi
```

#### `caddy/Caddyfile`
```caddyfile
itaboo.store {
    reverse_proxy localhost:5555

    # Optional: Add headers
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
        Referrer-Policy no-referrer-when-downgrade
    }

    # Enable compression
    encode gzip

    # Logging
    log {
        output file /var/log/caddy/itaboo.store.log
        format console
    }
}

# Redirect www to non-www
www.itaboo.store {
    redir https://itaboo.store{uri} permanent
}
```

#### `scripts/install-dependencies.sh`
```bash
#!/bin/bash
set -e

# Update system
sudo apt update
sudo apt upgrade -y

# Install Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    sudo apt install docker-compose -y
fi

# Install other tools
sudo apt install -y git curl wget htop

echo "Dependencies installed successfully!"
```

#### `.env.production`
```bash
# Backend
BACKEND_PORT=8000
CORS_ORIGINS=https://itaboo.store
ENVIRONMENT=production

# Frontend
VITE_API_URL=https://itaboo.store/api
NODE_ENV=production
```

### Deployment Workflow

1. **Initial Setup**
   ```bash
   # On local machine
   ./deploy.sh remote
   ```

2. **Updates**
   ```bash
   # Commit changes
   git add .
   git commit -m "Update feature X"

   # Deploy
   ./deploy.sh remote
   ```

3. **Rollback**
   ```bash
   # On VM
   docker-compose down
   git checkout <previous-commit>
   docker-compose up -d --build
   ```

### Monitoring & Maintenance

#### Health Checks
- Automated health endpoint monitoring
- Container restart policies
- Caddy automatic HTTPS renewal

#### Logs
```bash
# Application logs
docker-compose logs -f

# Caddy logs
sudo journalctl -u caddy -f

# Container stats
docker stats
```

## Acceptance Criteria
- [ ] Deploy script is idempotent
- [ ] HTTPS works with valid certificate
- [ ] Application accessible at itaboo.store
- [ ] Automatic HTTPS renewal configured
- [ ] Containers restart on failure
- [ ] Deployment completes in under 5 minutes
- [ ] Zero-downtime deployment

## Testing Checklist
- [ ] Fresh VM deployment works
- [ ] Update deployment preserves data
- [ ] HTTPS certificate valid
- [ ] www redirects to non-www
- [ ] Health checks pass
- [ ] Rollback procedure works

## Security Considerations
- [ ] Firewall configured (80, 443, 22 only)
- [ ] SSH key-only authentication
- [ ] Regular system updates scheduled
- [ ] Docker images scanned for vulnerabilities

## Notes
- Keep deployment simple and reliable
- Test on staging VM first if available
- Document any VM-specific configurations
- Consider backup strategy for data

## Completion Documentation
When complete, move this file to `task/complete/` and add:
- Actual deployment times
- VM specifications used
- Any issues encountered and solutions
- Monitoring setup details
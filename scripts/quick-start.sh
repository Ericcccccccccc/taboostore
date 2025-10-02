#!/bin/bash

# Quick Start Guide for Taboo Store Deployment
# This script provides an interactive guide for first-time deployment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

clear

cat << "EOF"
╔═══════════════════════════════════════════════╗
║                                               ║
║         Taboo Store Quick Start Guide        ║
║                                               ║
╔═══════════════════════════════════════════════╗

This guide will help you deploy Taboo Store to production.

EOF

echo -e "${YELLOW}Please answer the following questions:${NC}"
echo ""

# Check if running on a fresh server
read -p "Is this the first time deploying on this server? (y/n): " -n 1 -r
echo
FIRST_TIME=$REPLY

# Check if dependencies are installed
if [[ $FIRST_TIME =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}Step 1: Install Dependencies${NC}"
    echo "----------------------------------------"
    echo "This will install:"
    echo "  - Docker and Docker Compose"
    echo "  - Caddy web server"
    echo "  - System utilities"
    echo "  - Configure firewall"
    echo ""

    read -p "Install dependencies now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./scripts/install-dependencies.sh

        echo ""
        echo -e "${YELLOW}IMPORTANT: You must log out and log back in for Docker group membership to take effect.${NC}"
        echo ""
        read -p "Press Enter to continue after you've logged out and back in..."
    fi
fi

# Configure environment
echo ""
echo -e "${BLUE}Step 2: Configure Environment${NC}"
echo "----------------------------------------"

if [ ! -f .env.production ]; then
    echo "Creating .env.production from example..."
    cp .env.production.example .env.production

    read -p "Enter your domain name (e.g., itaboo.store): " DOMAIN
    read -p "Enter your backend port (default: 5555): " BACKEND_PORT
    BACKEND_PORT=${BACKEND_PORT:-5555}

    # Update .env.production
    sed -i "s|CORS_ORIGINS=.*|CORS_ORIGINS=https://${DOMAIN},https://www.${DOMAIN}|" .env.production
    sed -i "s|VITE_API_URL=.*|VITE_API_URL=https://${DOMAIN}/api|" .env.production
    sed -i "s|BACKEND_PORT=.*|BACKEND_PORT=${BACKEND_PORT}|" .env.production

    # Update Caddyfile
    sed -i "s|itaboo.store|${DOMAIN}|g" caddy/Caddyfile

    echo -e "${GREEN}✓ Environment configured for ${DOMAIN}${NC}"
else
    echo -e "${GREEN}✓ .env.production already exists${NC}"

    read -p "Do you want to edit it? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env.production
    fi
fi

# Verify DNS
echo ""
echo -e "${BLUE}Step 3: Verify DNS Configuration${NC}"
echo "----------------------------------------"
echo "Before deploying, ensure your domain DNS is configured:"
echo ""
echo "  A Record:    ${DOMAIN:-your-domain.com}    →  YOUR_SERVER_IP"
echo "  A Record:    www.${DOMAIN:-your-domain.com} →  YOUR_SERVER_IP"
echo ""

read -p "Is your DNS configured correctly? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}Please configure your DNS before proceeding.${NC}"
    echo "Deployment can continue, but HTTPS won't work until DNS is configured."
    echo ""
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Deploy
echo ""
echo -e "${BLUE}Step 4: Deploy Application${NC}"
echo "----------------------------------------"
echo ""

read -p "Ready to deploy? This will build and start all containers. (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    ./deploy.sh
else
    echo ""
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    echo "When ready, run: ./deploy.sh"
    exit 0
fi

# Post-deployment checks
echo ""
echo -e "${BLUE}Step 5: Verify Deployment${NC}"
echo "----------------------------------------"
echo ""

read -p "Run health checks? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    ./scripts/health-check.sh
fi

# Final instructions
echo ""
echo "╔═══════════════════════════════════════════════╗"
echo -e "║  ${GREEN}Deployment Complete!${NC}                       ║"
echo "╔═══════════════════════════════════════════════╗"
echo ""
echo "Your application should now be accessible at:"
echo -e "  ${BLUE}https://${DOMAIN:-itaboo.store}${NC}"
echo ""
echo "Useful commands:"
echo "  - Health check:    ./scripts/health-check.sh"
echo "  - View logs:       docker-compose logs -f"
echo "  - Backup:          ./scripts/backup.sh"
echo "  - Redeploy:        ./deploy.sh"
echo ""
echo "Documentation:"
echo "  - Full deployment guide: DEPLOYMENT.md"
echo "  - Project setup: PROJECT_SETUP_SUMMARY.md"
echo ""
echo "Next steps:"
echo "  1. Test your application in a browser"
echo "  2. Set up automated backups (cron job)"
echo "  3. Configure monitoring (optional)"
echo "  4. Review security settings"
echo ""

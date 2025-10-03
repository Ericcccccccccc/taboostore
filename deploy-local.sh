#!/bin/bash
set -e

# Local Development Deployment Script for Taboo Store
# This script builds and runs the app locally for development/testing

# Configuration
BACKEND_PORT="5555"
FRONTEND_PORT="8080"
COMPOSE_FILE="docker-compose.yml"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}    Taboo Store - Local Development        ${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    echo "Please install Docker Compose first"
    exit 1
fi

echo -e "${YELLOW}Building and starting containers...${NC}"

# Stop any existing containers
docker-compose down 2>/dev/null || true

# Build images
echo -e "${BLUE}Building Docker images...${NC}"
docker-compose build

# Start containers
echo -e "${BLUE}Starting containers...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 5

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Containers are running${NC}"
else
    echo -e "${RED}✗ Containers failed to start${NC}"
    echo -e "${RED}Check logs with: docker-compose logs${NC}"
    exit 1
fi

# Health check
echo -e "${YELLOW}Performing health checks...${NC}"

# Check backend
if curl -sf http://localhost:${BACKEND_PORT}/api/health > /dev/null; then
    echo -e "${GREEN}✓ Backend API is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    echo -e "Check logs: docker-compose logs backend"
fi

# Check frontend
if curl -sf http://localhost:${FRONTEND_PORT}/ > /dev/null; then
    echo -e "${GREEN}✓ Frontend is accessible${NC}"
else
    echo -e "${RED}✗ Frontend health check failed${NC}"
    echo -e "Check logs: docker-compose logs frontend"
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}       Local Deployment Complete!           ${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}Access the application at:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:${FRONTEND_PORT}${NC}"
echo -e "  Backend API: ${GREEN}http://localhost:${BACKEND_PORT}${NC}"
echo -e "  API Docs: ${GREEN}http://localhost:${BACKEND_PORT}/docs${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  View logs:    ${CYAN}docker-compose logs -f${NC}"
echo -e "  Stop:         ${CYAN}docker-compose down${NC}"
echo -e "  Restart:      ${CYAN}docker-compose restart${NC}"
echo -e "  Rebuild:      ${CYAN}docker-compose build --no-cache${NC}"
echo ""

# Show running containers
echo -e "${BLUE}Running containers:${NC}"
docker-compose ps
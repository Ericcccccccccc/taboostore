#!/bin/bash

# Health check script for Taboo Store
# Verifies all services are running and healthy

set -e

# Configuration
BACKEND_PORT="5555"
FRONTEND_PORT="8080"
DOMAIN="itaboo.store"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Exit codes
EXIT_SUCCESS=0
EXIT_ERROR=1

# Track overall health
OVERALL_HEALTH=0

print_header() {
    echo ""
    echo "=========================================="
    echo "   Taboo Store Health Check"
    echo "=========================================="
    echo ""
    echo "Timestamp: $(date)"
    echo ""
}

check_docker() {
    echo -n "Checking Docker daemon... "
    if docker info &> /dev/null; then
        echo -e "${GREEN}OK${NC}"
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        return 1
    fi
}

check_containers() {
    echo ""
    echo "Container Status:"
    echo "----------------------------------------"

    # Backend container
    echo -n "Backend container: "
    if docker ps | grep -q taboostore-backend; then
        if docker ps | grep taboostore-backend | grep -q "(healthy)"; then
            echo -e "${GREEN}Running (healthy)${NC}"
        else
            echo -e "${YELLOW}Running (starting)${NC}"
            OVERALL_HEALTH=1
        fi
    else
        echo -e "${RED}Not running${NC}"
        OVERALL_HEALTH=1
    fi

    # Frontend container
    echo -n "Frontend container: "
    if docker ps | grep -q taboostore-frontend; then
        if docker ps | grep taboostore-frontend | grep -q "(healthy)"; then
            echo -e "${GREEN}Running (healthy)${NC}"
        else
            echo -e "${YELLOW}Running (starting)${NC}"
            OVERALL_HEALTH=1
        fi
    else
        echo -e "${RED}Not running${NC}"
        OVERALL_HEALTH=1
    fi
}

check_endpoints() {
    echo ""
    echo "Endpoint Health:"
    echo "----------------------------------------"

    # Backend health endpoint
    echo -n "Backend API (http://localhost:${BACKEND_PORT}/api/health): "
    if curl -sf http://localhost:${BACKEND_PORT}/api/health > /dev/null; then
        RESPONSE=$(curl -s http://localhost:${BACKEND_PORT}/api/health)
        echo -e "${GREEN}OK${NC} - ${RESPONSE}"
    else
        echo -e "${RED}FAIL${NC}"
        OVERALL_HEALTH=1
    fi

    # Frontend
    echo -n "Frontend (http://localhost:${FRONTEND_PORT}/): "
    if curl -sf http://localhost:${FRONTEND_PORT}/ > /dev/null; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FAIL${NC}"
        OVERALL_HEALTH=1
    fi

    # Check if Caddy is running
    if command -v caddy &> /dev/null; then
        echo -n "Caddy service: "
        if systemctl is-active --quiet caddy; then
            echo -e "${GREEN}Active${NC}"

            # Check HTTPS endpoint if Caddy is running
            echo -n "Public HTTPS (https://${DOMAIN}): "
            if curl -sf -k https://${DOMAIN}/api/health > /dev/null 2>&1; then
                echo -e "${GREEN}OK${NC}"
            else
                echo -e "${YELLOW}Not accessible${NC} (DNS may not be configured)"
            fi
        else
            echo -e "${YELLOW}Not running${NC}"
        fi
    fi
}

check_resources() {
    echo ""
    echo "System Resources:"
    echo "----------------------------------------"

    # Disk usage
    echo "Disk usage:"
    df -h / | tail -n 1 | awk '{print "  Root: " $3 " used / " $2 " total (" $5 " used)"}'

    # Memory usage
    echo "Memory usage:"
    free -h | grep Mem | awk '{print "  RAM: " $3 " used / " $2 " total"}'

    # Docker stats (brief)
    echo ""
    echo "Container resource usage:"
    if command -v docker &> /dev/null && docker ps -q | grep -q .; then
        docker stats --no-stream --format "  {{.Name}}: CPU {{.CPUPerc}}, Memory {{.MemUsage}}" 2>/dev/null || echo "  Unable to fetch stats"
    fi
}

check_logs() {
    echo ""
    echo "Recent Errors in Logs:"
    echo "----------------------------------------"

    # Check for recent errors in backend logs
    BACKEND_ERRORS=$(docker logs taboostore-backend 2>&1 | tail -n 50 | grep -i "error" | tail -n 3 || echo "")
    if [ -n "$BACKEND_ERRORS" ]; then
        echo -e "${YELLOW}Backend errors found:${NC}"
        echo "$BACKEND_ERRORS" | sed 's/^/  /'
    else
        echo -e "${GREEN}No recent backend errors${NC}"
    fi

    # Check for recent errors in frontend logs
    FRONTEND_ERRORS=$(docker logs taboostore-frontend 2>&1 | tail -n 50 | grep -i "error" | tail -n 3 || echo "")
    if [ -n "$FRONTEND_ERRORS" ]; then
        echo -e "${YELLOW}Frontend errors found:${NC}"
        echo "$FRONTEND_ERRORS" | sed 's/^/  /'
    else
        echo -e "${GREEN}No recent frontend errors${NC}"
    fi
}

print_summary() {
    echo ""
    echo "=========================================="
    if [ $OVERALL_HEALTH -eq 0 ]; then
        echo -e "${GREEN}Overall Status: HEALTHY${NC}"
        echo "=========================================="
        return $EXIT_SUCCESS
    else
        echo -e "${RED}Overall Status: UNHEALTHY${NC}"
        echo "=========================================="
        echo ""
        echo "Troubleshooting tips:"
        echo "  - Check container logs: docker-compose logs -f"
        echo "  - Restart services: docker-compose restart"
        echo "  - Full restart: docker-compose down && docker-compose up -d"
        echo ""
        return $EXIT_ERROR
    fi
}

# Main execution
print_header

if ! check_docker; then
    echo -e "${RED}Docker is not running. Cannot perform health checks.${NC}"
    exit $EXIT_ERROR
fi

check_containers
check_endpoints
check_resources
check_logs
print_summary

exit $?

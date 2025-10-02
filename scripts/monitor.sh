#!/bin/bash

# Monitoring script for Taboo Store
# Continuously monitors application health and sends alerts on failures

set -e

# Configuration
CHECK_INTERVAL=60  # Check every 60 seconds
BACKEND_PORT="5555"
FRONTEND_PORT="8080"
ALERT_EMAIL=""  # Set to your email for alerts (requires mail command)
LOG_FILE="/var/log/taboostore-monitor.log"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Ensure log directory exists
sudo mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || LOG_FILE="./monitor.log"
sudo touch "$LOG_FILE" 2>/dev/null || LOG_FILE="./monitor.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

alert() {
    local message="$1"
    log "ALERT: $message"

    # Send email if configured
    if [ -n "$ALERT_EMAIL" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "Taboo Store Alert" "$ALERT_EMAIL"
    fi

    # You can add other alert methods here (Slack, Discord, etc.)
}

check_backend() {
    if curl -sf http://localhost:${BACKEND_PORT}/api/health > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

check_frontend() {
    if curl -sf http://localhost:${FRONTEND_PORT}/ > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

check_containers() {
    local failed=0

    if ! docker ps | grep -q taboostore-backend; then
        alert "Backend container is not running!"
        failed=1
    fi

    if ! docker ps | grep -q taboostore-frontend; then
        alert "Frontend container is not running!"
        failed=1
    fi

    return $failed
}

restart_service() {
    log "Attempting to restart service..."
    docker-compose restart

    # Wait for services to start
    sleep 10

    if check_backend && check_frontend; then
        log "Service restarted successfully"
        return 0
    else
        alert "Service restart failed!"
        return 1
    fi
}

# Main monitoring loop
log "Starting Taboo Store monitoring..."
log "Check interval: ${CHECK_INTERVAL} seconds"
log "Press Ctrl+C to stop"

CONSECUTIVE_FAILURES=0
MAX_FAILURES=3

while true; do
    # Check containers
    if ! check_containers; then
        CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
        log "Container check failed (${CONSECUTIVE_FAILURES}/${MAX_FAILURES})"

        if [ $CONSECUTIVE_FAILURES -ge $MAX_FAILURES ]; then
            restart_service
            CONSECUTIVE_FAILURES=0
        fi
    else
        # Check endpoints
        BACKEND_OK=0
        FRONTEND_OK=0

        if check_backend; then
            BACKEND_OK=1
        else
            log "Backend health check failed"
        fi

        if check_frontend; then
            FRONTEND_OK=1
        fi

        if [ $BACKEND_OK -eq 1 ] && [ $FRONTEND_OK -eq 1 ]; then
            # All checks passed
            if [ $CONSECUTIVE_FAILURES -gt 0 ]; then
                log "All health checks passed (recovered)"
            fi
            CONSECUTIVE_FAILURES=0
        else
            CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
            log "Health check failed (${CONSECUTIVE_FAILURES}/${MAX_FAILURES})"

            if [ $CONSECUTIVE_FAILURES -ge $MAX_FAILURES ]; then
                alert "Service is unhealthy after $MAX_FAILURES consecutive failures"
                restart_service
                CONSECUTIVE_FAILURES=0
            fi
        fi
    fi

    sleep $CHECK_INTERVAL
done

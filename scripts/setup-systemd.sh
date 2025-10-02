#!/bin/bash

# Setup systemd service for Taboo Store
# This ensures containers start automatically on system boot

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "[INFO] $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "=========================================="
echo "   Setup Systemd Service"
echo "=========================================="
echo ""

# Get current directory
APP_DIR=$(pwd)
USER=$(whoami)

log_info "Application directory: $APP_DIR"
log_info "User: $USER"

# Create systemd service file
SERVICE_FILE="/etc/systemd/system/taboostore.service"

log_info "Creating systemd service file..."

sudo tee $SERVICE_FILE > /dev/null << EOF
[Unit]
Description=Taboo Store Web Application
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
User=$USER
Group=$USER

# Start containers
ExecStart=/usr/bin/docker-compose -f docker-compose.yml up -d

# Stop containers
ExecStop=/usr/bin/docker-compose -f docker-compose.yml down

# Restart policy
Restart=on-failure
RestartSec=10s

# Environment
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

[Install]
WantedBy=multi-user.target
EOF

log_success "Systemd service file created"

# Reload systemd
log_info "Reloading systemd daemon..."
sudo systemctl daemon-reload

# Enable service
log_info "Enabling service to start on boot..."
sudo systemctl enable taboostore.service

log_success "Service enabled"

# Display status
echo ""
log_info "Service status:"
sudo systemctl status taboostore.service --no-pager || true

echo ""
echo "=========================================="
log_success "Systemd service setup complete!"
echo "=========================================="
echo ""
log_info "Useful commands:"
echo "  - Start service:    sudo systemctl start taboostore"
echo "  - Stop service:     sudo systemctl stop taboostore"
echo "  - Restart service:  sudo systemctl restart taboostore"
echo "  - Service status:   sudo systemctl status taboostore"
echo "  - View logs:        sudo journalctl -u taboostore -f"
echo ""
log_info "The service will now start automatically on system boot."
echo ""

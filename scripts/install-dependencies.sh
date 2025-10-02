#!/bin/bash
set -e

# Install system dependencies for Taboo Store deployment
# Tested on Ubuntu 20.04+

echo "=========================================="
echo "   Installing System Dependencies"
echo "=========================================="
echo ""

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

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    log_error "Please do not run this script as root. Use a regular user with sudo privileges."
    exit 1
fi

# Check Ubuntu version
if [ -f /etc/os-release ]; then
    . /etc/os-release
    log_info "Detected OS: $NAME $VERSION"

    if [[ ! "$NAME" =~ "Ubuntu" ]]; then
        log_error "This script is designed for Ubuntu. Detected: $NAME"
        log_error "Installation may fail or behave unexpectedly."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    log_error "Cannot detect OS version. /etc/os-release not found."
    exit 1
fi

# Update system
log_info "Updating system packages..."
sudo apt update
sudo apt upgrade -y
log_success "System updated"

# Install essential tools
log_info "Installing essential tools..."
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    wget \
    gnupg \
    lsb-release \
    git \
    htop \
    vim \
    ufw \
    unzip
log_success "Essential tools installed"

# Install Docker
if command -v docker &> /dev/null; then
    log_info "Docker is already installed: $(docker --version)"
else
    log_info "Installing Docker..."

    # Remove old versions
    sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

    # Install Docker using official script
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh

    # Add current user to docker group
    sudo usermod -aG docker $USER

    log_success "Docker installed: $(docker --version)"
    log_info "You may need to log out and back in for docker group membership to take effect"
fi

# Install Docker Compose
if command -v docker-compose &> /dev/null; then
    log_info "Docker Compose is already installed: $(docker-compose --version)"
else
    log_info "Installing Docker Compose..."

    # Try to install via apt first (Ubuntu 20.04+)
    if sudo apt install -y docker-compose; then
        log_success "Docker Compose installed via apt: $(docker-compose --version)"
    else
        # Fallback to manual installation
        COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep -Po '"tag_name": "\K.*?(?=")')
        sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        log_success "Docker Compose installed manually: $(docker-compose --version)"
    fi
fi

# Configure firewall (UFW)
log_info "Configuring firewall..."
if command -v ufw &> /dev/null; then
    # Allow SSH
    sudo ufw allow 22/tcp

    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp

    # Enable firewall (if not already enabled)
    if sudo ufw status | grep -q "Status: active"; then
        log_info "Firewall is already active"
    else
        echo "y" | sudo ufw enable
    fi

    sudo ufw status numbered
    log_success "Firewall configured"
else
    log_info "UFW not available, skipping firewall configuration"
fi

# Install Caddy
if command -v caddy &> /dev/null; then
    log_info "Caddy is already installed: $(caddy version)"
else
    log_info "Installing Caddy web server..."

    # Add Caddy repository
    sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list

    # Install Caddy
    sudo apt update
    sudo apt install -y caddy

    # Create log directory
    sudo mkdir -p /var/log/caddy
    sudo chown caddy:caddy /var/log/caddy

    log_success "Caddy installed: $(caddy version)"
fi

# Create application directory
APP_DIR="/opt/taboostore"
if [ ! -d "$APP_DIR" ]; then
    log_info "Creating application directory: $APP_DIR"
    sudo mkdir -p "$APP_DIR"
    sudo chown $USER:$USER "$APP_DIR"
    log_success "Application directory created"
else
    log_info "Application directory already exists: $APP_DIR"
fi

# Set up swap if not exists (for low-memory VMs)
if [ $(swapon --show | wc -l) -eq 0 ]; then
    log_info "Setting up swap space (2GB)..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile

    # Make swap permanent
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi

    log_success "Swap space configured"
else
    log_info "Swap space already configured"
fi

# Configure system limits for Docker
log_info "Configuring system limits..."
if ! grep -q "fs.inotify.max_user_watches" /etc/sysctl.conf; then
    echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    log_success "System limits configured"
fi

echo ""
echo "=========================================="
log_success "Installation complete!"
echo "=========================================="
echo ""
log_info "Installed components:"
echo "  - Docker: $(docker --version)"
echo "  - Docker Compose: $(docker-compose --version)"
echo "  - Caddy: $(caddy version)"
echo ""
log_info "Next steps:"
echo "  1. Log out and back in for Docker group membership to take effect"
echo "  2. Clone your repository to $APP_DIR"
echo "  3. Configure your domain DNS to point to this server's IP"
echo "  4. Run ./deploy.sh to deploy the application"
echo ""

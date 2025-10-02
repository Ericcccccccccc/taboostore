#!/bin/bash

# Backup script for Taboo Store
# Creates backups of Docker volumes, configurations, and data

set -e

# Configuration
BACKUP_DIR="/var/backups/taboostore"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="taboostore-backup-${TIMESTAMP}"

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

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "=========================================="
echo "   Taboo Store Backup Script"
echo "=========================================="
echo ""
log_info "Starting backup at $(date)"

# Create backup directory
if [ ! -d "$BACKUP_DIR" ]; then
    log_info "Creating backup directory: $BACKUP_DIR"
    sudo mkdir -p "$BACKUP_DIR"
    sudo chown $USER:$USER "$BACKUP_DIR"
fi

CURRENT_BACKUP_DIR="${BACKUP_DIR}/${BACKUP_NAME}"
mkdir -p "$CURRENT_BACKUP_DIR"

log_info "Backup destination: $CURRENT_BACKUP_DIR"

# Backup Docker volumes
log_info "Backing up Docker volumes..."
if docker volume ls | grep -q taboostore; then
    docker volume ls | grep taboostore | awk '{print $2}' | while read volume; do
        log_info "Backing up volume: $volume"
        docker run --rm \
            -v ${volume}:/source:ro \
            -v ${CURRENT_BACKUP_DIR}:/backup \
            alpine \
            tar czf /backup/${volume}.tar.gz -C /source .
        log_success "Volume $volume backed up"
    done
else
    log_warning "No Docker volumes found for taboostore"
fi

# Backup configuration files
log_info "Backing up configuration files..."
CONFIG_BACKUP="${CURRENT_BACKUP_DIR}/config"
mkdir -p "$CONFIG_BACKUP"

# Backup docker-compose.yml
if [ -f docker-compose.yml ]; then
    cp docker-compose.yml "$CONFIG_BACKUP/"
    log_success "docker-compose.yml backed up"
fi

# Backup Caddyfile
if [ -f caddy/Caddyfile ]; then
    mkdir -p "$CONFIG_BACKUP/caddy"
    cp caddy/Caddyfile "$CONFIG_BACKUP/caddy/"
    log_success "Caddyfile backed up"
fi

# Backup .env files (if they exist)
if [ -f .env.production ]; then
    cp .env.production "$CONFIG_BACKUP/"
    log_success ".env.production backed up"
fi

# Backup application data
log_info "Backing up application data..."
if [ -d backend/data ]; then
    cp -r backend/data "$CONFIG_BACKUP/"
    log_success "Backend data backed up"
fi

# Export Docker images (optional, takes more space)
if [ "$1" == "--include-images" ]; then
    log_info "Exporting Docker images..."
    IMAGES_DIR="${CURRENT_BACKUP_DIR}/images"
    mkdir -p "$IMAGES_DIR"

    docker images | grep taboostore | awk '{print $1":"$2}' | while read image; do
        IMAGE_FILE=$(echo $image | tr ':/' '-')
        log_info "Exporting image: $image"
        docker save -o "${IMAGES_DIR}/${IMAGE_FILE}.tar" "$image"
        log_success "Image $image exported"
    done
fi

# Create backup metadata
log_info "Creating backup metadata..."
cat > "${CURRENT_BACKUP_DIR}/backup-info.txt" << EOF
Backup Information
==================
Timestamp: $(date)
Hostname: $(hostname)
Backup Name: ${BACKUP_NAME}
Docker Version: $(docker --version)
Docker Compose Version: $(docker-compose --version)

Container Status at Backup Time:
$(docker-compose ps 2>/dev/null || echo "No containers running")

Git Commit (if available):
$(git rev-parse HEAD 2>/dev/null || echo "Not a git repository")

Backup Contents:
$(ls -lh "$CURRENT_BACKUP_DIR")
EOF

log_success "Backup metadata created"

# Compress the entire backup
log_info "Compressing backup..."
cd "$BACKUP_DIR"
tar czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
BACKUP_SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
log_success "Backup compressed: ${BACKUP_NAME}.tar.gz (${BACKUP_SIZE})"

# Remove uncompressed backup directory
rm -rf "$BACKUP_NAME"

# Clean up old backups
log_info "Cleaning up old backups (keeping last ${RETENTION_DAYS} days)..."
find "$BACKUP_DIR" -name "taboostore-backup-*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete
REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "taboostore-backup-*.tar.gz" -type f | wc -l)
log_success "Old backups cleaned up. ${REMAINING_BACKUPS} backups remaining"

echo ""
echo "=========================================="
log_success "Backup completed successfully!"
echo "=========================================="
echo ""
log_info "Backup details:"
echo "  - Location: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo "  - Size: ${BACKUP_SIZE}"
echo "  - Total backups: ${REMAINING_BACKUPS}"
echo ""
log_info "To restore from this backup:"
echo "  1. Extract: tar xzf ${BACKUP_NAME}.tar.gz"
echo "  2. Stop containers: docker-compose down"
echo "  3. Restore volumes from extracted .tar.gz files"
echo "  4. Restore configuration files"
echo "  5. Start containers: docker-compose up -d"
echo ""

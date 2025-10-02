# Taboo Store - Deployment Guide

This guide covers deploying the Taboo Store web game to a production Ubuntu VM with automatic HTTPS via Caddy.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Deployment](#deployment)
- [Post-Deployment](#post-deployment)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Server Requirements

- **Operating System**: Ubuntu 20.04 LTS or newer
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB free space
- **CPU**: 2 cores minimum
- **Network**: Public IP address with ports 22, 80, and 443 accessible

### Domain Configuration

- Domain name (e.g., `itaboo.store`) pointed to your server's public IP
- DNS A record configured:
  ```
  itaboo.store        A    YOUR_SERVER_IP
  www.itaboo.store    A    YOUR_SERVER_IP
  ```

### Local Requirements

- Git installed
- SSH access to the server
- SSH key configured for the server

## Initial Setup

### 1. Server Access

SSH into your Ubuntu server:

```bash
ssh ubuntu@YOUR_SERVER_IP
```

### 2. Install Dependencies

Clone the repository and install system dependencies:

```bash
# Create application directory
sudo mkdir -p /opt/taboostore
sudo chown $USER:$USER /opt/taboostore
cd /opt/taboostore

# Clone repository
git clone https://github.com/YOUR_USERNAME/taboostore.git .

# Install system dependencies
./scripts/install-dependencies.sh
```

This script installs:
- Docker and Docker Compose
- Caddy web server
- Essential system tools
- Configures firewall (UFW)
- Sets up swap space

**Important**: After installation, log out and log back in for Docker group membership to take effect.

```bash
exit
ssh ubuntu@YOUR_SERVER_IP
```

### 3. Configure Environment

Copy the example environment file and update values:

```bash
cd /opt/taboostore
cp .env.production.example .env.production
```

Edit `.env.production` with your actual domain:

```bash
# Update CORS_ORIGINS with your domain
CORS_ORIGINS=https://itaboo.store,https://www.itaboo.store

# Update API URL
VITE_API_URL=https://itaboo.store/api
```

### 4. Update Caddy Configuration

The `caddy/Caddyfile` is pre-configured for `itaboo.store`. If you're using a different domain, update it:

```bash
vim caddy/Caddyfile
```

Replace `itaboo.store` with your domain name.

## Deployment

### Automated Deployment

The deployment script handles everything automatically:

```bash
cd /opt/taboostore
./deploy.sh
```

The script will:
1. ✓ Check prerequisites (Docker, Docker Compose)
2. ✓ Pull latest code from git
3. ✓ Build Docker images
4. ✓ Start containers with health checks
5. ✓ Configure Caddy reverse proxy
6. ✓ Verify all services are healthy
7. ✓ Display deployment status

### What the Script Does

- **Idempotent**: Can be run multiple times safely
- **Zero-downtime**: Uses Docker Compose's rolling updates
- **Health Checks**: Verifies backend and frontend are responding
- **Automatic Rollback**: Reverts to previous version if health checks fail
- **Logging**: Creates deployment log file for troubleshooting

### Expected Output

```
==========================================
   Taboo Store Deployment Script
==========================================

[INFO] Starting deployment to itaboo.store...
[INFO] Timestamp: 2025-10-02 10:30:00

[INFO] Checking prerequisites...
[SUCCESS] Docker and Docker Compose are installed
[SUCCESS] Docker daemon is running
[INFO] Current commit: abc123def456
[INFO] Building Docker images...
[INFO] Starting new containers...
[INFO] Waiting for services to become healthy...
[SUCCESS] Services are healthy
[INFO] Performing health checks...
[SUCCESS] Backend health check passed
[SUCCESS] Frontend health check passed
[INFO] Configuring Caddy reverse proxy...
[SUCCESS] Caddyfile is valid
[SUCCESS] Caddy configuration reloaded
[INFO] Cleaning up old Docker images...

==========================================
[SUCCESS] Deployment completed successfully!
==========================================

Application Details:
  - Backend API: http://localhost:5555
  - Frontend: http://localhost:8080
  - Public URL: https://itaboo.store

Deployment log saved to: deployment-20251002-103000.log
```

## Post-Deployment

### Verify Deployment

Run the health check script:

```bash
./scripts/health-check.sh
```

This checks:
- Docker daemon status
- Container health status
- API endpoints
- HTTPS accessibility
- System resources
- Recent errors in logs

### Test HTTPS

Visit your domain in a browser:

```
https://itaboo.store
```

You should see:
- ✓ Valid SSL certificate (Let's Encrypt)
- ✓ Green padlock in browser
- ✓ Application loads correctly
- ✓ API calls work

### Monitor Services

```bash
# View container status
docker-compose ps

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend
docker-compose logs -f frontend

# View resource usage
docker stats

# View Caddy logs
sudo journalctl -u caddy -f
```

## Maintenance

### Updates and Redeployment

To deploy updates:

```bash
# Pull latest changes
cd /opt/taboostore
git pull origin main

# Deploy
./deploy.sh
```

### Manual Container Management

```bash
# Restart all containers
docker-compose restart

# Restart specific container
docker-compose restart backend

# Stop all containers
docker-compose down

# Start all containers
docker-compose up -d

# Rebuild and restart
docker-compose up -d --build --force-recreate
```

### Backups

Create a backup:

```bash
# Basic backup
./scripts/backup.sh

# Backup including Docker images (larger)
./scripts/backup.sh --include-images
```

Backups are stored in `/var/backups/taboostore/` and retained for 30 days.

To restore a backup:

```bash
# Extract backup
cd /var/backups/taboostore
tar xzf taboostore-backup-TIMESTAMP.tar.gz

# Stop containers
cd /opt/taboostore
docker-compose down

# Restore configuration files
cp /var/backups/taboostore/taboostore-backup-TIMESTAMP/config/* .

# Restore Docker volumes (manual process)
# See backup-info.txt in backup for details

# Start containers
docker-compose up -d
```

### SSL Certificate Renewal

Caddy automatically renews SSL certificates. To verify:

```bash
# Check Caddy status
sudo systemctl status caddy

# View Caddy logs
sudo journalctl -u caddy -n 50

# Manually reload Caddy (if needed)
sudo systemctl reload caddy
```

### System Updates

```bash
# Update system packages
sudo apt update
sudo apt upgrade -y

# Update Docker images
cd /opt/taboostore
docker-compose pull
./deploy.sh
```

## Troubleshooting

### Deployment Failed

**Check deployment logs:**
```bash
cat deployment-*.log | tail -n 100
```

**Check container status:**
```bash
docker-compose ps
docker-compose logs -f
```

**Common issues:**
- Port conflicts: Ensure ports 5555 and 8080 are not in use
- Docker daemon not running: `sudo systemctl start docker`
- Permission issues: Ensure user is in docker group

### Health Checks Failing

**Run health check script:**
```bash
./scripts/health-check.sh
```

**Check individual services:**
```bash
# Backend health
curl http://localhost:5555/api/health

# Frontend
curl http://localhost:8080/

# Container logs
docker logs taboostore-backend
docker logs taboostore-frontend
```

### HTTPS Not Working

**Verify Caddy is running:**
```bash
sudo systemctl status caddy
```

**Check Caddy logs:**
```bash
sudo journalctl -u caddy -n 100
```

**Verify DNS:**
```bash
nslookup itaboo.store
# Should return your server's IP
```

**Verify firewall:**
```bash
sudo ufw status
# Ensure ports 80 and 443 are open
```

**Test Caddyfile syntax:**
```bash
sudo caddy validate --config /etc/caddy/Caddyfile
```

### Containers Keep Restarting

**Check resource usage:**
```bash
docker stats
free -h
df -h
```

**Check container logs:**
```bash
docker-compose logs --tail=100
```

**Increase swap if low on memory:**
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Rollback to Previous Version

**Manual rollback:**
```bash
# Find previous commit
git log --oneline -n 10

# Checkout previous version
git checkout PREVIOUS_COMMIT_HASH

# Redeploy
./deploy.sh

# Or return to latest
git checkout main
```

### Firewall Issues

**Check firewall status:**
```bash
sudo ufw status numbered
```

**Ensure required ports are open:**
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
```

### Performance Issues

**Monitor resources:**
```bash
# Real-time monitoring
htop

# Docker stats
docker stats

# Disk usage
df -h

# Network usage
iftop
```

**Optimize Docker:**
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused containers
docker container prune
```

## Security Best Practices

### Firewall Configuration

Only expose necessary ports:
```bash
sudo ufw status
# Should only show: 22, 80, 443
```

### SSH Hardening

Disable password authentication (use SSH keys only):
```bash
sudo vim /etc/ssh/sshd_config

# Set:
# PasswordAuthentication no
# PubkeyAuthentication yes

sudo systemctl restart sshd
```

### Automatic Security Updates

Enable unattended upgrades:
```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Docker Security

- Keep Docker updated
- Regularly scan images for vulnerabilities
- Use non-root users in containers (already configured)
- Monitor container logs for suspicious activity

## Additional Resources

- **Docker Documentation**: https://docs.docker.com/
- **Caddy Documentation**: https://caddyserver.com/docs/
- **Ubuntu Server Guide**: https://ubuntu.com/server/docs
- **Let's Encrypt**: https://letsencrypt.org/

## Support

For issues specific to Taboo Store:
1. Check the health check output: `./scripts/health-check.sh`
2. Review deployment logs
3. Check container logs: `docker-compose logs`
4. Review this troubleshooting guide

---

**Last Updated**: 2025-10-02
**Version**: 1.0.0

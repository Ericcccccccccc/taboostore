# Taboo Store - Quick Reference Card

Quick reference for common deployment and maintenance commands.

---

## Initial Deployment

### Option 1: Interactive Wizard (Recommended)
```bash
./scripts/quick-start.sh
```
Guides you through the entire setup process.

### Option 2: Manual Setup
```bash
# 1. Install dependencies (one-time)
./scripts/install-dependencies.sh

# 2. Configure environment
cp .env.production.example .env.production
nano .env.production  # Edit domain and settings

# 3. Deploy
./deploy.sh
```

---

## Daily Operations

### Deploy / Update Application
```bash
cd /opt/taboostore
git pull origin main
./deploy.sh
```

### Check Application Health
```bash
./scripts/health-check.sh
```

### View Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend

# Caddy logs
sudo journalctl -u caddy -f
```

### Create Backup
```bash
# Standard backup
./scripts/backup.sh

# Include Docker images (larger)
./scripts/backup.sh --include-images
```

---

## Container Management

### Start/Stop/Restart
```bash
# Start all containers
docker-compose up -d

# Stop all containers
docker-compose down

# Restart all containers
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend

# Force rebuild and restart
docker-compose up -d --build --force-recreate
```

### Container Status
```bash
# List containers
docker-compose ps

# Resource usage
docker stats

# Container details
docker inspect taboostore-backend
docker inspect taboostore-frontend
```

---

## Monitoring

### Start Continuous Monitoring
```bash
# Run in background with screen/tmux
screen -S monitor
./scripts/monitor.sh
# Press Ctrl+A, D to detach

# Reattach to monitor
screen -r monitor
```

### Setup Automatic Startup
```bash
# Enable systemd service
./scripts/setup-systemd.sh

# Manage service
sudo systemctl start taboostore
sudo systemctl stop taboostore
sudo systemctl restart taboostore
sudo systemctl status taboostore
```

---

## Troubleshooting

### Deployment Failed
```bash
# Check deployment logs
cat deployment-*.log | tail -n 100

# Check container logs
docker-compose logs --tail=100

# Restart from scratch
docker-compose down
docker-compose up -d --build
```

### Service Not Responding
```bash
# Run health check
./scripts/health-check.sh

# Check specific endpoint
curl http://localhost:5555/api/health  # Backend
curl http://localhost:8080/            # Frontend

# Check container status
docker-compose ps

# View recent logs
docker-compose logs --tail=50 backend
```

### HTTPS Issues
```bash
# Check Caddy status
sudo systemctl status caddy

# Reload Caddy configuration
sudo systemctl reload caddy

# Validate Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile

# Check DNS
nslookup itaboo.store

# Caddy logs
sudo journalctl -u caddy -n 100
```

### Out of Disk Space
```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a  # Remove all unused images
docker volume prune     # Remove unused volumes

# Clean old logs
docker-compose logs --tail=0  # Rotate logs
```

### Performance Issues
```bash
# Check resource usage
htop
docker stats

# Check system load
uptime

# Check network
netstat -tuln

# Optimize Docker
docker system df                    # Show Docker disk usage
docker image prune -a              # Remove unused images
docker container prune             # Remove stopped containers
```

---

## Backup & Restore

### Create Backup
```bash
./scripts/backup.sh
```
Backups are stored in `/var/backups/taboostore/`

### Restore from Backup
```bash
# 1. Stop containers
docker-compose down

# 2. Extract backup
cd /var/backups/taboostore
tar xzf taboostore-backup-TIMESTAMP.tar.gz

# 3. Restore configuration
cp taboostore-backup-TIMESTAMP/config/* /opt/taboostore/

# 4. Restore volumes (manual - see backup-info.txt)

# 5. Start containers
cd /opt/taboostore
docker-compose up -d
```

---

## Security

### Firewall
```bash
# Check firewall status
sudo ufw status

# Allow required ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# Enable firewall
sudo ufw enable
```

### SSL/TLS
```bash
# Check certificate
echo | openssl s_client -connect itaboo.store:443 2>/dev/null | openssl x509 -noout -dates

# Caddy handles automatic renewal - check logs
sudo journalctl -u caddy | grep -i cert
```

### System Updates
```bash
# Update packages
sudo apt update
sudo apt upgrade -y

# Reboot if kernel updated
sudo reboot
```

---

## Useful Endpoints

- **Backend API**: http://localhost:5555
- **Backend Health**: http://localhost:5555/api/health
- **Frontend**: http://localhost:8080
- **Public Site**: https://itaboo.store

---

## File Locations

- **Application**: `/opt/taboostore/`
- **Backups**: `/var/backups/taboostore/`
- **Caddy Config**: `/etc/caddy/Caddyfile`
- **Caddy Logs**: `/var/log/caddy/itaboo.store.log`
- **Monitor Logs**: `/var/log/taboostore-monitor.log`
- **Deployment Logs**: `./deployment-*.log`

---

## Cron Jobs (Optional)

```bash
# Edit crontab
crontab -e

# Add these lines:

# Daily backup at 2 AM
0 2 * * * cd /opt/taboostore && ./scripts/backup.sh

# Daily health check at 6 AM
0 6 * * * cd /opt/taboostore && ./scripts/health-check.sh >> /var/log/daily-health.log

# Weekly system update (Sunday at 3 AM)
0 3 * * 0 sudo apt update && sudo apt upgrade -y
```

---

## Emergency Procedures

### Complete Service Restart
```bash
docker-compose down
docker-compose up -d --build --force-recreate
```

### Rollback to Previous Version
```bash
# Find previous commit
git log --oneline -n 10

# Rollback
git checkout COMMIT_HASH
./deploy.sh

# Return to latest
git checkout main
./deploy.sh
```

### Nuclear Option (Reset Everything)
```bash
# WARNING: This removes all containers and volumes
docker-compose down -v
docker system prune -a --volumes
./deploy.sh
```

---

## Getting Help

1. **Check Health**: `./scripts/health-check.sh`
2. **Check Logs**: `docker-compose logs -f`
3. **Check Documentation**: `DEPLOYMENT.md`
4. **Check Deployment Logs**: `cat deployment-*.log`

---

**For detailed information, see `DEPLOYMENT.md`**

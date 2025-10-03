# Oracle Cloud Deployment Guide for Taboo Store

## Server Details

- **Server IP**: 170.9.233.1
- **User**: ubuntu
- **SSH Key**: `~/Documents/tech/notatherapist/oracle-ssh.key`
- **Domain**: itaboo.store
- **App Location**: `/opt/taboostore`

## Prerequisites

### 1. Oracle Cloud Configuration

Ensure your Oracle Cloud instance has:

- **Security List Rules** (in Oracle Cloud Console):
  - Ingress Rule for SSH (port 22) - source: 0.0.0.0/0
  - Ingress Rule for HTTP (port 80) - source: 0.0.0.0/0
  - Ingress Rule for HTTPS (port 443) - source: 0.0.0.0/0

- **Instance Configuration**:
  - Ubuntu 20.04 or newer
  - At least 2GB RAM (4GB recommended)
  - 20GB+ storage

### 2. DNS Configuration

Point your domain to the Oracle Cloud server:

```
Type: A Record
Name: itaboo.store
Value: 170.9.233.1
TTL: 300 (5 minutes for testing, increase to 3600 later)
```

Also add:
```
Type: A Record
Name: www.itaboo.store
Value: 170.9.233.1
TTL: 300
```

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

From your local machine, run:

```bash
# Make sure you're in the taboostore directory
cd ~/PROJECTS/taboostore

# Run the Oracle-specific deployment script
./deploy-oracle.sh
```

This script will:
1. Connect to your Oracle Cloud server
2. Install Docker, Docker Compose, Git, and Caddy
3. Clone/update the repository
4. Configure the environment
5. Setup HTTPS with Caddy
6. Build and start Docker containers
7. Configure firewall rules
8. Verify the deployment

### Option 2: Manual Deployment

If you prefer to deploy manually:

```bash
# SSH into the server
ssh -i ~/Documents/tech/notatherapist/oracle-ssh.key \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    ubuntu@170.9.233.1

# Once on the server:
cd /opt
sudo git clone https://github.com/Ericcccccccccc/taboostore.git
cd taboostore
sudo chown -R ubuntu:ubuntu .
chmod +x scripts/*.sh
./scripts/quick-start.sh
```

## Post-Deployment Checklist

After deployment, verify:

- [ ] Docker containers are running: `docker-compose ps`
- [ ] Backend API is accessible: `curl http://localhost:5555/api/health`
- [ ] Frontend is accessible: `curl http://localhost:8080`
- [ ] Caddy is running: `sudo systemctl status caddy`
- [ ] HTTPS works: Visit https://itaboo.store

## Common Commands

### SSH into Server
```bash
ssh -i ~/Documents/tech/notatherapist/oracle-ssh.key \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3 \
    ubuntu@170.9.233.1
```

### On the Server

```bash
# Navigate to app directory
cd /opt/taboostore

# View logs
docker-compose logs -f

# Restart containers
docker-compose restart

# Stop containers
docker-compose down

# Rebuild and start
docker-compose build
docker-compose up -d

# Check Caddy status
sudo systemctl status caddy
sudo journalctl -u caddy -f

# Update from GitHub
git pull origin main
./deploy-local.sh
```

## Troubleshooting

### Issue: Cannot connect via SSH

1. Check SSH key permissions:
```bash
chmod 600 ~/Documents/tech/notatherapist/oracle-ssh.key
```

2. Verify Oracle Cloud Security List allows port 22

### Issue: Website not accessible

1. Check Oracle Cloud Security List for ports 80 and 443
2. Verify DNS propagation:
```bash
dig itaboo.store
nslookup itaboo.store
```

3. Check if containers are running:
```bash
ssh -i ~/Documents/tech/notatherapist/oracle-ssh.key ubuntu@170.9.233.1
docker-compose ps
docker-compose logs
```

### Issue: HTTPS certificate error

1. Check Caddy logs:
```bash
sudo journalctl -u caddy -f
```

2. Ensure domain points to correct IP:
```bash
dig itaboo.store +short
# Should return: 170.9.233.1
```

### Issue: Containers not starting

1. Check Docker logs:
```bash
docker-compose logs backend
docker-compose logs frontend
```

2. Verify port availability:
```bash
sudo netstat -tulpn | grep -E '(5555|8080|80|443)'
```

## Oracle Cloud Specific Notes

### Free Tier Limitations

If using Oracle Cloud Free Tier:
- Instance may be reclaimed if idle for 7 days
- Limited to 1GB RAM on Always Free instances (may need optimization)
- Network bandwidth limited to 10 Mbps

### Performance Optimization

For better performance on limited resources:

1. Enable swap (if not already enabled):
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

2. Optimize Docker:
```bash
# Limit container memory usage
docker-compose down
# Edit docker-compose.yml to add memory limits
docker-compose up -d
```

### Firewall Configuration

Oracle Cloud uses both Security Lists (cloud level) and iptables (OS level):

1. **Security Lists** (Oracle Cloud Console):
   - Must be configured in the web console
   - Controls traffic before it reaches the instance

2. **OS Firewall** (iptables/ufw):
   - Already configured by deployment script
   - Secondary layer of security

## Monitoring

### Setup Monitoring
```bash
# On the server
cd /opt/taboostore
./scripts/monitor.sh
```

### View Metrics
```bash
# Container stats
docker stats

# Disk usage
df -h

# Memory usage
free -h

# Network connections
netstat -tulpn
```

## Backup

Create regular backups:

```bash
# Manual backup
cd /opt/taboostore
./scripts/backup.sh

# Schedule daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/taboostore/scripts/backup.sh") | crontab -
```

## Updates

To deploy updates:

```bash
# From local machine
cd ~/PROJECTS/taboostore
git add .
git commit -m "Update message"
git push origin main

# Then deploy
./deploy-oracle.sh
```

Or on the server:
```bash
cd /opt/taboostore
git pull origin main
./deploy-local.sh
```

## Security Recommendations

1. **SSH Key Security**:
   - Keep your SSH key secure
   - Never commit it to version control
   - Use passphrase protection

2. **Regular Updates**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Monitor Access Logs**:
   ```bash
   sudo tail -f /var/log/caddy/access.log
   sudo tail -f /var/log/auth.log
   ```

4. **Fail2ban** (optional):
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

## Support

For issues specific to:
- **Oracle Cloud**: Check Oracle Cloud Console and documentation
- **Application**: Check logs with `docker-compose logs`
- **Deployment**: Review `/opt/taboostore/deploy.log`

---

Last updated: 2025-10-02
Server IP: 170.9.233.1
Domain: itaboo.store
# Deployment Guide

This document provides comprehensive instructions for deploying Kura to various environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Production Build](#production-build)
4. [Deployment Options](#deployment-options)
5. [SSL/HTTPS Configuration](#sslhttps-configuration)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **OS**: Linux (Ubuntu 20.04+ recommended) or macOS
- **CPU**: 2+ cores
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 10GB minimum

### Software Requirements
- Node.js 18+ and Yarn
- Python 3.11+
- MongoDB 5.0+
- Nginx (for reverse proxy)
- Supervisor (for process management)
- Git

---

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/kura.git
cd kura
```

### 2. Backend Configuration

**Install Dependencies:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Configure Environment:**
```bash
cp .env.example .env
nano .env
```

**Required Variables:**
```bash
MONGO_URL=mongodb://localhost:27017
DB_NAME=kura
CACHE_TTL=300
RATE_LIMIT_MAX=20
ENVIRONMENT=production
```

### 3. Frontend Configuration

**Install Dependencies:**
```bash
cd frontend
yarn install
```

**Configure Environment:**
```bash
cp .env.example .env
nano .env
```

**Required Variables:**
```bash
REACT_APP_BACKEND_URL=https://your-domain.com
REACT_APP_ENV=production
```

### 4. MongoDB Setup

**Install MongoDB:**
```bash
# Ubuntu
sudo apt update
sudo apt install mongodb

# macOS
brew install mongodb-community
```

**Start MongoDB:**
```bash
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

**Verify Connection:**
```bash
mongo --eval "db.version()"
```

---

## Production Build

### Frontend Build

```bash
cd frontend
yarn build
```

**Output:**
- Optimized production files in `/frontend/build/`
- Minified JavaScript and CSS
- Gzipped assets

**Verify Build:**
```bash
npx serve -s build -l 3000
# Visit http://localhost:3000
```

### Backend Setup

**Test Server:**
```bash
cd backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001
```

**Verify API:**
```bash
curl http://localhost:8001/api/
```

---

## Deployment Options

### Option 1: Traditional Server (Recommended)

#### Using Supervisor

**Install Supervisor:**
```bash
sudo apt install supervisor
```

**Configure Supervisor:**
Create `/etc/supervisor/conf.d/kura.conf`:
```ini
[group:kura]
programs=kura_backend,kura_frontend

[program:kura_backend]
directory=/path/to/kura/backend
command=/path/to/kura/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/kura_backend.log
environment=PATH="/path/to/kura/backend/venv/bin"

[program:kura_frontend]
directory=/path/to/kura/frontend
command=npx serve -s build -l 3000
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/kura_frontend.log
```

**Start Services:**
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start kura:*
```

**Check Status:**
```bash
sudo supervisorctl status
```

#### Using Nginx as Reverse Proxy

**Install Nginx:**
```bash
sudo apt install nginx
```

**Configure Nginx:**
Create `/etc/nginx/sites-available/kura`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
}
```

**Enable Site:**
```bash
sudo ln -s /etc/nginx/sites-available/kura /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Option 2: Docker Deployment

**Create Dockerfile (Backend):**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

**Create Dockerfile (Frontend):**
```dockerfile
FROM node:18-alpine AS build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose:**
Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    restart: always
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: kura

  backend:
    build: ./backend
    restart: always
    ports:
      - "8001:8001"
    environment:
      MONGO_URL: mongodb://mongodb:27017
      DB_NAME: kura
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    restart: always
    ports:
      - "3000:80"
    environment:
      REACT_APP_BACKEND_URL: http://backend:8001

volumes:
  mongodb_data:
```

**Deploy:**
```bash
docker-compose up -d
```

---

### Option 3: Platform as a Service

#### Vercel (Frontend Only)

**Install Vercel CLI:**
```bash
npm install -g vercel
```

**Deploy:**
```bash
cd frontend
vercel --prod
```

**Configure:**
- Add environment variable: `REACT_APP_BACKEND_URL`
- Set build command: `yarn build`
- Set output directory: `build`

#### Heroku (Full Stack)

**Backend (Heroku):**
```bash
cd backend
heroku create kura-api
heroku addons:create mongolab
git push heroku main
```

**Frontend (Netlify):**
```bash
cd frontend
netlify deploy --prod
```

---

## SSL/HTTPS Configuration

### Using Let's Encrypt (Certbot)

**Install Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx
```

**Obtain Certificate:**
```bash
sudo certbot --nginx -d your-domain.com
```

**Auto-Renewal:**
```bash
sudo certbot renew --dry-run
```

**Updated Nginx Config:**
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # ... rest of config
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Monitoring & Maintenance

### Log Management

**View Logs:**
```bash
# Supervisor logs
sudo tail -f /var/log/supervisor/kura_backend.log
sudo tail -f /var/log/supervisor/kura_frontend.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

**Log Rotation:**
Create `/etc/logrotate.d/kura`:
```
/var/log/supervisor/kura_*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root adm
}
```

### Health Checks

**Backend Health:**
```bash
curl https://your-domain.com/api/
```

**Frontend Health:**
```bash
curl -I https://your-domain.com
```

**MongoDB Health:**
```bash
mongo --eval "db.serverStatus()"
```

### Performance Monitoring

**Install htop:**
```bash
sudo apt install htop
htop
```

**Monitor Processes:**
```bash
# CPU usage
top -p $(pgrep -d',' -f 'uvicorn|serve')

# Memory usage
free -h

# Disk usage
df -h
```

### Database Backup

**Manual Backup:**
```bash
mongodump --db kura --out /backup/$(date +%Y%m%d)
```

**Automated Backup (Cron):**
```bash
crontab -e
# Add: 0 2 * * * /usr/bin/mongodump --db kura --out /backup/$(date +\%Y\%m\%d)
```

---

## Troubleshooting

### Common Issues

#### 1. Frontend Shows 404

**Cause**: Backend API not accessible  
**Solution:**
```bash
# Check backend status
sudo supervisorctl status kura_backend

# Restart backend
sudo supervisorctl restart kura_backend

# Check logs
sudo tail -n 50 /var/log/supervisor/kura_backend.log
```

#### 2. Backend Returns 500 Error

**Cause**: MongoDB connection failure  
**Solution:**
```bash
# Check MongoDB status
sudo systemctl status mongodb

# Restart MongoDB
sudo systemctl restart mongodb

# Verify connection
mongo --eval "db.adminCommand('ping')"
```

#### 3. High Memory Usage

**Cause**: Memory leak or too many cached entries  
**Solution:**
```bash
# Restart services
sudo supervisorctl restart kura:*

# Clear cache (if needed)
mongo kura --eval "db.cache.remove({})"
```

#### 4. SSL Certificate Issues

**Cause**: Expired certificate  
**Solution:**
```bash
# Renew certificate
sudo certbot renew

# Reload Nginx
sudo systemctl reload nginx
```

#### 5. Slow API Responses

**Cause**: Cache misses or GitHub API rate limit  
**Solution:**
```bash
# Check cache hit rate in logs
grep "cached" /var/log/supervisor/kura_backend.log | tail -50

# Increase cache TTL in .env
CACHE_TTL=600  # 10 minutes

# Restart backend
sudo supervisorctl restart kura_backend
```

---

## Rollback Procedure

### If Deployment Fails

**1. Revert Code:**
```bash
git revert <commit_hash>
git push
```

**2. Rebuild:**
```bash
cd frontend && yarn build
sudo supervisorctl restart kura:*
```

**3. Restore Database (if needed):**
```bash
mongorestore --db kura /backup/latest/kura
```

---

## Security Checklist

- [ ] SSL/HTTPS enabled with valid certificate
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] MongoDB not accessible from outside
- [ ] Environment variables secured (not in git)
- [ ] Rate limiting enabled
- [ ] CORS configured for specific origins
- [ ] Regular security updates applied
- [ ] Logs monitored for suspicious activity
- [ ] Automated backups scheduled

---

## Post-Deployment Verification

**Run Tests:**
```bash
# Backend
cd backend
pytest tests/

# Frontend (manual)
# Visit https://your-domain.com
# Generate a critter for facebook/react
# Try different variants
# Test music controls
```

**Check Metrics:**
```bash
# Response time
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/api/

# Where curl-format.txt contains:
# time_total: %{time_total}s
```

**Verify Features:**
- [ ] Critter generation works
- [ ] Music plays correctly
- [ ] Variant explorer functional
- [ ] Mobile responsive
- [ ] All animations smooth (60fps)
- [ ] No console errors

---

## Support

For deployment issues:
- Check logs first: `/var/log/supervisor/`
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- See [PERFORMANCE.md](./PERFORMANCE.md) for optimization tips
- Open an issue on GitHub (if public repo)

---

**Deployment Complete!** 🎉

Your Kura instance is now live and ready to transform repositories into spirits.

# Deployment Guide

This guide covers deployment options for LinkVault.

## Table of Contents
1. [Docker Compose (Local/Development)](#docker-compose)
2. [Cloud Deployment (Heroku/Railway)](#cloud-deployment)
3. [VPS Deployment (Ubuntu)](#vps-deployment)
4. [Environment Configuration](#environment-configuration)

## Docker Compose

The easiest way to run the entire application locally with MongoDB.

### Prerequisites
- Docker Desktop installed
- Docker Compose installed

### Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd LinkVault
```

2. **Start services**
```bash
docker-compose up -d
```

3. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

4. **Stop services**
```bash
docker-compose down
```

### Useful Commands
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Rebuild images
docker-compose up -d --build

# Remove all data
docker-compose down -v
```

## Cloud Deployment

### Heroku Deployment

1. **Install Heroku CLI**
```bash
npm install -g heroku
heroku login
```

2. **Create Heroku Apps**
```bash
# Backend
heroku create linkvault-backend
heroku addons:create mongolab:sandbox --app linkvault-backend

# Frontend
heroku create linkvault-frontend
```

3. **Set Environment Variables**
```bash
heroku config:set MONGODB_URI=<your-mongo-uri> --app linkvault-backend
heroku config:set FRONTEND_URL=https://linkvault-frontend.herokuapp.com --app linkvault-backend
```

4. **Deploy Backend**
```bash
cd backend
git subtree push --prefix backend heroku main
```

5. **Deploy Frontend**
```bash
cd frontend
# Update vite.config.js API URL
npm run build
git subtree push --prefix frontend heroku main
```

### Railway.app Deployment

1. **Sign up at railway.app**

2. **Connect GitHub repository**

3. **Create Services**
   - MongoDB service (from Railway templates)
   - Backend service (from GitHub)
   - Frontend service (from GitHub)

4. **Configure Environment**
   - Set MONGODB_URI from MongoDB service
   - Set FRONTEND_URL from Frontend service URL
   - Set PORT=5000 for backend

5. **Deploy**
   - Railway auto-deploys on push to main

## VPS Deployment (Ubuntu 20.04+)

### Prerequisites
- Ubuntu VPS with root access
- Domains for frontend and backend (or subdomains)
- SSL certificate (Let's Encrypt)

### Installation Steps

1. **Update System**
```bash
sudo apt update && sudo apt upgrade -y
```

2. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

3. **Install MongoDB**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

4. **Install Nginx**
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

5. **Clone Repository**
```bash
cd /var/www
sudo git clone <repository-url>
cd LinkVault
sudo chown -R $USER:$USER .
```

6. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with production values
sudo npm install -g pm2
pm2 start server.js --name "linkvault-backend"
pm2 save
pm2 startup
```

7. **Setup Frontend**
```bash
cd ../frontend
npm install
npm run build
```

8. **Configure Nginx**

Create `/etc/nginx/sites-available/linkvault`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        root /var/www/LinkVault/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/linkvault /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

9. **Setup SSL with Let's Encrypt**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

10. **Firewall Setup**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Environment Configuration

### Backend Environment Variables

```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/linkvault

# Frontend
FRONTEND_URL=https://yourdomain.com
```

### Frontend Environment Variables

```env
VITE_API_URL=https://yourdomain.com/api
```

## Monitoring & Maintenance

### Log Monitoring
```bash
# Using PM2 (if deployed on VPS)
pm2 logs linkvault-backend
```

### Database Backup
```bash
# Backup MongoDB
mongodump --uri "mongodb://user:password@localhost/linkvault" --out ./backup

# Restore MongoDB
mongorestore --uri "mongodb://user:password@localhost/linkvault" ./backup/linkvault
```

### Auto-restart on Reboot
```bash
# Using PM2
pm2 startup
pm2 save
```

## Performance Optimization

1. **Enable Gzip Compression** - Already configured in Nginx
2. **Cache Static Files** - Already configured in Nginx
3. **Database Indexing** - TTL index on expiry already set
4. **Connection Pooling** - Mongoose handles by default
5. **CORS** - Configured in Express

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"

# Check connection string format
mongodb+srv://user:password@cluster.mongodb.net/dbname
```

### Port Already in Use
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Nginx Not Forwarding Requests
```bash
# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check logs
sudo tail -f /var/log/nginx/error.log
```

## Production Checklist

- [ ] Environment variables set correctly
- [ ] MongoDB backup strategy in place
- [ ] SSL certificate installed
- [ ] Firewall properly configured
- [ ] PM2/systemd auto-restart configured
- [ ] Database connection pooling enabled
- [ ] CORS properly configured
- [ ] Rate limiting considered
- [ ] File size limits set
- [ ] Error logging configured
- [ ] Monitoring/alerting set up
- [ ] Backup strategy documented

## Support

For deployment issues, check logs:
- Backend: `pm2 logs linkvault-backend`
- MongoDB: `sudo journalctl -u mongod`
- Nginx: `sudo tail -f /var/log/nginx/error.log`

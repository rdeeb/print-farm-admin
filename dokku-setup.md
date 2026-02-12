# Dokku Deployment Setup

This guide will help you deploy the 3D Farm Admin application to a Dokku server.

## Prerequisites

1. A Dokku server (>= 0.30.0) with the following plugins installed:
   - dokku-postgres
   - dokku-redis (optional)
   - dokku-letsencrypt (for SSL)

2. Git access to your Dokku server

## Server Setup

### 1. Install Required Plugins

```bash
# On your Dokku server
sudo dokku plugin:install https://github.com/dokku/dokku-postgres.git
sudo dokku plugin:install https://github.com/dokku/dokku-redis.git
sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
```

### 2. Create the Application

```bash
# On your Dokku server
dokku apps:create 3d-farm-admin
```

### 3. Set up Database Services

```bash
# Create PostgreSQL database
dokku postgres:create 3d-farm-db

# Link database to app
dokku postgres:link 3d-farm-db 3d-farm-admin

# Create Redis instance (optional, for caching/SSE)
dokku redis:create 3d-farm-redis
dokku redis:link 3d-farm-redis 3d-farm-admin
```

### 4. Configure Environment Variables

```bash
# Required environment variables
dokku config:set 3d-farm-admin NEXTAUTH_SECRET="$(openssl rand -base64 32)"
dokku config:set 3d-farm-admin JWT_SECRET="$(openssl rand -base64 32)"
dokku config:set 3d-farm-admin NEXTAUTH_URL="https://your-domain.com"
dokku config:set 3d-farm-admin NODE_ENV="production"

# Optional email configuration
dokku config:set 3d-farm-admin EMAIL_FROM="noreply@your-domain.com"
dokku config:set 3d-farm-admin EMAIL_HOST="smtp.your-provider.com"
dokku config:set 3d-farm-admin EMAIL_PORT="587"
dokku config:set 3d-farm-admin EMAIL_USER="your-smtp-user"
dokku config:set 3d-farm-admin EMAIL_PASSWORD="your-smtp-password"

# App configuration
dokku config:set 3d-farm-admin APP_NAME="Your 3D Farm Admin"
dokku config:set 3d-farm-admin APP_URL="https://your-domain.com"
```

### 5. Configure Domain and SSL

```bash
# Set domain
dokku domains:set 3d-farm-admin your-domain.com

# Enable SSL with Let's Encrypt
dokku letsencrypt:set 3d-farm-admin email your-email@domain.com
dokku letsencrypt:enable 3d-farm-admin

# Enable auto-renewal
dokku letsencrypt:cron-job --add
```

### 6. Configure Build Settings

```bash
# Set Node.js version (optional)
dokku config:set 3d-farm-admin NODE_VERSION="18"

# Configure build cache
dokku config:set 3d-farm-admin DOKKU_DOCKERFILE_CACHE_FROM="node:18-alpine"

# Set resource limits (adjust as needed)
dokku resource:limit 3d-farm-admin --memory 512m
dokku resource:reserve 3d-farm-admin --memory 256m
```

## Local Development Setup

### 1. Add Dokku Remote

```bash
# In your local project directory
git remote add dokku dokku@your-server:3d-farm-admin
```

### 2. Configure package.json for Production

Ensure your `package.json` has the following scripts:

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "db:migrate": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

## Deployment

### 1. Deploy the Application

```bash
# Deploy from main branch
git push dokku main

# Or deploy from a different branch
git push dokku feature-branch:main
```

### 2. Run Database Migrations

```bash
# Run migrations
dokku run 3d-farm-admin pnpm dlx prisma migrate deploy

# Seed the database with initial data
dokku run 3d-farm-admin pnpm run db:seed
```

### 3. Check Application Status

```bash
# Check app status
dokku ps:report 3d-farm-admin

# View logs
dokku logs 3d-farm-admin

# View logs in real-time
dokku logs 3d-farm-admin --tail
```

## Post-Deployment

### 1. Create Admin User

The seed script will create a demo admin user, but you should create your own:

```bash
# Connect to the database
dokku postgres:connect 3d-farm-db

# In the PostgreSQL shell, create a new tenant and user
# (You can also do this through the application interface)
```

### 2. Configure Backup

```bash
# Set up automatic database backups
dokku postgres:backup-schedule 3d-farm-db "0 2 * * *" 3d-farm-backups

# Create initial backup
dokku postgres:backup 3d-farm-db 3d-farm-backup-$(date +%Y%m%d)
```

### 3. Monitor the Application

```bash
# Check resource usage
dokku resource:report 3d-farm-admin

# Monitor logs
dokku logs 3d-farm-admin --tail

# Check application health
curl https://your-domain.com/api/health
```

## Updating the Application

### 1. Deploy Updates

```bash
# Pull latest changes and deploy
git pull origin main
git push dokku main
```

### 2. Run Database Migrations (if needed)

```bash
# Check if migrations are needed
dokku run 3d-farm-admin pnpm dlx prisma migrate status

# Deploy new migrations
dokku run 3d-farm-admin pnpm dlx prisma migrate deploy
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   dokku logs 3d-farm-admin

   # Clear build cache
   dokku repo:purge-cache 3d-farm-admin
   ```

2. **Database Connection Issues**
   ```bash
   # Check database status
   dokku postgres:info 3d-farm-db

   # Restart database
   dokku postgres:restart 3d-farm-db
   ```

3. **SSL Certificate Issues**
   ```bash
   # Renew certificate
   dokku letsencrypt:renew 3d-farm-admin

   # Check certificate status
   dokku letsencrypt:list
   ```

### Useful Commands

```bash
# Restart the application
dokku ps:restart 3d-farm-admin

# Scale the application
dokku ps:scale 3d-farm-admin web=2

# View environment variables
dokku config 3d-farm-admin

# Access the database
dokku postgres:connect 3d-farm-db

# Export database
dokku postgres:export 3d-farm-db > backup.sql

# Import database
dokku postgres:import 3d-farm-db < backup.sql
```

## Security Considerations

1. **Firewall Configuration**
   - Ensure only ports 80, 443, and 22 are open to the internet
   - Configure fail2ban for SSH protection

2. **Regular Updates**
   - Keep Dokku and plugins updated
   - Regularly update the application dependencies

3. **Backup Strategy**
   - Set up automated database backups
   - Store backups in a secure, off-site location
   - Test backup restoration procedures

4. **Monitoring**
   - Set up uptime monitoring
   - Configure log monitoring and alerting
   - Monitor resource usage

## Performance Optimization

1. **Database Optimization**
   ```bash
   # Increase shared_buffers (adjust based on available RAM)
   dokku postgres:connect 3d-farm-db
   ALTER SYSTEM SET shared_buffers = '256MB';
   SELECT pg_reload_conf();
   ```

2. **Application Optimization**
   ```bash
   # Increase memory limits if needed
   dokku resource:limit 3d-farm-admin --memory 1024m

   # Use multiple processes for high traffic
   dokku ps:scale 3d-farm-admin web=2
   ```

3. **Caching**
   - The Redis instance is automatically configured for caching
   - Consider using a CDN for static assets in production
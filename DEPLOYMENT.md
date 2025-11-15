# Deployment Guide

This guide covers deploying the Enterprise-Grade QR Check-in System to production environments.

## 🚀 Quick Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Prerequisites
- Docker and Docker Compose installed
- SSL certificates (for production)
- Domain name configured

#### Steps

1. **Clone and Setup**:
```bash
git clone <repository-url>
cd qr-checkin
cp env.example .env.local
```

2. **Configure Environment**:
```bash
# Edit .env.local with your production values
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_ALLOWED_ORIGINS=https://yourdomain.com
NODE_ENV=production
```

3. **Setup SSL Certificates**:
```bash
mkdir ssl
# Place your SSL certificates in ./ssl/
# cert.pem and key.pem
```

4. **Deploy**:
```bash
docker-compose up -d
```

5. **Verify Deployment**:
```bash
curl https://yourdomain.com/api/health
```

### Option 2: Vercel Deployment

#### Prerequisites
- Vercel account
- GitHub repository

#### Steps

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**:
   - Add all required environment variables in Vercel dashboard
   - Set `NODE_ENV=production`

3. **Deploy**:
   - Vercel will automatically deploy on push to main branch
   - Custom domain can be configured in project settings

### Option 3: Manual Server Deployment

#### Prerequisites
- Ubuntu 20.04+ server
- Node.js 18+
- Nginx
- PM2 (process manager)

#### Steps

1. **Server Setup**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

2. **Application Setup**:
```bash
# Clone repository
git clone <repository-url>
cd qr-checkin

# Install dependencies
npm ci --production

# Build application
npm run build

# Start with PM2
pm2 start npm --name "qr-checkin" -- start
pm2 save
pm2 startup
```

3. **Nginx Configuration**:
```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/qr-checkin
sudo ln -s /etc/nginx/sites-available/qr-checkin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔧 Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_ALLOWED_ORIGINS` | Allowed origins (comma-separated) | `https://yourdomain.com,https://www.yourdomain.com` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `NEXTAUTH_SECRET` | NextAuth secret | Random generated |
| `REDIS_URL` | Redis URL for rate limiting | In-memory store |
| `LOG_LEVEL` | Logging level | `info` |

### Feature Flags

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_ENABLE_QR_SCANNING` | Enable QR scanning | `true` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics | `true` |
| `NEXT_PUBLIC_ENABLE_EXPORT` | Enable data export | `true` |

## 🗄️ Database Setup

### Supabase Setup

1. **Create Supabase Project**:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create new project
   - Note down project URL and API keys

2. **Run Database Schema**:
   - Go to SQL Editor in Supabase Dashboard
   - Run `supabase-schema.sql`
   - Run `database-optimizations.sql`

3. **Configure Row Level Security**:
   - Enable RLS on all tables
   - Configure policies as needed

### Database Migrations

For production updates, run migrations in this order:

1. Backup existing data
2. Run new schema changes
3. Update application code
4. Verify data integrity

## 🔒 Security Configuration

### SSL/TLS Setup

#### Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Custom SSL Certificates

```bash
# Place certificates in nginx ssl directory
sudo mkdir -p /etc/nginx/ssl
sudo cp your-cert.pem /etc/nginx/ssl/cert.pem
sudo cp your-key.pem /etc/nginx/ssl/key.pem
sudo chmod 600 /etc/nginx/ssl/key.pem
```

### Security Headers

The nginx configuration includes:
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Content Security Policy

### Rate Limiting

Configure rate limits in nginx:
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
```

## 📊 Monitoring and Logging

### Application Monitoring

1. **Health Checks**:
   - Endpoint: `/api/health`
   - Monitor database connectivity
   - Track response times

2. **Logging**:
   - Structured JSON logs
   - Error tracking
   - Performance metrics

3. **Uptime Monitoring**:
   - Use services like UptimeRobot
   - Monitor health endpoint
   - Set up alerts

### Database Monitoring

1. **Supabase Dashboard**:
   - Monitor query performance
   - Track API usage
   - Set up alerts

2. **Custom Metrics**:
   - Track registration rates
   - Monitor check-in patterns
   - Alert on anomalies

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/qr-checkin
            git pull origin main
            npm ci --production
            npm run build
            pm2 restart qr-checkin
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check Supabase credentials
curl -H "apikey: YOUR_ANON_KEY" https://YOUR_PROJECT.supabase.co/rest/v1/
```

#### 2. Build Failures
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

#### 3. SSL Certificate Issues
```bash
# Test SSL configuration
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

#### 4. Performance Issues
```bash
# Monitor system resources
htop
df -h
free -h

# Check application logs
pm2 logs qr-checkin
```

### Debug Mode

Enable debug logging:
```bash
export LOG_LEVEL=debug
npm start
```

### Database Debugging

Check database performance:
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check table sizes
SELECT schemaname,tablename,pg_size_pretty(size) as size
FROM (
  SELECT schemaname, tablename, pg_total_relation_size(schemaname||'.'||tablename) as size
  FROM pg_tables
  WHERE schemaname = 'public'
) t
ORDER BY size DESC;
```

## 📈 Performance Optimization

### Production Optimizations

1. **Enable Compression**:
   - Gzip compression in nginx
   - Brotli compression for better ratios

2. **Caching Strategy**:
   - Redis for session storage
   - CDN for static assets
   - Database query caching

3. **Database Optimization**:
   - Proper indexing
   - Query optimization
   - Connection pooling

4. **Application Optimization**:
   - Code splitting
   - Lazy loading
   - Image optimization

### Scaling Considerations

1. **Horizontal Scaling**:
   - Load balancer configuration
   - Session storage in Redis
   - Database read replicas

2. **Vertical Scaling**:
   - Increase server resources
   - Optimize database configuration
   - Monitor resource usage

## 🔄 Backup and Recovery

### Database Backups

1. **Automated Backups**:
   - Supabase provides automatic backups
   - Configure retention policies
   - Test restore procedures

2. **Manual Backups**:
```bash
# Export data
pg_dump -h your-db-host -U postgres -d your-db > backup.sql

# Import data
psql -h your-db-host -U postgres -d your-db < backup.sql
```

### Application Backups

1. **Code Backups**:
   - Git repository (primary)
   - Regular pushes to remote
   - Tagged releases

2. **Configuration Backups**:
   - Environment variables
   - SSL certificates
   - Nginx configuration

## 📞 Support

For deployment issues:

1. Check application logs
2. Verify environment variables
3. Test database connectivity
4. Review security configuration
5. Contact support team

---

This deployment guide ensures a secure, scalable, and maintainable production environment for the QR Check-in System.



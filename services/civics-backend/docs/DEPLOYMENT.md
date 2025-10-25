# 🚀 Civics Backend - Deployment Guide

Complete guide for deploying the civics backend data ingestion system.

## 📋 Prerequisites

### System Requirements
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm 9+** - Comes with Node.js
- **Git** - For cloning the repository
- **Database** - Supabase account (recommended) or PostgreSQL

### API Keys Required
- Congress.gov API key
- OpenStates API key  
- FEC API key
- Google Civic API key
- Supabase credentials

## 🏗️ Deployment Options

### Option 1: Local Development
```bash
# Clone repository
git clone <your-repo-url> civics-backend
cd civics-backend

# Run setup
./setup.sh

# Start development
npm run dev
```

### Option 2: Production Server
```bash
# Clone repository
git clone <your-repo-url> civics-backend
cd civics-backend

# Install dependencies
npm install --production

# Configure environment
cp env.example .env.local
nano .env.local

# Run setup
./setup.sh

# Start production
npm start
```

### Option 3: Docker Deployment
```bash
# Build Docker image
docker build -t civics-backend .

# Run container
docker run -d \
  --name civics-backend \
  --env-file .env.local \
  -p 3000:3000 \
  civics-backend
```

### Option 4: Cloud Deployment

#### Heroku
```bash
# Install Heroku CLI
# Create Heroku app
heroku create your-civics-backend

# Set environment variables
heroku config:set NEXT_PUBLIC_SUPABASE_URL=your_url
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_key
# ... set all other variables

# Deploy
git push heroku main
```

#### AWS EC2
```bash
# Launch EC2 instance
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone <your-repo-url> civics-backend
cd civics-backend
./setup.sh

# Use PM2 for process management
npm install -g pm2
pm2 start npm --name "civics-backend" -- start
pm2 save
pm2 startup
```

#### Google Cloud Run
```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT-ID/civics-backend

# Deploy to Cloud Run
gcloud run deploy civics-backend \
  --image gcr.io/PROJECT-ID/civics-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars="NEXT_PUBLIC_SUPABASE_URL=your_url,SUPABASE_SERVICE_ROLE_KEY=your_key"
```

## 🔧 Configuration

### Environment Variables
See [env.example](../env.example) for complete list of environment variables.

### Database Setup
1. Create Supabase project
2. Get project URL and service role key
3. Run database setup script:
   ```bash
   node scripts/setup-database.js
   ```

### API Keys Setup
1. **Congress.gov**: [Get API key](https://api.congress.gov/sign-up/)
2. **OpenStates**: [Get API key](https://openstates.org/api/register/)
3. **FEC**: [Get API key](https://api.open.fec.gov/developers/)
4. **Google Civic**: [Get API key](https://developers.google.com/civic-information)

## 📊 Monitoring

### Health Checks
```bash
# Test database connection
node scripts/verify-database-connection.js

# Test basic functionality
node scripts/test-basic-functionality.js

# Check data quality
node scripts/data-summary.js
```

### Logging
```bash
# View logs
tail -f logs/civics-backend.log

# Enable debug logging
DEBUG=* npm start
```

### Metrics
- **Processing Speed**: Records per minute
- **API Usage**: Rate limit utilization
- **Error Rates**: Failed requests
- **Data Quality**: Completeness and accuracy scores

## 🔄 Scheduling

### Cron Jobs
```bash
# Edit crontab
crontab -e

# Add scheduled runs
# Run federal data daily at 2 AM
0 2 * * * cd /path/to/civics-backend && npm run federal

# Run state data daily at 3 AM
0 3 * * * cd /path/to/civics-backend && npm run state

# Run full pipeline weekly on Sunday at 1 AM
0 1 * * 0 cd /path/to/civics-backend && npm start
```

### Systemd Service
```bash
# Create service file
sudo nano /etc/systemd/system/civics-backend.service

# Service file content:
[Unit]
Description=Civics Backend Data Ingestion
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/civics-backend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# Enable and start service
sudo systemctl enable civics-backend
sudo systemctl start civics-backend
```

## 🔒 Security

### Environment Security
```bash
# Secure environment file
chmod 600 .env.local

# Use secrets management
# AWS Secrets Manager
# Azure Key Vault
# HashiCorp Vault
```

### Database Security
- Use service role key with minimal required permissions
- Enable RLS (Row Level Security) policies
- Regular security audits
- Encrypt sensitive data

### API Security
- Rate limiting to prevent abuse
- API key rotation
- Request validation
- Error handling without data exposure

## 📈 Scaling

### Horizontal Scaling
```bash
# Multiple instances
pm2 start npm --name "civics-backend-1" -- start
pm2 start npm --name "civics-backend-2" -- start
pm2 start npm --name "civics-backend-3" -- start
```

### Load Balancing
```nginx
# Nginx configuration
upstream civics_backend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://civics_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Database Scaling
- Use read replicas for queries
- Implement connection pooling
- Optimize queries and indexes
- Consider sharding for large datasets

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check connection
node scripts/verify-database-connection.js

# Verify environment variables
cat .env.local | grep SUPABASE
```

#### API Rate Limiting
```bash
# Check API usage
node scripts/check-api-usage.js

# Adjust rate limits in config/default.js
```

#### Memory Issues
```bash
# Monitor memory usage
node --max-old-space-size=4096 scripts/main-pipeline.js

# Use PM2 with memory limits
pm2 start npm --name "civics-backend" -- start --max-memory-restart 1G
```

#### Data Quality Issues
```bash
# Run data quality report
node scripts/data-summary.js

# Check for duplicates
node scripts/check-existing-data.js

# Clean up duplicates
node scripts/cleanup-duplicates.js
```

### Debugging
```bash
# Enable debug mode
DEBUG=* npm start

# Check specific logs
tail -f logs/civics-backend.log | grep ERROR

# Test individual components
node scripts/test-enhanced-pipeline.js
```

## 📞 Support

### Getting Help
- **Documentation**: [README.md](../README.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/civics-backend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/civics-backend/discussions)

### Emergency Procedures
```bash
# Stop all processes
pm2 stop all

# Restart system
pm2 restart all

# Check system status
pm2 status

# View logs
pm2 logs
```

## 🎉 Success!

Once deployed, you should see:
- ✅ Database connection successful
- ✅ All API keys working
- ✅ Data ingestion running
- ✅ Quality scores > 80%
- ✅ No errors in logs

Your civics backend is now ready for production use! 🗳️
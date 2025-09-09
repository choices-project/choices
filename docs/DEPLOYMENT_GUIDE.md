# Deployment Guide
**Created:** August 30, 2025
**Last Updated:** 2025-09-09  
**Status:** 🚀 **READY FOR DEPLOYMENT - Supabase Auth Complete**

## 🎯 **Overview**

The Choices platform is now in a **perfect production-ready state** with exclusive Supabase Auth implementation. This guide provides comprehensive instructions for deploying the application to production.

### ✅ **Pre-Deployment Checklist**
- [x] **Build Process** - Completes successfully without errors
- [x] **Supabase Auth** - Exclusive authentication system implemented
- [x] **Clean Database** - Fresh Supabase database with proper schema
- [x] **Environment Variables** - All Supabase credentials configured
- [x] **Version Pinning** - Exact Node.js and package versions
- [x] **Zero Build Errors** - Production-ready codebase
- [x] **Documentation** - Current and comprehensive

## 🚀 **Quick Deployment (Vercel)**

### **Recommended: Vercel Deployment**

Vercel is the recommended deployment platform for Next.js applications.

#### **Step 1: Prepare Repository**
```bash
# Ensure you're on the main branch with latest changes
git checkout main
git pull origin main

# Verify build works locally
cd web
npm run build
```

#### **Step 2: Connect to Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import the `choices-project/choices` repository
5. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### **Step 3: Configure Environment Variables**
In Vercel dashboard, add these environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Configuration
NEXTAUTH_SECRET=your_nextauth_secret
JWT_SECRET=your_jwt_secret
NODE_ENV=production
```

#### **Step 4: Deploy**
1. Click "Deploy"
2. Vercel will automatically build and deploy
3. Monitor the build logs for any issues
4. Access your live application at the provided URL

## 🔧 **Manual Deployment Options**

### **Option 1: Traditional Server Deployment**

#### **Prerequisites**
- Node.js 18+ installed
- PM2 or similar process manager
- Nginx or Apache for reverse proxy
- SSL certificate

#### **Step 1: Server Setup**
```bash
# Clone repository
git clone https://github.com/choices-project/choices.git
cd choices/web

# Install dependencies
npm install --production

# Build application
npm run build
```

#### **Step 2: Process Management**
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "choices" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

#### **Step 3: Nginx Configuration**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **Option 2: Docker Deployment**

#### **Step 1: Create Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

#### **Step 2: Build and Run**
```bash
# Build Docker image
docker build -t choices-platform .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  choices-platform
```

### **Option 3: Cloud Platform Deployment**

#### **AWS Elastic Beanstalk**
1. Create `.ebextensions/nodecommand.config`:
```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
```

2. Deploy using EB CLI:
```bash
eb init
eb create production
eb deploy
```

#### **Google Cloud Run**
```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/choices

# Deploy to Cloud Run
gcloud run deploy choices \
  --image gcr.io/PROJECT_ID/choices \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## 🔒 **Security Configuration**

### **Environment Variables**
Ensure all sensitive data is stored as environment variables:

```env
# Required for production
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_SECRET=your_nextauth_secret
JWT_SECRET=your_jwt_secret

# Optional but recommended
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_VERCEL_URL=https://your-domain.com
```

### **SSL/TLS Configuration**
- Always use HTTPS in production
- Configure proper SSL certificates
- Set up HTTP to HTTPS redirects
- Enable HSTS headers

### **Security Headers**
The application includes security headers, but verify your deployment platform supports them:

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
];
```

## 📊 **Monitoring and Health Checks**

### **Health Check Endpoints**
The application provides health check endpoints:

- `/api/health` - Application health
- `/api/database-status` - Database connectivity
- `/api/admin/system-status` - System metrics

### **Monitoring Setup**
1. **Error Tracking**: Set up Sentry or similar
2. **Performance Monitoring**: Use Vercel Analytics or similar
3. **Uptime Monitoring**: Configure uptime checks
4. **Log Management**: Set up centralized logging

### **Performance Monitoring**
```bash
# Monitor application performance
npm run build:analyze

# Check bundle size
npm run build:analyze
```

## 🔄 **Continuous Deployment**

### **GitHub Actions Workflow**
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
          
      - name: Install dependencies
        run: |
          cd web
          npm ci
          
      - name: Run tests
        run: |
          cd web
          npm run test
          npm run test:e2e
          
      - name: Build application
        run: |
          cd web
          npm run build
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Build Failures**
```bash
# Clear cache and rebuild
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

#### **Environment Variable Issues**
- Verify all required environment variables are set
- Check for typos in variable names
- Ensure variables are properly escaped

#### **Database Connection Issues**
- Verify Supabase credentials
- Check network connectivity
- Verify database is accessible

#### **Performance Issues**
- Monitor bundle size
- Check for memory leaks
- Optimize images and assets

### **Debug Commands**
```bash
# Check application status
npm run type-check
npm run lint
npm run build

# Test functionality
npm run test
npm run test:e2e

# Monitor performance
npm run build:analyze
```

## 📈 **Post-Deployment Verification**

### **Functionality Tests**
1. **Homepage** - Loads correctly
2. **Authentication** - Login/register works
3. **API Routes** - All endpoints respond
4. **Database** - Data persistence works
5. **Real-time Features** - Live updates function

### **Performance Tests**
1. **Page Load Speed** - Under 3 seconds
2. **API Response Time** - Under 500ms
3. **Bundle Size** - Optimized
4. **Core Web Vitals** - Good scores

### **Security Tests**
1. **HTTPS** - Properly configured
2. **Headers** - Security headers present
3. **Authentication** - Secure auth flow
4. **Input Validation** - All inputs validated

## 🎉 **Success Criteria**

### **Deployment Success Indicators**
- ✅ **Build completes** without errors
- ✅ **Application starts** and runs properly
- ✅ **All features work** as expected
- ✅ **Performance is acceptable**
- ✅ **Security is properly configured**
- ✅ **Monitoring is set up**

### **Ready for Production**
The application is ready for production when:
- All tests pass
- Build process is stable
- Performance meets requirements
- Security is properly configured
- Monitoring is in place

---

**The Choices platform is now ready for production deployment! 🚀**


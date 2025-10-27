# 🚀 Deployment Guide

**Complete Deployment Guide for Choices Platform**

---

## 🎯 **Overview**

This guide covers everything you need to deploy the Choices platform to production using Vercel and Supabase.

**Last Updated**: October 27, 2025  
**Status**: Production Ready  
**Platform**: Vercel + Supabase

---

## 🚀 **Quick Start**

### **Prerequisites**
- **Vercel Account**: [vercel.com](https://vercel.com)
- **Supabase Account**: [supabase.com](https://supabase.com)
- **GitHub Repository**: Connected to Vercel
- **Environment Variables**: Configured in Vercel

### **One-Click Deployment**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/choices-project/choices)

### **Manual Deployment**
```bash
# Clone repository
git clone https://github.com/choices-project/choices.git
cd choices/web

# Install dependencies
npm install

# Deploy to Vercel
npx vercel --prod
```

---

## 🔧 **Environment Setup**

### **Required Environment Variables**

#### **Supabase Configuration**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### **Application Configuration**
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=https://your-domain.vercel.app
```

#### **Optional: AI Services**
```bash
OLLAMA_API_URL=http://localhost:11434
HUGGING_FACE_API_KEY=your_hugging_face_api_key
```

### **Vercel Environment Setup**
1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Go to Settings > Environment Variables**
4. **Add all required variables**
5. **Set environment scope** (Production, Preview, Development)

---

## 🗄️ **Database Setup**

### **Supabase Project Setup**
1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Choose region closest to your users

2. **Configure Database**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Link to your project
   supabase link --project-ref your-project-ref
   
   # Run migrations
   supabase db push
   ```

3. **Set up Authentication**
   - Enable WebAuthn in Supabase dashboard
   - Configure OAuth providers (Google, GitHub)
   - Set up email templates

4. **Configure Row Level Security**
   - Enable RLS on all tables
   - Set up policies for user data access
   - Configure admin permissions

### **Database Schema**
```sql
-- Core Tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  trust_tier TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL,
  privacy_level TEXT DEFAULT 'public',
  poll_type TEXT DEFAULT 'single_choice',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active'
);

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id),
  user_id UUID REFERENCES users(id),
  option_id TEXT NOT NULL,
  anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🌐 **Domain Configuration**

### **Custom Domain Setup**
1. **Add Domain in Vercel**
   - Go to Project Settings > Domains
   - Add your custom domain
   - Configure DNS records

2. **DNS Configuration**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A
   Name: @
   Value: 76.76.19.61
   ```

3. **SSL Certificate**
   - Automatically provisioned by Vercel
   - HTTPS redirect enabled by default
   - HSTS headers configured

### **Environment-Specific URLs**
- **Production**: `https://choices-platform.vercel.app`
- **Preview**: `https://choices-platform-git-branch.vercel.app`
- **Development**: `http://localhost:3000`

---

## 🔄 **Deployment Process**

### **Automatic Deployment**
```bash
# Push to main branch triggers production deployment
git add .
git commit -m "Deploy new feature"
git push origin main
```

### **Manual Deployment**
```bash
# Deploy to preview
npx vercel

# Deploy to production
npx vercel --prod

# Deploy specific branch
npx vercel --prod --target production
```

### **Deployment Pipeline**
1. **Code Push** → GitHub webhook
2. **Vercel Build** → Next.js build process
3. **Environment Setup** → Environment variables
4. **Database Migration** → Supabase schema updates
5. **Health Check** → Verify deployment success
6. **DNS Update** → Route traffic to new deployment

---

## 📊 **Monitoring & Analytics**

### **Vercel Analytics**
- **Performance Metrics**: Core Web Vitals
- **Usage Analytics**: Page views, user sessions
- **Error Tracking**: JavaScript errors
- **Real User Monitoring**: Actual user experience

### **Supabase Monitoring**
- **Database Performance**: Query performance, connection pools
- **Authentication Metrics**: Login success rates, user growth
- **API Usage**: Request volume, response times
- **Storage Usage**: File uploads, bandwidth

### **Custom Monitoring**
```bash
# Health check endpoint
curl https://your-domain.vercel.app/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2025-10-27T12:00:00Z",
  "services": {
    "database": "healthy",
    "ai_services": "healthy",
    "auth": "healthy"
  }
}
```

---

## 🔐 **Security Configuration**

### **Vercel Security**
- **HTTPS Only**: All traffic encrypted
- **Security Headers**: CSP, HSTS, X-Frame-Options
- **DDoS Protection**: Built-in protection
- **Edge Security**: Global security policies

### **Supabase Security**
- **Row Level Security**: Database-level access control
- **API Keys**: Secure key management
- **Authentication**: WebAuthn, OAuth, email/password
- **Data Encryption**: All data encrypted at rest

### **Application Security**
```javascript
// Security headers in next.config.js
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
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
];
```

---

## 🚨 **Troubleshooting**

### **Common Deployment Issues**

#### **Build Failures**
```bash
# Check build logs
vercel logs your-deployment-url

# Common fixes
npm run type-check  # Fix TypeScript errors
npm run lint:fix    # Fix linting issues
npm run build       # Test build locally
```

#### **Environment Variable Issues**
```bash
# Verify environment variables
vercel env ls

# Add missing variables
vercel env add VARIABLE_NAME
```

#### **Database Connection Issues**
```bash
# Test database connection
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/users?select=count"

# Check Supabase status
curl https://status.supabase.com/api/v2/status.json
```

### **Performance Issues**
- **Check Vercel Analytics**: Identify slow pages
- **Optimize Images**: Use Next.js Image component
- **Database Queries**: Check query performance in Supabase
- **Bundle Size**: Analyze bundle with `npm run build`

---

## 🔄 **Rollback Strategy**

### **Automatic Rollback**
- **Vercel**: Automatic rollback on deployment failure
- **Health Checks**: Rollback if health checks fail
- **Error Thresholds**: Rollback if error rate exceeds threshold

### **Manual Rollback**
```bash
# Rollback to previous deployment
vercel rollback

# Rollback to specific deployment
vercel rollback deployment-url
```

### **Database Rollback**
```bash
# Rollback database migrations
supabase db reset

# Restore from backup
supabase db restore backup-file.sql
```

---

## 📈 **Scaling Strategy**

### **Vercel Scaling**
- **Automatic Scaling**: Handles traffic spikes
- **Edge Functions**: Global edge computing
- **CDN**: Global content delivery
- **Bandwidth**: Unlimited bandwidth

### **Supabase Scaling**
- **Database Scaling**: Automatic scaling
- **Connection Pooling**: Efficient connections
- **Caching**: Query result caching
- **Storage**: Unlimited storage

### **Performance Optimization**
- **Code Splitting**: Dynamic imports
- **Image Optimization**: Next.js Image component
- **Caching**: Multi-level caching strategy
- **CDN**: Global content delivery

---

## 🎯 **Best Practices**

### **Deployment Best Practices**
- **Test Locally**: Always test before deploying
- **Environment Parity**: Keep environments consistent
- **Incremental Deployments**: Deploy small changes
- **Monitor Deployments**: Watch for issues

### **Security Best Practices**
- **Environment Variables**: Never commit secrets
- **HTTPS Only**: Always use HTTPS
- **Regular Updates**: Keep dependencies updated
- **Security Headers**: Configure proper headers

### **Performance Best Practices**
- **Optimize Images**: Use appropriate formats
- **Minimize Bundle**: Remove unused code
- **Database Queries**: Optimize queries
- **Caching**: Implement proper caching

---

## 📞 **Support**

### **Vercel Support**
- **Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Status Page**: [vercel-status.com](https://vercel-status.com)

### **Supabase Support**
- **Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Community**: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
- **Status Page**: [status.supabase.com](https://status.supabase.com)

---

**Deployment Guide Version**: 1.0.0  
**Last Updated**: October 27, 2025  
**Status**: ✅ Production Ready

---

*This deployment guide provides everything you need to deploy the Choices platform to production.*
# 🚀 Deployment Guide

**Last Updated**: 2025-01-27 19:15 UTC  
**Status**: ✅ **Production Ready**

## 🎯 **Deployment Overview**

Choices is deployed using a modern, secure, and scalable architecture with comprehensive monitoring and automated deployment processes.

## 🏗️ **Deployment Architecture**

### **Production Environment**
- **Frontend**: Vercel (Next.js application)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **CI/CD**: GitHub Actions
- **Monitoring**: Vercel Analytics + Custom monitoring

### **Development Environment**
- **Frontend**: Local Next.js development server
- **Database**: Supabase (shared development instance)
- **Authentication**: Supabase Auth (development project)
- **Local Development**: SQLite fallback for offline development

## 📊 **Current Deployment Status**

### **✅ Successfully Deployed Components**
- **Core Application**: Next.js frontend with all features
- **Database Schema**: All tables created and optimized
- **Security Policies**: Comprehensive RLS policies active
- **IA/PO Architecture**: Fully restored and secured
- **Automated Polls**: MVP functional with admin dashboard
- **Authentication System**: Supabase Auth with tiered users
- **API Endpoints**: All REST APIs functional
- **Admin Dashboard**: Owner-only access controls

### **🔧 Available Tools & Scripts**
- `scripts/assess-project-status.js` - Quick deployment status check
- `scripts/deploy-ia-tokens-and-security.js` - Security deployment
- `scripts/check_supabase_auth.js` - Database connectivity validation
- `scripts/test-auth-flow.js` - Authentication flow testing

## 🗄️ **Database Setup**

### **Core Tables**
```sql
-- User Management
ia_users              # User profiles with RLS
ia_tokens             # Blinded tokens for IA/PO system

-- Poll Management
po_polls              # Polls with public read, authenticated create
po_votes              # Votes with privacy protection (no individual viewing)

-- Feedback System
feedback              # User feedback with RLS

-- Automated Polls
trending_topics       # Topic storage and analysis
generated_polls       # AI-generated polls
data_sources          # Source management
poll_generation_logs  # Generation tracking
quality_metrics       # Poll quality assessment
system_configuration  # System settings
```

### **Security Implementation**
- ✅ **Row Level Security (RLS)**: All tables protected
- ✅ **User Data Isolation**: Users can only access their own data
- ✅ **Admin Access Control**: Owner-only admin functions
- ✅ **Vote Privacy**: No individual vote data accessible
- ✅ **Audit Logging**: Comprehensive operation logging

### **Database Deployment Process**
1. **Schema Creation**: All tables with proper constraints
2. **Index Optimization**: Performance indexes for all queries
3. **Security Policies**: RLS policies for data protection
4. **Triggers**: Automatic timestamp updates
5. **Functions**: Helper functions for common operations

## 🔐 **Security Deployment**

### **Authentication System**
- **Supabase Auth**: Primary authentication provider
- **Magic Links**: Passwordless authentication
- **Tiered Verification**: T0-T3 user verification system
- **Session Management**: Secure session handling
- **Multi-Factor Authentication**: Enhanced security options

### **Access Control**
```sql
-- Owner-only function (admin_user_id configured via environment variable)
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(current_setting('app.admin_user_id', true), '') = auth.uid()::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Data Protection**
- **Encryption**: AES-256 for sensitive data
- **Privacy Budgets**: User-controlled data sharing
- **Differential Privacy**: Noise injection for analytics
- **Zero-Knowledge Proofs**: Privacy-preserving verification

## 🌐 **Frontend Deployment**

### **Vercel Configuration**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### **Environment Variables**
```bash
# Required for production
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Admin configuration (keep private)
ADMIN_USER_ID=your_admin_user_id
ADMIN_USER_EMAIL=your_admin_email
NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email
```

### **Performance Optimization**
- **Static Generation**: Pre-rendered pages for better performance
- **Image Optimization**: Next.js Image component with CDN
- **Code Splitting**: Automatic code splitting for faster loads
- **Caching**: Aggressive caching strategies
- **PWA**: Progressive Web App capabilities

## 🔄 **CI/CD Pipeline**

### **GitHub Actions Workflow**
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
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: amondnet/vercel-action@v20
```

### **Pre-deployment Checks**
- ✅ **Code Quality**: ESLint and Prettier checks
- ✅ **Security**: Automated security scanning
- ✅ **Tests**: Unit and integration tests
- ✅ **Build**: Successful build verification
- ✅ **Database**: Schema validation

### **Post-deployment Validation**
- ✅ **Health Checks**: Application health verification
- ✅ **Database Connectivity**: Database connection validation
- ✅ **Authentication**: Auth flow testing
- ✅ **API Endpoints**: All API endpoints functional
- ✅ **Security**: Security policy validation

## 📊 **Monitoring & Analytics**

### **Performance Monitoring**
- **Vercel Analytics**: Real-time performance metrics
- **Core Web Vitals**: Page load and interaction metrics
- **Error Tracking**: Automatic error detection and reporting
- **User Analytics**: Privacy-preserving user behavior analysis

### **Security Monitoring**
- **Access Logs**: All authentication attempts logged
- **Database Logs**: All database operations monitored
- **Error Logs**: Security-related errors tracked
- **Audit Trails**: Comprehensive audit logging

### **Health Checks**
```javascript
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV
  });
});
```

## 🔧 **Deployment Scripts**

### **Database Deployment**
```bash
# Deploy database schema
node scripts/deploy-ia-tokens-and-security.js

# Check database status
node scripts/check_supabase_auth.js

# Test authentication flow
node scripts/test-auth-flow.js
```

### **Security Deployment**
```bash
# Deploy security policies
node scripts/deploy-ia-tokens-and-security.js

# Validate security configuration
node scripts/assess-project-status.js
```

### **Production Validation**
```bash
# Check production URLs
node scripts/check_production_urls.js

# Test complete user flow
node scripts/test-complete-flow.js
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Database Connection Issues**
```bash
# Check database connectivity
node scripts/check_supabase_auth.js

# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

#### **Authentication Issues**
```bash
# Test authentication flow
node scripts/test-auth-flow.js

# Check Supabase configuration
node scripts/configure_supabase_auth.js
```

#### **Security Policy Issues**
```bash
# Deploy security policies
node scripts/deploy-ia-tokens-and-security.js

# Validate security configuration
node scripts/assess-project-status.js
```

### **Rollback Procedures**
1. **Database Rollback**: Restore from backup
2. **Frontend Rollback**: Revert to previous Vercel deployment
3. **Security Rollback**: Restore previous security policies
4. **Configuration Rollback**: Revert environment variables

## 📋 **Deployment Checklist**

### **Pre-Deployment**
- [ ] All tests passing
- [ ] Security review completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Database schema validated
- [ ] Security policies tested

### **Deployment**
- [ ] Database schema deployed
- [ ] Security policies applied
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set
- [ ] Health checks passing
- [ ] Authentication flow tested
- [ ] API endpoints validated

### **Post-Deployment**
- [ ] Performance monitoring active
- [ ] Error tracking configured
- [ ] Security monitoring enabled
- [ ] User acceptance testing completed
- [ ] Documentation updated
- [ ] Team notified of deployment

## 🎯 **Best Practices**

### **Security First**
- Always deploy security policies first
- Test access controls thoroughly
- Validate data isolation
- Monitor for security issues
- Regular security audits

### **Performance Optimization**
- Monitor Core Web Vitals
- Optimize database queries
- Implement caching strategies
- Use CDN for static assets
- Regular performance reviews

### **Monitoring & Maintenance**
- Set up comprehensive monitoring
- Regular health checks
- Automated alerting
- Performance tracking
- User feedback collection

## 📈 **Scaling Considerations**

### **Database Scaling**
- **Connection Pooling**: Optimize database connections
- **Query Optimization**: Index and query optimization
- **Read Replicas**: Consider read replicas for high traffic
- **Caching**: Redis caching for frequently accessed data

### **Application Scaling**
- **CDN**: Global content delivery
- **Load Balancing**: Multiple server instances
- **Microservices**: Consider service decomposition
- **Monitoring**: Advanced monitoring and alerting

---

**This deployment guide ensures secure, reliable, and scalable deployment of the Choices platform with comprehensive monitoring and maintenance procedures.**

# Deployment Guide

**Last Updated**: 2025-09-16

This guide covers deploying the Choices platform to production environments.

## 🚀 Production Deployment

### Prerequisites

- Vercel account (for frontend hosting)
- Supabase account (for backend and database)
- Domain name (optional, for custom domain)
- SSL certificate (handled by Vercel)

### Environment Setup

#### 1. Vercel Configuration

Create a `vercel.json` file in the project root:

```json
{
  "buildCommand": "cd web && npm run build",
  "outputDirectory": "web/.next",
  "installCommand": "cd web && npm ci",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key",
    "NEXT_PUBLIC_PRIMARY_DOMAIN": "@primary-domain",
    "NEXT_PUBLIC_ORIGIN": "@origin-url"
  }
}
```

#### 2. Environment Variables

Set these environment variables in Vercel:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# WebAuthn Configuration
NEXT_PUBLIC_PRIMARY_DOMAIN=your_domain.com
NEXT_PUBLIC_ORIGIN=https://your_domain.com

# Feature Flags
NEXT_PUBLIC_FEATURE_FLAGS={"WEBAUTHN":true,"PWA":true,"ADMIN":true}
```

### Deployment Steps

#### 1. Database Migration

```bash
# Connect to your Supabase database
psql -h your-db-host -U postgres -d postgres

# Run the WebAuthn schema migration
\i web/scripts/migrations/001-webauthn-schema.sql
```

#### 2. Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel --prod

# Or connect to GitHub for automatic deployments
vercel --github
```

#### 3. Domain Configuration

```bash
# Add custom domain in Vercel dashboard
# Or use vercel CLI
vercel domains add your-domain.com
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificate active
- [ ] Domain configured
- [ ] Feature flags enabled
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Performance monitoring active

## 🔧 Configuration

### Feature Flags

Enable features for production:

```typescript
// Production feature flags
{
  "CORE_AUTH": true,
  "CORE_POLLS": true,
  "CORE_USERS": true,
  "WEBAUTHN": true,        // Enable WebAuthn
  "PWA": true,             // Enable PWA features
  "ANALYTICS": false,      // Disable analytics initially
  "ADMIN": true,
  "EXPERIMENTAL_UI": false,
  "EXPERIMENTAL_ANALYTICS": false,
  "ADVANCED_PRIVACY": true  // Enable advanced privacy
}
```

### Security Headers

Vercel automatically sets security headers, but you can customize them:

```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

## 📊 Monitoring

### Performance Monitoring

```bash
# Install Vercel Analytics
npm install @vercel/analytics

# Add to your app
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

### Error Tracking

```bash
# Install Sentry
npm install @sentry/nextjs

# Configure Sentry
npx @sentry/wizard -i nextjs
```

### Health Checks

Create a health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    const supabase = createServerClient();
    const { data, error } = await supabase.from('user_profiles').select('id').limit(1);
    
    if (error) throw error;
    
    return Response.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    return Response.json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
}
```

## 🔐 Security

### Environment Security

- **Secrets Management** - Use Vercel's environment variables
- **Access Control** - Limit deployment access
- **Audit Logging** - Monitor deployment activities
- **Backup Strategy** - Regular database backups

### Database Security

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can access their own data" ON user_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public polls are readable" ON polls
  FOR SELECT USING (privacy_level = 'public');
```

### API Security

```typescript
// Rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

export default limiter;
```

## 🚀 CI/CD Pipeline

### GitHub Actions

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
          node-version: '19'
          cache: 'npm'
          cache-dependency-path: web/package-lock.json
      
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
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Deployment Strategy

1. **Feature Branches** - Develop features in branches
2. **Pull Requests** - Code review and testing
3. **Main Branch** - Production-ready code
4. **Automatic Deployment** - Deploy on main branch push
5. **Rollback Strategy** - Quick rollback if needed

## 📈 Performance

### Optimization

```bash
# Bundle analysis
npm run analyze

# Performance testing
npm run lighthouse

# Core Web Vitals
npm run vitals
```

### Caching Strategy

```typescript
// Next.js caching
export const revalidate = 3600; // 1 hour

// API route caching
export async function GET() {
  const data = await fetchData();
  
  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}
```

## 🔄 Rollback Strategy

### Quick Rollback

```bash
# Rollback to previous deployment
vercel rollback

# Or rollback to specific deployment
vercel rollback <deployment-url>
```

### Database Rollback

```sql
-- Rollback database changes
BEGIN;
-- Your rollback SQL here
ROLLBACK;
```

## 📋 Post-Deployment

### Verification

- [ ] Application loads correctly
- [ ] Authentication works
- [ ] Poll creation works
- [ ] Voting works
- [ ] Admin dashboard accessible
- [ ] PWA features work
- [ ] WebAuthn works (if enabled)
- [ ] Performance is acceptable
- [ ] Error tracking is active
- [ ] Monitoring is working

### Monitoring

- **Uptime** - Monitor application availability
- **Performance** - Track Core Web Vitals
- **Errors** - Monitor error rates
- **Security** - Watch for security incidents
- **Usage** - Track user engagement

---

**Last Updated:** 2025-09-16  
**Version:** 1.0.0




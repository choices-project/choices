# 🔧 Troubleshooting Guide

**Complete Troubleshooting Documentation for Choices Platform**

---

## 🎯 **Overview**

This guide helps resolve common issues with the Choices platform, providing solutions for development, deployment, and production problems.

**Last Updated**: October 27, 2025  
**Status**: Production Ready  
**Coverage**: Comprehensive Issue Resolution

---

## 🚨 **Common Issues**

### **Authentication Issues**

#### **WebAuthn Not Working**
**Symptoms:**
- WebAuthn registration fails
- Authentication prompts don't appear
- "Not supported" error messages

**Diagnosis:**
```javascript
// Check browser compatibility
console.log('WebAuthn supported:', !!navigator.credentials);
console.log('HTTPS enabled:', location.protocol === 'https:');
console.log('Platform authenticator:', await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
```

**Solutions:**
1. **Enable HTTPS**: WebAuthn requires HTTPS in production
2. **Browser Compatibility**: Use Chrome 67+, Firefox 60+, Safari 14+
3. **Device Support**: Ensure device has biometric or security key
4. **Fallback Options**: Implement email/password fallback

**Code Fix:**
```typescript
// Add fallback authentication
const authenticateUser = async (method: 'webauthn' | 'password') => {
  try {
    if (method === 'webauthn') {
      return await authenticateWithWebAuthn();
    } else {
      return await authenticateWithPassword();
    }
  } catch (error) {
    console.error('Authentication failed:', error);
    // Fallback to password authentication
    return await authenticateWithPassword();
  }
};
```

#### **Session Expiration Issues**
**Symptoms:**
- Users logged out unexpectedly
- "Session expired" errors
- Authentication loops

**Solutions:**
1. **Check Session Configuration**:
```typescript
// Verify session settings
const sessionConfig = {
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const
};
```

2. **Implement Session Refresh**:
```typescript
// Auto-refresh session
const refreshSession = async () => {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    // Redirect to login
    window.location.href = '/auth';
  }
};

// Set up periodic refresh
setInterval(refreshSession, 30 * 60 * 1000); // Every 30 minutes
```

### **Database Issues**

#### **Connection Errors**
**Symptoms:**
- "Connection refused" errors
- Database timeout errors
- RLS policy errors

**Diagnosis:**
```bash
# Check Supabase connection
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/users?select=count"
```

**Solutions:**
1. **Verify Environment Variables**:
```bash
# Check required variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
```

2. **Check RLS Policies**:
```sql
-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

3. **Connection Pooling**:
```typescript
// Configure connection pooling
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
);
```

#### **Query Performance Issues**
**Symptoms:**
- Slow page loads
- Database timeout errors
- High response times

**Solutions:**
1. **Add Database Indexes**:
```sql
-- Add indexes for common queries
CREATE INDEX idx_polls_status ON polls(status);
CREATE INDEX idx_polls_privacy ON polls(privacy_level);
CREATE INDEX idx_votes_poll_user ON votes(poll_id, user_id);
CREATE INDEX idx_users_trust_tier ON users(trust_tier);
```

2. **Optimize Queries**:
```typescript
// Use select to limit fields
const { data } = await supabase
  .from('polls')
  .select('id, title, total_votes')
  .eq('status', 'active')
  .limit(20);

// Use pagination
const { data } = await supabase
  .from('polls')
  .select('*')
  .range(offset, offset + limit - 1);
```

### **Build and Deployment Issues**

#### **Build Failures**
**Symptoms:**
- TypeScript compilation errors
- ESLint errors
- Build timeout errors

**Diagnosis:**
```bash
# Check TypeScript errors
npm run type-check

# Check ESLint errors
npm run lint

# Check build locally
npm run build
```

**Solutions:**
1. **Fix TypeScript Errors**:
```typescript
// Add proper type annotations
interface User {
  id: string;
  email: string;
  name: string;
  trust_tier: TrustTier;
}

// Use proper type assertions
const user = data as User;
```

2. **Fix ESLint Errors**:
```typescript
// Fix unused variables
const { data, error } = await supabase.from('users').select('*');
if (error) {
  console.error('Error:', error);
  return;
}
// Use data...

// Fix missing dependencies
useEffect(() => {
  fetchData();
}, [dependency]); // Add missing dependency
```

3. **Environment Variable Issues**:
```bash
# Check environment variables
vercel env ls

# Add missing variables
vercel env add VARIABLE_NAME
```

#### **Deployment Issues**
**Symptoms:**
- Vercel deployment failures
- Environment variable errors
- Runtime errors in production

**Solutions:**
1. **Check Vercel Logs**:
```bash
# View deployment logs
vercel logs [deployment-url]

# Check function logs
vercel logs [function-url]
```

2. **Verify Environment Variables**:
```bash
# List environment variables
vercel env ls

# Add missing variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

3. **Check Build Output**:
```bash
# Build locally to test
npm run build

# Check build output
ls -la .next/
```

### **Performance Issues**

#### **Slow Page Loads**
**Symptoms:**
- Pages take long to load
- Poor Core Web Vitals scores
- High bounce rates

**Diagnosis:**
```bash
# Check bundle size
npm run build
npx @next/bundle-analyzer

# Check performance
npm run lighthouse
```

**Solutions:**
1. **Optimize Images**:
```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/representative-photo.jpg"
  alt="Representative Photo"
  width={200}
  height={200}
  priority={false}
/>
```

2. **Code Splitting**:
```typescript
// Dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>
});
```

3. **Database Optimization**:
```typescript
// Use efficient queries
const { data } = await supabase
  .from('polls')
  .select('id, title, total_votes')
  .eq('status', 'active')
  .order('total_votes', { ascending: false })
  .limit(10);
```

#### **Memory Leaks**
**Symptoms:**
- Increasing memory usage
- Browser slowdown
- Crashes after extended use

**Solutions:**
1. **Clean Up Event Listeners**:
```typescript
useEffect(() => {
  const handleResize = () => {
    // Handle resize
  };
  
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

2. **Clean Up Subscriptions**:
```typescript
useEffect(() => {
  const subscription = supabase
    .channel('polls')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, 
        (payload) => {
          // Handle changes
        })
    .subscribe();
    
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### **API Issues**

#### **Rate Limiting**
**Symptoms:**
- "Rate limit exceeded" errors
- API requests failing
- Slow response times

**Solutions:**
1. **Implement Client-Side Rate Limiting**:
```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  canMakeRequest(key: string, limit: number, window: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests
    const validRequests = requests.filter(time => now - time < window);
    
    if (validRequests.length >= limit) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}
```

2. **Add Retry Logic**:
```typescript
const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      
      if (response.status === 429) {
        // Rate limited, wait and retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
```

#### **CORS Issues**
**Symptoms:**
- "CORS policy" errors
- API requests blocked
- Cross-origin issues

**Solutions:**
1. **Configure CORS Headers**:
```typescript
// API route CORS configuration
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

2. **Next.js CORS Configuration**:
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

---

## 🔍 **Debugging Tools**

### **Browser DevTools**
```javascript
// Console debugging
console.log('Debug info:', { user, poll, error });

// Network debugging
console.log('API Response:', response);

// Performance debugging
console.time('API Call');
await fetchData();
console.timeEnd('API Call');
```

### **Supabase Debugging**
```typescript
// Enable debug mode
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      debug: process.env.NODE_ENV === 'development'
    }
  }
);

// Check auth state
const { data: { session } } = await supabase.auth.getSession();
console.log('Current session:', session);
```

### **Vercel Debugging**
```bash
# Check deployment status
vercel ls

# View function logs
vercel logs [function-url]

# Check environment variables
vercel env ls
```

---

## 📊 **Monitoring and Alerts**

### **Error Monitoring**
```typescript
// Error boundary for React components
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error monitoring service
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }
    
    return this.props.children;
  }
}
```

### **Performance Monitoring**
```typescript
// Performance monitoring
const measurePerformance = (name: string, fn: () => Promise<any>) => {
  return async (...args: any[]) => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const duration = performance.now() - start;
      console.log(`${name} took ${duration}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`${name} failed after ${duration}ms:`, error);
      throw error;
    }
  };
};
```

---

## 🆘 **Getting Help**

### **Self-Service Resources**
1. **Check Documentation**: Review relevant documentation
2. **Search Issues**: Look for similar issues in GitHub
3. **Check Logs**: Review application and server logs
4. **Test Locally**: Reproduce issue locally

### **Community Support**
1. **GitHub Issues**: Report bugs and request features
2. **GitHub Discussions**: Ask questions and get help
3. **Documentation**: Comprehensive guides and references

### **Emergency Contacts**
- **Critical Issues**: Create GitHub issue with "urgent" label
- **Security Issues**: Use private security reporting
- **Production Issues**: Check Vercel status page

---

## 📋 **Issue Resolution Checklist**

### **Before Reporting an Issue**
- [ ] Check this troubleshooting guide
- [ ] Search existing GitHub issues
- [ ] Reproduce the issue locally
- [ ] Check application logs
- [ ] Verify environment variables
- [ ] Test with different browsers/devices

### **When Reporting an Issue**
- [ ] Provide clear description
- [ ] Include steps to reproduce
- [ ] Share relevant logs/errors
- [ ] Specify environment details
- [ ] Include screenshots if applicable
- [ ] Test with latest version

---

**Troubleshooting Guide Version**: 1.0.0  
**Last Updated**: October 27, 2025  
**Status**: ✅ Production Ready

---

*This troubleshooting guide provides comprehensive solutions for common Choices platform issues.*
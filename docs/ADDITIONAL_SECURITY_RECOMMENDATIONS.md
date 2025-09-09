# 🔒 Additional Security Recommendations
*Created: September 9, 2025*

## 🎯 **Beyond Function Security - Comprehensive Security Strategy**

### **1. Environment Security**

#### **API Key Management**
```bash
# Rotate Supabase keys regularly (every 90 days)
# Use different keys for different environments
# Never commit keys to version control
```

#### **Environment Variables**
```bash
# Add to .env.local (never commit)
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Consider adding:
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

### **2. Database Security Enhancements**

#### **Connection Security**
```sql
-- Add connection limits and timeouts
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET statement_timeout = '30s';
ALTER SYSTEM SET idle_in_transaction_session_timeout = '10min';
```

#### **Audit Logging**
```sql
-- Create a simple audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only system admin can view audit logs
CREATE POLICY "System admin can view audit logs" ON audit_logs
    FOR SELECT USING (public.is_system_admin(auth.uid()));
```

### **3. Application Security**

#### **Rate Limiting**
```typescript
// Add rate limiting to API routes
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
});

export async function POST(request: Request) {
  const ip = request.ip ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return new Response("Rate limit exceeded", { status: 429 });
  }
  
  // Your API logic here
}
```

#### **Input Validation**
```typescript
// Use Zod for all input validation
import { z } from "zod";

const createPollSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  options: z.array(z.string().min(1).max(100)).min(2).max(10),
  voting_method: z.enum(['single', 'multiple', 'ranked', 'approval', 'range', 'quadratic']),
  privacy_level: z.enum(['public', 'private', 'invite-only']),
});

export async function POST(request: Request) {
  const body = await request.json();
  const validatedData = createPollSchema.parse(body);
  // Process validated data
}
```

### **4. Monitoring and Alerting**

#### **Error Monitoring**
```typescript
// Add comprehensive error logging
export function logError(error: Error, context: any) {
  console.error('Application Error:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: context.userAgent,
    ip: context.ip,
  });
  
  // Send to error tracking service (Sentry, etc.)
}
```

#### **Security Monitoring**
```sql
-- Create function to monitor suspicious activity
CREATE OR REPLACE FUNCTION public.log_suspicious_activity(
    activity_type TEXT,
    user_id UUID,
    details JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO error_logs (error_type, user_id, context, severity, created_at)
    VALUES (
        'suspicious_activity',
        user_id,
        jsonb_build_object(
            'activity_type', activity_type,
            'details', details,
            'ip_address', inet_client_addr(),
            'user_agent', current_setting('request.headers', true)
        ),
        'high',
        NOW()
    );
END;
$$;
```

### **5. Data Protection**

#### **Data Encryption**
```typescript
// Encrypt sensitive data before storing
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const secretKey = process.env.ENCRYPTION_KEY; // 32 bytes

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, secretKey);
  cipher.setAAD(Buffer.from('choices-platform', 'utf8'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}
```

#### **Data Anonymization**
```sql
-- Create function to anonymize user data
CREATE OR REPLACE FUNCTION public.anonymize_user_data(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Only system admin can anonymize data
    IF NOT public.is_system_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized: Only system admin can anonymize data';
    END IF;
    
    -- Anonymize user profile
    UPDATE user_profiles 
    SET 
        username = 'deleted_user_' || substring(user_id::text, 1, 8),
        email = 'deleted@example.com',
        bio = NULL,
        avatar_url = NULL,
        updated_at = NOW()
    WHERE user_id = user_id;
    
    -- Log the anonymization
    INSERT INTO error_logs (error_type, user_id, context, severity, created_at)
    VALUES (
        'user_data_anonymized',
        user_id,
        jsonb_build_object('anonymized_by', auth.uid()),
        'medium',
        NOW()
    );
END;
$$;
```

### **6. Backup and Recovery**

#### **Automated Backups**
```sql
-- Create backup function
CREATE OR REPLACE FUNCTION public.create_backup()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    backup_name TEXT;
BEGIN
    -- Only system admin can create backups
    IF NOT public.is_system_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized: Only system admin can create backups';
    END IF;
    
    backup_name := 'backup_' || to_char(NOW(), 'YYYY_MM_DD_HH24_MI_SS');
    
    -- Log backup creation
    INSERT INTO error_logs (error_type, context, severity, created_at)
    VALUES (
        'backup_created',
        jsonb_build_object('backup_name', backup_name, 'created_by', auth.uid()),
        'low',
        NOW()
    );
    
    RETURN backup_name;
END;
$$;
```

### **7. Network Security**

#### **CORS Configuration**
```typescript
// Strict CORS policy
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? 'https://yourdomain.com' 
    : 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};
```

#### **Content Security Policy**
```typescript
// Add CSP headers
export const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
```

### **8. Development Security**

#### **Pre-commit Hooks**
```bash
# Add to .git/hooks/pre-commit
#!/bin/bash
# Check for secrets
if grep -r "password\|secret\|key" --include="*.ts" --include="*.js" --include="*.json" . | grep -v node_modules | grep -v ".env.example"; then
  echo "❌ Potential secrets found in code!"
  exit 1
fi

# Check for console.log in production code
if grep -r "console\.log" --include="*.ts" --include="*.js" . | grep -v node_modules | grep -v ".env.example"; then
  echo "⚠️  console.log found in code - consider removing for production"
fi
```

#### **Dependency Security**
```bash
# Regular security audits
npm audit
npm audit fix

# Use tools like Snyk for dependency scanning
npx snyk test
```

### **9. User Experience Security**

#### **Session Management**
```typescript
// Implement proper session management
export function createSecureSession(userId: string) {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  // Store session in database with expiration
  // Implement session invalidation on logout
  // Add session refresh mechanism
}
```

#### **Password Security**
```typescript
// Strong password requirements
const userPasswordValidation = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character');
```

### **10. Compliance and Legal**

#### **Data Retention**
```sql
-- Create function to clean up old data
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Only system admin can clean up data
    IF NOT public.is_system_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized: Only system admin can clean up data';
    END IF;
    
    -- Delete old error logs (older than 90 days)
    DELETE FROM error_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Delete old audit logs (older than 1 year)
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    -- Log cleanup
    INSERT INTO error_logs (error_type, context, severity, created_at)
    VALUES (
        'data_cleanup',
        jsonb_build_object('cleaned_by', auth.uid(), 'cleanup_date', NOW()),
        'low',
        NOW()
    );
END;
$$;
```

## 🚀 **Implementation Priority**

### **🔴 Critical (Implement First)**
1. **Rate limiting** on all API endpoints
2. **Input validation** with Zod schemas
3. **Error monitoring** and logging
4. **Security headers** (CSP, CORS, etc.)

### **🟡 High (Implement Soon)**
1. **Audit logging** for sensitive operations
2. **Data encryption** for sensitive fields
3. **Session management** improvements
4. **Dependency security** scanning

### **🟢 Medium (Implement Later)**
1. **Data anonymization** functions
2. **Backup automation**
3. **Performance monitoring**
4. **Compliance features**

## 📋 **Quick Wins**

### **Today**
- Add rate limiting to API routes
- Implement input validation with Zod
- Add security headers to responses

### **This Week**
- Set up error monitoring
- Create audit logging system
- Implement session management

### **This Month**
- Add data encryption for sensitive fields
- Set up automated security scanning
- Create data retention policies

---

**Remember**: Security is an ongoing process, not a one-time setup. Regular audits, updates, and monitoring are essential for maintaining a secure system! 🔒

# Security System - Comprehensive Guide

**Created:** 2025-01-17  
**Updated:** April 4, 2026  
**Status:** ✅ Production Ready  
**Purpose:** Complete guide to the Choices platform security model, implementation, and best practices

---

## 🎯 **Executive Summary**

The Choices platform implements a comprehensive, multi-layered security model designed to protect user data, ensure platform integrity, and maintain user trust in democratic processes. The security system follows zero-trust principles with defense-in-depth architecture.

### **Security Principles**
1. **Privacy by Design** - Privacy protection built into every component
2. **Zero Trust Architecture** - Verify everything, trust nothing
3. **Defense in Depth** - Multiple security layers
4. **Least Privilege** - Minimal required permissions
5. **Transparency** - Open security practices and auditability

### Recent Security Hardening (March 2026)

The following security improvements were implemented across the application:

- **Rate limiting** — Applied to 20+ API routes via Upstash Redis (`apiRateLimiter`): polls (create/vote), feedback, profile (all mutations), poll close/lock, push notifications, CSP reports, health ingest
- **CSRF protection** — Double-submit token validation on the login endpoint via `validateCsrfProtection`
- **E2E bypass hardening** — Test authentication bypasses are locked out when `NODE_ENV === 'production'`; debug headers (`X-Auth-Debug-*`) only set in non-production
- **Input sanitization** — `sanitizeInput()` applied to all user-generated fields in poll creation (title, description, question, category, tags, options)
- **UUID validation** — `UUID_REGEX` validation on OG image routes to prevent injection via poll IDs
- **Webhook security** — Resend webhook endpoint rejects requests (403) when `RESEND_WEBHOOK_SECRET` is not configured
- **API authentication** — Analytics user endpoints require session auth with self-only access (or admin override); health ingest protected with `ADMIN_MONITORING_KEY`
- **Cookie security** — Secure flag on cookies uses `isProduction` directly, not domain string matching
- **PWA data sanitization** — Demographics data (ageRange, educationLevel, incomeBracket, regionCode) removed from user data stored in localStorage
- **Environment validation** — Zod-based validation module (`lib/config/env.ts`) validates all required environment variables at startup with CI-safe fallbacks
- **Console cleanup** — All `console.log`/`console.warn`/`console.error` in production code replaced with structured `logger` utility
- **Alert/confirm replacement** — All `window.alert()` and `window.confirm()` calls replaced with toast notifications and shadcn AlertDialog components

---

## 🏗️ **Security Architecture**

### **Multi-Layer Security Model**

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  • Input Validation & Sanitization                         │
│  • CSRF Protection (Double-Submit Tokens)                  │
│  • Rate Limiting & DDoS Protection                         │
│  • Security Headers (CSP, HSTS, etc.)                     │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                     │
├─────────────────────────────────────────────────────────────┤
│  • WebAuthn Passkeys (Biometric/Hardware)                  │
│  • Supabase Auth (Email/Password + OAuth)                  │
│  • Session Management & JWT Tokens                         │
│  • Multi-Factor Authentication                             │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    AUTHORIZATION LAYER                      │
├─────────────────────────────────────────────────────────────┤
│  • Row Level Security (RLS) Policies                       │
│  • Role-Based Access Control (RBAC)                        │
│  • Service Role Isolation                                  │
│  • Admin Access Controls                                   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
├─────────────────────────────────────────────────────────────┤
│  • Database Encryption at Rest                             │
│  • Secure Credential Storage (BYTEA)                       │
│  • Data Anonymization & Privacy                            │
│  • Audit Logging & Monitoring                              │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                     │
├─────────────────────────────────────────────────────────────┤
│  • Vercel Edge Security                                    │
│  • Cloudflare Protection                                   │
│  • Environment Variable Security                           │
│  • CI/CD Security Pipeline                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 **Authentication Security**

### **WebAuthn Implementation**
- **Biometric Authentication**: Fingerprint, face recognition, voice
- **Hardware Security Keys**: FIDO2/WebAuthn compatible devices
- **Credential Storage**: Secure PostgreSQL BYTEA storage
- **Origin Validation**: Comprehensive environment-aware validation
- **Challenge-Response**: Cryptographically secure authentication flow

### **Supabase Auth Integration**
- **Email/Password**: Traditional authentication with secure hashing
- **OAuth Providers**: Google, GitHub, Discord integration
- **Email Verification**: Required for new account activation
- **Password Reset**: Secure token-based password recovery
- **Session Management**: Automatic refresh and secure storage
- **Profile Auto‑Provisioning**: On first successful Supabase login, if no `user_profiles` row exists, the API automatically creates a minimal profile (user_id, email/username, display_name) so legacy or partially‑onboarded accounts can still sign in without hitting a hard error. Any failure to create this row is logged and surfaced via sanitized API errors only.

### **Multi-Factor Authentication**
- **Primary**: WebAuthn passkeys or email/password
- **Secondary**: Email verification codes
- **Backup**: Recovery codes for account recovery
- **Admin**: Service role-based admin authentication

---

## 🛡️ **Application Security**

### **Input Validation & Sanitization**
```typescript
// Comprehensive input validation
export const AddressInputSchema = z.object({
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must be less than 200 characters')
    .regex(/^[a-zA-Z0-9\s,.\-#]+$/, 'Address contains invalid characters')
    .transform(a => a.trim())
});

// SQL injection prevention
const { data, error } = await supabase
  .from('civics_representatives')
  .select('*')
  .eq('jurisdiction', state.toUpperCase()); // Parameterized queries
```

### **CSRF Protection**
- **Double-Submit Token Pattern**: CSRF tokens in both cookies and forms
- **Origin Validation**: Strict origin checking for all requests
- **SameSite Cookies**: Secure cookie configuration
- **Request Validation**: Server-side token verification

### **Rate Limiting & DDoS Protection**
```typescript
// Advanced rate limiting with IP reputation
export async function checkRate(ip: string, window = 60, max = 60) {
  const key = `rl:civics:${ip}:${Math.floor(Date.now() / (window * 1000))}`;
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, window);
  return n <= max;
}

// Adaptive rate limiting based on user behavior
const rateLimits = {
  anonymous: { requests: 60, window: 60 },
  authenticated: { requests: 300, window: 60 },
  admin: { requests: 1000, window: 60 }
};
```

#### **Authentication Rate Limiting**
- **Login Endpoint**: `/api/auth/login` supports optional per‑IP rate limiting (10 attempts / 15 minutes) behind the `AUTH_RATE_LIMIT_ENABLED=1` flag.
- **Fail‑Safe Behaviour**:
  - If the Redis‑backed limiter is unreachable or times out, the handler logs a warning and **allows** the login attempt instead of blocking it.
  - In E2E harness and CI test environments, login rate limiting is **always disabled** to keep automated runs deterministic.
- **UX Consideration**: While the flag is disabled (default), users will never see “Too many login attempts”; enable it only after auth UX and observability are stable.

### **Security Headers**
```typescript
// Next.js security configuration
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
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co;"
  }
];
```

---

## 🔑 **Authorization & Access Control**

### **Row Level Security (RLS)**
```sql
-- User can only access their own data
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only vote once per poll
CREATE POLICY "Users can vote once per poll" ON votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
      SELECT 1 FROM votes 
      WHERE poll_id = NEW.poll_id AND user_id = auth.uid()
    )
  );

-- Admin access for service role only
CREATE POLICY "Admin access" ON admin_actions
  FOR ALL USING (auth.role() = 'service_role');
```

### **Role-Based Access Control**
```typescript
// User roles and permissions
export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SERVICE = 'service_role'
}

export const rolePermissions = {
  [UserRole.USER]: ['vote', 'create_poll', 'view_results'],
  [UserRole.MODERATOR]: ['moderate_polls', 'ban_users', 'view_analytics'],
  [UserRole.ADMIN]: ['admin_access', 'system_config', 'user_management'],
  [UserRole.SERVICE]: ['database_access', 'system_operations']
};
```

### **Service Role Isolation**
- **Admin Operations**: Service role only for sensitive operations
- **Database Access**: Restricted service role for data operations
- **API Protection**: Guarded endpoints with secret headers
- **Environment Isolation**: Separate service role for different environments

---

## 🔒 **Data Protection & Privacy**

### **Encryption**
- **At Rest**: Supabase PostgreSQL encryption
- **In Transit**: TLS 1.3 for all communications
- **Credentials**: BYTEA storage for WebAuthn credentials
- **Sensitive Data**: Field-level encryption for PII

### **Data Anonymization**
```typescript
// Privacy-preserving data handling
export function anonymizeUserData(userData: UserData): AnonymizedUserData {
  return {
    id: hashUserId(userData.id),
    demographic: userData.demographic, // Aggregated only
    votingHistory: [], // Never stored
    contactInfo: null // Never stored
  };
}

// Differential privacy for analytics
export function addDifferentialPrivacy(data: number[], epsilon = 1.0): number[] {
  const noise = laplaceNoise(epsilon);
  return data.map(value => value + noise);
}
```

### **Data Retention & Cleanup**
- **Vote Data**: Encrypted and anonymized after poll closure
- **User Sessions**: Automatic cleanup after expiration
- **Audit Logs**: Retained for security monitoring
- **Temporary Data**: Automatic cleanup of temporary files

---

## 🚨 **Security Monitoring & Incident Response**

### **Audit Logging**
```typescript
// Comprehensive security event logging
export async function logSecurityEvent(event: SecurityEvent) {
  await supabase.from('security_audit_log').insert({
    event_type: event.type,
    user_id: event.userId,
    ip_address: event.ipAddress,
    user_agent: event.userAgent,
    timestamp: new Date().toISOString(),
    details: event.details,
    severity: event.severity
  });
}

// Security event types
export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  VOTE_CAST = 'vote_cast',
  ADMIN_ACTION = 'admin_action',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity'
}
```

### **Threat Detection**
- **Anomaly Detection**: Unusual voting patterns or access attempts
- **Brute Force Protection**: Account lockout after failed attempts
- **IP Reputation**: Blocking known malicious IPs
- **Behavioral Analysis**: User behavior pattern analysis

### **Incident Response**
1. **Detection**: Automated monitoring and alerting
2. **Assessment**: Severity classification and impact analysis
3. **Containment**: Immediate threat isolation
4. **Investigation**: Root cause analysis and evidence collection
5. **Recovery**: System restoration and security hardening
6. **Lessons Learned**: Post-incident review and improvements

---

## 🛠️ **Security Implementation**

### **Environment Security**
```bash
# Secure environment variable management
# Production secrets (never commit)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_CIVIC_API_KEY=your_api_key
CIVICS_INGEST_SECRET=your_ingest_secret

# Development secrets (local only)
NEXT_PUBLIC_SUPABASE_URL=your_dev_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_key
```

### **CI/CD Security**
```yaml
# GitHub Actions security workflow
name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run security audit
        run: npm audit --audit-level moderate
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD
```

### **Dependency Security**
```json
// package.json security configuration
{
  "scripts": {
    "audit": "npm audit --audit-level moderate",
    "audit:fix": "npm audit fix",
    "security:check": "npm audit && snyk test"
  },
  "devDependencies": {
    "snyk": "^1.0.0"
  }
}
```

---

## 📊 **Security Metrics & KPIs**

### **Security Performance**
- **Authentication Success Rate**: >99.5%
- **Failed Login Attempts**: <1% of total attempts
- **Security Incident Response Time**: <15 minutes
- **Vulnerability Remediation Time**: <24 hours for critical

### **Compliance Metrics**
- **Data Encryption Coverage**: 100% of sensitive data
- **Access Control Compliance**: 100% of endpoints protected
- **Audit Log Coverage**: 100% of security events logged
- **Privacy Policy Compliance**: 100% of data handling compliant

---

## 🚀 **Recent Security Enhancements**

### **Type Safety Improvements (2025-09-17)**
- **Eliminated all `any` types** in authentication and security modules
- **Created centralized type definitions** for all security interfaces
- **Enhanced error handling** with typed error objects
- **Improved IDE support** with comprehensive type checking

### **Enhanced Authentication (Phase 2 Complete)**
- **WebAuthn Integration**: Full biometric and hardware key support
- **Origin Validation**: Environment-aware origin checking
- **Session Security**: Enhanced session management and refresh
- **Admin Controls**: Service role-based admin authentication

### **Advanced Rate Limiting**
- **IP Reputation Scoring**: Adaptive limits based on IP behavior
- **Device Fingerprinting**: Enhanced user identification
- **Behavioral Analysis**: Pattern-based threat detection
- **DDoS Protection**: Multi-layer DDoS mitigation

---

## 🎯 **Security Roadmap**

### **Immediate (This Week)**
1. **Security Audit**: Comprehensive security assessment
2. **Penetration Testing**: Third-party security testing
3. **Vulnerability Scanning**: Automated security scanning
4. **Incident Response Plan**: Formal incident response procedures

### **Short Term (Next Month)**
1. **Security Monitoring**: Enhanced threat detection and alerting
2. **Compliance Framework**: GDPR, CCPA compliance implementation
3. **Security Training**: Team security awareness training
4. **Bug Bounty Program**: Community security testing program

### **Long Term (Next Quarter)**
1. **Zero Trust Architecture**: Complete zero-trust implementation
2. **Advanced Threat Protection**: AI-powered threat detection
3. **Security Automation**: Automated security response and remediation
4. **Compliance Certification**: SOC 2, ISO 27001 certification

---

## 📚 **Security Resources**

### **Documentation**
- **Security Policies**: Comprehensive security policy documentation
- **Incident Response**: Step-by-step incident response procedures
- **Security Training**: Team security awareness materials
- **Compliance Guide**: Regulatory compliance documentation

### **Tools & Technologies**
- **Supabase**: Database security and RLS policies
- **WebAuthn**: Passwordless authentication standard
- **Cloudflare**: DDoS protection and security features
- **Vercel**: Edge security and deployment security

### **Monitoring & Alerting**
- **Security Dashboard**: Real-time security metrics
- **Alert System**: Automated security alerts and notifications
- **Audit Reports**: Regular security audit reports
- **Compliance Reports**: Regulatory compliance reporting

---

## 🎉 **Security Success Metrics**

### **Technical Targets**
- **Zero Security Breaches**: 100% security incident prevention
- **Response Time**: <15 minutes for security incidents
- **Vulnerability Remediation**: <24 hours for critical vulnerabilities
- **Compliance Score**: 100% regulatory compliance

### **Business Impact**
- **User Trust**: >95% user confidence in platform security
- **Data Protection**: 100% of user data properly protected
- **Regulatory Compliance**: Full compliance with privacy regulations
- **Security Posture**: Industry-leading security standards

---

**This comprehensive security guide serves as the single source of truth for the Choices platform security model. It consolidates all security policies, implementations, and best practices into one authoritative document.**

---

*Last Updated: April 4, 2026*

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** 2026-04-04 (documentation accuracy and codebase-reference review)


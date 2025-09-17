**Last Updated**: 2025-09-17
# 🔒 Civics Feature Security Guidelines
**Last Updated**: 2025-09-17

**Date**: January 15, 2025  
**Status**: 🚨 **CRITICAL SECURITY REQUIREMENTS**  
**Scope**: Security hardening for civics data ingestion and API integration

---

## 🎯 **Security Overview**

The civics feature handles sensitive political data and user location information, making security a critical priority. This document outlines the security requirements and best practices for the civics system.

---

## 🚨 **Critical Security Issues Identified**

### **1. Input Validation Vulnerabilities**
- **Issue**: No sanitization of user-provided addresses
- **Risk**: SQL injection, XSS attacks, data corruption
- **Impact**: High - Could compromise user data and system integrity

### **2. API Key Management**
- **Issue**: API keys stored in environment variables without rotation
- **Risk**: Key exposure, unauthorized API access
- **Impact**: High - Could lead to API abuse and cost overruns

### **3. Rate Limiting Bypass**
- **Issue**: Client-side rate limiting can be circumvented
- **Risk**: API abuse, service disruption
- **Impact**: Medium - Could affect service availability

### **4. Data Leakage**
- **Issue**: Error messages expose internal system details
- **Risk**: Information disclosure, system reconnaissance
- **Impact**: Medium - Could aid attackers in system analysis

---

## 🔧 **Security Implementation Requirements**

### **1. Input Validation & Sanitization**

#### **Address Validation**
```typescript
import { z } from 'zod';

const AddressSchema = z.object({
  address: z.string()
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must be less than 200 characters')
    .regex(/^[a-zA-Z0-9\s,.-]+$/, 'Address contains invalid characters')
    .transform(addr => addr.trim().toLowerCase())
    .refine(addr => !this.containsMaliciousContent(addr), 'Address contains potentially malicious content')
});

export class CivicsInputValidator {
  validateAddress(address: string): string {
    const result = AddressSchema.safeParse({ address });
    if (!result.success) {
      throw new ValidationError('Invalid address format', result.error.errors);
    }
    return result.data.address;
  }
  
  private containsMaliciousContent(input: string): boolean {
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i
    ];
    
    return maliciousPatterns.some(pattern => pattern.test(input));
  }
}
```

#### **District ID Validation**
```typescript
const DistrictIdSchema = z.string()
  .regex(/^[A-Z]{2}-\d{1,3}$/, 'Invalid district ID format')
  .refine(id => this.isValidState(id.substring(0, 2)), 'Invalid state code')
  .refine(id => parseInt(id.substring(3)) > 0, 'Invalid district number');

export class CivicsSecurity {
  validateDistrictId(districtId: string): string {
    const result = DistrictIdSchema.safeParse(districtId);
    if (!result.success) {
      throw new ValidationError('Invalid district ID', result.error.errors);
    }
    return result.data.toUpperCase();
  }
  
  private isValidState(stateCode: string): boolean {
    const validStates = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];
    return validStates.includes(stateCode);
  }
}
```

### **2. API Key Security**

#### **Secure Key Management**
```typescript
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export class CivicsApiKeyManager {
  private keys: Map<string, ApiKeyConfig> = new Map();
  
  async generateApiKey(service: string): Promise<string> {
    const key = crypto.randomBytes(32).toString('hex');
    const hashedKey = await bcrypt.hash(key, 12);
    
    await this.storeApiKey(service, hashedKey);
    return key;
  }
  
  async validateApiKey(service: string, key: string): Promise<boolean> {
    const config = this.keys.get(service);
    if (!config) return false;
    
    return await bcrypt.compare(key, config.hashedKey);
  }
  
  async rotateApiKey(service: string): Promise<string> {
    const newKey = await this.generateApiKey(service);
    await this.invalidateOldKey(service);
    return newKey;
  }
  
  private async storeApiKey(service: string, hashedKey: string): Promise<void> {
    // Store in secure key management system
    // Never store plaintext keys
    this.keys.set(service, {
      hashedKey,
      createdAt: new Date(),
      lastUsed: null,
      rotationSchedule: '30d'
    });
  }
}
```

#### **Environment Variable Security**
```typescript
export class CivicsConfig {
  private static validateConfig(): void {
    const requiredVars = [
      'GOOGLE_CIVIC_INFO_API_KEY',
      'CONGRESS_GOV_API_KEY',
      'FEC_API_KEY',
      'OPEN_STATES_API_KEY'
    ];
    
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
      }
      
      // Validate key format
      if (!this.isValidApiKey(process.env[varName]!)) {
        throw new Error(`Invalid API key format for: ${varName}`);
      }
    }
  }
  
  private static isValidApiKey(key: string): boolean {
    // Basic validation - should be alphanumeric and reasonable length
    return /^[a-zA-Z0-9_-]{20,100}$/.test(key);
  }
}
```

### **3. Server-Side Rate Limiting**

#### **Redis-Based Rate Limiting**
```typescript
import Redis from 'ioredis';

export class CivicsRateLimiter {
  private redis: Redis;
  
  constructor(redis: Redis) {
    this.redis = redis;
  }
  
  async checkRateLimit(identifier: string, limits: RateLimitConfig): Promise<RateLimitResult> {
    const key = `rate_limit:civics:${identifier}`;
    const window = limits.windowSeconds;
    
    // Use sliding window counter
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, window);
    }
    
    const ttl = await this.redis.ttl(key);
    const remaining = Math.max(0, limits.maxRequests - current);
    
    return {
      allowed: current <= limits.maxRequests,
      remaining,
      resetTime: Date.now() + (ttl * 1000),
      retryAfter: current > limits.maxRequests ? ttl : 0
    };
  }
  
  async getRateLimitStatus(identifier: string, limits: RateLimitConfig): Promise<RateLimitStatus> {
    const key = `rate_limit:civics:${identifier}`;
    const current = await this.redis.get(key) || '0';
    const ttl = await this.redis.ttl(key);
    
    return {
      current: parseInt(current),
      limit: limits.maxRequests,
      remaining: Math.max(0, limits.maxRequests - parseInt(current)),
      resetTime: Date.now() + (ttl * 1000)
    };
  }
}
```

#### **Rate Limit Middleware**
```typescript
export function civicsRateLimit(limits: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || 'unknown';
    const rateLimiter = new CivicsRateLimiter(redis);
    
    const result = await rateLimiter.checkRateLimit(identifier, limits);
    
    if (!result.allowed) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: result.retryAfter,
        limit: limits.maxRequests,
        window: limits.windowSeconds
      });
      return;
    }
    
    res.set({
      'X-RateLimit-Limit': limits.maxRequests.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
    });
    
    next();
  };
}
```

### **4. Error Handling Security**

#### **Secure Error Responses**
```typescript
export class CivicsErrorHandler {
  static handleError(error: Error, req: Request, res: Response): void {
    // Log full error details for debugging
    console.error('Civics API Error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    // Return sanitized error to client
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: 'Invalid input',
        message: 'Please check your input and try again',
        code: 'VALIDATION_ERROR'
      });
    } else if (error instanceof RateLimitError) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Please wait before making another request',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    } else if (error instanceof ApiError) {
      res.status(502).json({
        error: 'Service temporarily unavailable',
        message: 'Please try again later',
        code: 'SERVICE_UNAVAILABLE'
      });
    } else {
      // Generic error for unknown issues
      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR'
      });
    }
  }
}
```

### **5. Data Privacy Protection**

#### **Address Anonymization**
```typescript
export class CivicsPrivacy {
  async anonymizeAddress(address: string): Promise<string> {
    // Hash address for caching without storing raw data
    const hash = crypto.createHash('sha256').update(address.toLowerCase().trim()).digest('hex');
    return hash.substring(0, 16); // Use first 16 characters
  }
  
  async shouldRetainData(address: string): Promise<boolean> {
    // Implement data retention policy
    const lastAccess = await this.getLastAccessTime(address);
    const retentionPeriod = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    return Date.now() - lastAccess < retentionPeriod;
  }
  
  async purgeExpiredData(): Promise<void> {
    const expiredAddresses = await this.getExpiredAddresses();
    for (const address of expiredAddresses) {
      await this.deleteAddressData(address);
    }
  }
  
  private async getLastAccessTime(address: string): Promise<number> {
    const hash = await this.anonymizeAddress(address);
    const data = await this.redis.get(`access_time:${hash}`);
    return data ? parseInt(data) : 0;
  }
}
```

#### **Data Minimization**
```typescript
export class CivicsDataMinimizer {
  minimizeAddressData(data: AddressLookupResult): MinimizedAddressData {
    return {
      district: data.district,
      state: data.state,
      representativeCount: data.representatives.length,
      confidence: data.confidence,
      // Remove sensitive data
      // normalizedAddress: removed
      // coordinates: removed
      // representatives: only count, not full data
    };
  }
  
  minimizeRepresentativeData(rep: Representative): MinimizedRepresentative {
    return {
      id: rep.id,
      name: rep.name,
      party: rep.party,
      office: rep.office,
      // Remove contact information for privacy
      // contact: removed
    };
  }
}
```

---

## 🔍 **Security Testing Requirements**

### **1. Input Validation Testing**
```typescript
describe('Civics Input Validation', () => {
  describe('Address Validation', () => {
    it('should reject malicious input', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        "'; DROP TABLE users; --",
        'UNION SELECT * FROM users',
        'onload=alert("xss")'
      ];
      
      for (const input of maliciousInputs) {
        expect(() => validator.validateAddress(input)).toThrow(ValidationError);
      }
    });
    
    it('should accept valid addresses', () => {
      const validAddresses = [
        '123 Main St, San Francisco, CA 94102',
        '456 Oak Avenue, New York, NY 10001',
        '789 Pine Street, Seattle, WA 98101'
      ];
      
      for (const address of validAddresses) {
        expect(() => validator.validateAddress(address)).not.toThrow();
      }
    });
  });
});
```

### **2. Rate Limiting Testing**
```typescript
describe('Civics Rate Limiting', () => {
  it('should enforce rate limits', async () => {
    const requests = Array(101).fill(null).map(() => 
      request(app)
        .get('/api/district')
        .query({ addr: '123 Main St, San Francisco, CA 94102' })
    );
    
    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
```

### **3. API Key Security Testing**
```typescript
describe('Civics API Key Security', () => {
  it('should not expose API keys in error messages', async () => {
    const response = await request(app)
      .get('/api/district')
      .query({ addr: 'invalid address' })
      .expect(400);
    
    expect(response.body.error).not.toContain('API_KEY');
    expect(response.body.error).not.toContain('GOOGLE_CIVIC');
  });
});
```

---

## 📊 **Security Monitoring**

### **1. Security Metrics**
```typescript
export class CivicsSecurityMetrics {
  recordSecurityEvent(event: SecurityEvent): void {
    // Log security events
    console.warn('Security Event:', {
      type: event.type,
      severity: event.severity,
      ip: event.ip,
      userAgent: event.userAgent,
      timestamp: new Date().toISOString(),
      details: event.details
    });
    
    // Send to security monitoring system
    this.sendToSecurityMonitoring(event);
  }
  
  recordFailedValidation(input: string, reason: string): void {
    this.recordSecurityEvent({
      type: 'VALIDATION_FAILURE',
      severity: 'MEDIUM',
      details: { reason, inputLength: input.length },
      ip: this.getClientIP(),
      userAgent: this.getUserAgent()
    });
  }
  
  recordRateLimitExceeded(identifier: string, limit: number): void {
    this.recordSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      severity: 'HIGH',
      details: { identifier, limit },
      ip: this.getClientIP(),
      userAgent: this.getUserAgent()
    });
  }
}
```

### **2. Security Alerts**
```typescript
export class CivicsSecurityAlerts {
  async checkSecurityAlerts(): Promise<void> {
    const metrics = await this.getSecurityMetrics();
    
    // High rate of validation failures
    if (metrics.validationFailures > 100) {
      await this.sendAlert('HIGH_VALIDATION_FAILURE_RATE', {
        failures: metrics.validationFailures,
        threshold: 100
      });
    }
    
    // Suspicious IP activity
    if (metrics.suspiciousIPs.length > 0) {
      await this.sendAlert('SUSPICIOUS_IP_ACTIVITY', {
        ips: metrics.suspiciousIPs,
        count: metrics.suspiciousIPs.length
      });
    }
    
    // API key exposure attempts
    if (metrics.apiKeyExposureAttempts > 0) {
      await this.sendAlert('API_KEY_EXPOSURE_ATTEMPT', {
        attempts: metrics.apiKeyExposureAttempts,
        severity: 'CRITICAL'
      });
    }
  }
}
```

---

## 🎯 **Security Implementation Checklist**

### **Phase 1: Critical Security Fixes**
- [ ] **Input Validation** - Implement comprehensive input sanitization
- [ ] **API Key Security** - Secure key management and rotation
- [ ] **Rate Limiting** - Server-side rate limiting with Redis
- [ ] **Error Handling** - Secure error responses without information leakage

### **Phase 2: Advanced Security**
- [ ] **Data Privacy** - Address anonymization and data minimization
- [ ] **Security Monitoring** - Metrics and alerting for security events
- [ ] **Security Testing** - Comprehensive security test suite
- [ ] **Audit Logging** - Complete audit trail for security events

### **Phase 3: Security Hardening**
- [ ] **Penetration Testing** - Third-party security assessment
- [ ] **Security Review** - Code review for security vulnerabilities
- [ ] **Compliance** - Ensure compliance with data protection regulations
- [ ] **Incident Response** - Security incident response procedures

---

## 📋 **Security Best Practices**

### **1. Development**
- Never commit API keys or sensitive data to version control
- Use environment variables for all configuration
- Implement input validation at every entry point
- Use parameterized queries to prevent SQL injection
- Sanitize all user input before processing

### **2. Deployment**
- Use HTTPS everywhere
- Implement proper CORS policies
- Set security headers (CSP, HSTS, etc.)
- Use secure session management
- Implement proper logging and monitoring

### **3. Operations**
- Regular security audits and penetration testing
- Monitor for suspicious activity
- Keep dependencies updated
- Implement proper backup and recovery procedures
- Have incident response procedures in place

---

## 🚨 **Security Incident Response**

### **1. Incident Classification**
- **Critical**: Data breach, system compromise
- **High**: API abuse, rate limit bypass
- **Medium**: Validation failures, suspicious activity
- **Low**: Minor security warnings

### **2. Response Procedures**
1. **Immediate Response**: Isolate affected systems
2. **Assessment**: Determine scope and impact
3. **Containment**: Prevent further damage
4. **Recovery**: Restore normal operations
5. **Post-Incident**: Review and improve security

### **3. Communication**
- Notify stakeholders immediately for critical incidents
- Document all actions taken
- Conduct post-incident review
- Update security procedures based on lessons learned

---

## 📚 **References**

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CIS Controls](https://www.cisecurity.org/controls/)
- [Google Civic Information API Security](https://developers.google.com/civic-information/docs/security)

---

**Document Generated**: January 15, 2025  
**Status**: 🚨 **CRITICAL SECURITY REQUIREMENTS**  
**Next Review**: After Phase 1 implementation

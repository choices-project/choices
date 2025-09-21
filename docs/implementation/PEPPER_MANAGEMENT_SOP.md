# 🔐 Pepper Management & Rotation SOP

**Created:** 2025-01-27  
**Status:** Production Ready  
**Purpose:** Secure pepper management for privacy-first address lookup

---

## 🎯 **Overview**

Our civics system uses HMAC-SHA256 with secret peppers to ensure address privacy. This document outlines the complete pepper management strategy including generation, rotation, and environment configuration.

---

## 🔧 **Pepper Configuration**

### **Environment Variables**

```bash
# Development/Test (deterministic for testing)
PRIVACY_PEPPER_DEV=dev-pepper-consistent-for-testing-12345678901234567890

# Production (high-entropy secrets)
PRIVACY_PEPPER_CURRENT=base64:your-32-byte-base64-encoded-pepper
PRIVACY_PEPPER_PREVIOUS=base64:previous-pepper-for-rotation  # Optional during rotation
```

### **Pepper Format**
- **Prefix Required**: `base64:` or `hex:`
- **Minimum Length**: 32 bytes (256 bits)
- **Encoding**: Base64 or hexadecimal

---

## 🚀 **Pepper Generation**

### **Manual Generation (Recommended)**
```bash
# Base64 (recommended)
node -e "const c=require('crypto');console.log('base64:'+c.randomBytes(32).toString('base64'))"

# Hex
node -e "const c=require('crypto');console.log('hex:'+c.randomBytes(32).toString('hex'))"
```

---

## 🔄 **Pepper Rotation Process**

### **Step 1: Generate New Pepper**
```bash
# Generate new pepper
npm run pepper:gen
# Output: base64:abc123...

# Copy output to clipboard
```

### **Step 2: Update Environment Variables**

**Vercel Preview Environment:**
```bash
vercel env add PRIVACY_PEPPER_PREVIOUS preview
# Paste: base64:old-pepper-value

vercel env add PRIVACY_PEPPER_CURRENT preview  
# Paste: base64:new-pepper-value
```

**Vercel Production Environment:**
```bash
vercel env add PRIVACY_PEPPER_PREVIOUS production
# Paste: base64:old-pepper-value

vercel env add PRIVACY_PEPPER_CURRENT production
# Paste: base64:new-pepper-value
```

### **Step 3: Deploy and Validate**
```bash
# Deploy to preview
vercel --prod

# Validate rotation works
npm run test:unit  # Should pass pepper rotation tests
npm run test:e2e   # Should pass full flow tests
```

### **Step 4: Monitor and Cleanup**
- **Monitor for 24-72 hours** to ensure no issues
- **Check logs** for "PREVIOUS" pepper usage (should decrease over time)
- **Remove PREVIOUS** once confident:
  ```bash
  vercel env rm PRIVACY_PEPPER_PREVIOUS preview
  vercel env rm PRIVACY_PEPPER_PREVIOUS production
  ```

---

## 🛡️ **Security Requirements**

### **Environment Separation**
- ✅ **Dev/Test**: Use `PRIVACY_PEPPER_DEV` (deterministic)
- ✅ **Preview/Prod**: Use `PRIVACY_PEPPER_CURRENT` (high-entropy)
- ❌ **Never**: Mix dev and prod peppers

### **Runtime Guards**
- ✅ **Dev**: Requires `PRIVACY_PEPPER_DEV`
- ✅ **Prod**: Forbids `PRIVACY_PEPPER_DEV`
- ✅ **Prod**: Requires `PRIVACY_PEPPER_CURRENT` (≥32 bytes)
- ✅ **Rotation**: Optional `PRIVACY_PEPPER_PREVIOUS` (≥32 bytes)

### **Pepper Security**
- ✅ **High Entropy**: Minimum 32 bytes (256 bits)
- ✅ **Environment Isolation**: Separate values per environment
- ✅ **No Browser Exposure**: Never use `NEXT_PUBLIC_*`
- ✅ **Rotation Support**: Dual-verify during transitions

---

## 🔍 **Privacy Architecture**

### **HMAC Domain Separation**
```typescript
// Different scopes use different HMAC keys
hmac256(address, 'addr')    // Address normalization
hmac256(placeId, 'place')   // Place ID hashing  
hmac256(ip, 'ip')          // IP address hashing
```

### **Pepper Rotation Support**
```typescript
// During rotation, both CURRENT and PREVIOUS are valid
const { hex } = hmac256(data, 'addr');           // Issues with CURRENT
verifyHmacDigest(data, 'addr', digest);          // Verifies CURRENT or PREVIOUS
```

### **K-Anonymity Protection**
```typescript
// Geohash with deterministic jitter
geohashWithJitter(lat, lng, precision, requestId)
bucketIsKAnonymous(bucketCount, k=25)  // Minimum 25 users per bucket
```

---

## 🧪 **Testing**

### **Unit Tests**
```bash
npm run test:unit -- --grep "pepper rotation"
```

### **E2E Tests**
```bash
npm run test:e2e -- --grep "civics-fullflow"
```

### **Manual Validation**
1. **Address Input** → **HMAC Generation** → **No Raw Storage**
2. **Jurisdiction Cookie** → **Signed & HttpOnly** → **SSR Filtering**
3. **Provider Failure** → **Circuit Breaker** → **Cached Fallback**
4. **Performance** → **TTFB/LCP** → **Within Thresholds**

---

## 🚨 **Troubleshooting**

### **Common Issues**

**"PRIVACY_PEPPER_DEV required in development"**
- Solution: Set `PRIVACY_PEPPER_DEV` in your `.env.local`

**"PRIVACY_PEPPER_CURRENT must be ≥32 bytes"**
- Solution: Generate new pepper with `npm run pepper:gen`

**"PRIVACY_PEPPER_DEV must NOT be set in preview/prod"**
- Solution: Remove `PRIVACY_PEPPER_DEV` from production environment

**HMAC verification failures during rotation**
- Solution: Ensure both `CURRENT` and `PREVIOUS` are set during transition

### **Emergency Procedures**

**If rotation fails:**
1. **Immediately** set `PRIVACY_PEPPER_CURRENT` back to previous value
2. **Remove** `PRIVACY_PEPPER_PREVIOUS` 
3. **Investigate** logs for root cause
4. **Retry** rotation after fixing issues

**If pepper is compromised:**
1. **Generate** new pepper immediately
2. **Update** all environments
3. **Monitor** for suspicious activity
4. **Consider** data migration if necessary

---

## 📊 **Monitoring**

### **Key Metrics**
- **Pepper Usage**: Track CURRENT vs PREVIOUS usage
- **HMAC Performance**: Monitor HMAC generation/verification times
- **Error Rates**: Watch for HMAC verification failures
- **Privacy Compliance**: Ensure no raw addresses in logs

### **Logging**
```typescript
// Log pepper source (no PII)
console.log(`HMAC verified with ${pepperSource} pepper`);
```

---

## 🎯 **Best Practices**

### **Do's**
- ✅ **Rotate regularly** (every 6-12 months)
- ✅ **Test rotation** in preview environment first
- ✅ **Monitor usage** during rotation period
- ✅ **Use high entropy** (32+ bytes)
- ✅ **Environment separation** (dev vs prod)

### **Don'ts**
- ❌ **Never expose** peppers in browser
- ❌ **Don't skip** rotation testing
- ❌ **Don't use** weak entropy
- ❌ **Don't mix** dev and prod peppers
- ❌ **Don't rush** rotation cleanup

---

## 🔗 **Related Documentation**

- [Privacy Architecture Overview](./CIVICS_IMPLEMENTATION_ROADMAP.md)
- [E2E Testing Strategy](./FOCUSED_TEST_STRATEGY.md)
- [Database Schema](./PROJECT_FILE_TREE.md)
- [API Integration Guide](./MASTER_IMPLEMENTATION_ROADMAP.md)

---

**Last Updated:** 2025-01-27  
**Next Review:** 2025-04-27 (3 months)

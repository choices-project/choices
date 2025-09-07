# Credential Rotation Guide - Choices Platform
**Created:** January 27, 2025  
**Last Updated:** January 27, 2025  
**Status:** 🔄 **ACTIVE ROTATION IN PROGRESS**

## 🎯 Executive Summary

This guide provides step-by-step instructions for rotating all credentials in the Choices platform, including the new JWT secrets we've implemented in Phase 2B. The rotation process is designed to be zero-downtime and follows security best practices.

## 🔐 Credentials Requiring Rotation

### 1. Supabase API Keys (Legacy → New Format)
- **Current:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **New Format:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`

### 2. Custom JWT Secrets (New Implementation)
- **Access Token Secret:** `JWT_SECRET_CURRENT`
- **Legacy Secret (for rotation):** `JWT_SECRET_OLD`
- **JWT Configuration:** `JWT_ISSUER`, `JWT_AUDIENCE`

### 3. Session Management
- **Refresh Token Cookie:** `REFRESH_TOKEN_COOKIE`

### 4. Maintenance Control
- **Maintenance Mode:** `NEXT_PUBLIC_MAINTENANCE`

## 📋 Pre-Rotation Checklist

- [ ] Backup current environment variables
- [ ] Ensure all team members are notified
- [ ] Verify deployment pipeline is ready
- [ ] Test rollback procedures
- [ ] Schedule maintenance window (if needed)

## 🔄 Step-by-Step Rotation Process

### Phase 1: Supabase API Key Rotation

#### 1.1 Access Supabase Dashboard
1. Navigate to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your Choices project
3. Go to **Settings** → **API**

#### 1.2 Generate New API Keys
1. In the **API Keys** section, click **Generate new secret**
2. **⚠️ WARNING:** This will immediately invalidate all current API secrets
3. Confirm by clicking **Generate New Secret** again
4. Copy the new keys:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable Key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (replaces anon key)
   - **Secret Key** → `SUPABASE_SECRET_KEY` (replaces service_role key)

#### 1.3 Update Local Environment
Update your `web/.env.local` file:

```bash
# Supabase Configuration (New Format)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_new_publishable_key
SUPABASE_SECRET_KEY=your_new_secret_key

# Legacy keys (remove after successful deployment)
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_old_anon_key (REMOVE)
# SUPABASE_SERVICE_ROLE_KEY=your_old_service_role_key (REMOVE)
```

### Phase 2: Custom JWT Secret Rotation

#### 2.1 Generate New JWT Secrets
Generate strong, random secrets (64+ characters):

```bash
# Generate new JWT secrets
node -e "console.log('JWT_SECRET_CURRENT=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_SECRET_OLD=' + require('crypto').randomBytes(64).toString('hex'))"
```

#### 2.2 Update JWT Configuration
Add to your `web/.env.local`:

```bash
# Custom JWT Configuration
JWT_SECRET_CURRENT=your_new_64_char_hex_secret
JWT_SECRET_OLD=your_previous_64_char_hex_secret
JWT_ISSUER=your_jwt_issuer
JWT_AUDIENCE=your_jwt_audience
REFRESH_TOKEN_COOKIE=your_refresh_token_cookie_name
```

#### 2.3 JWT Rotation Strategy
Our implementation supports seamless rotation:
1. **Current Secret:** Used for signing new tokens
2. **Old Secret:** Used for verifying existing tokens during transition
3. **Automatic Fallback:** System tries current secret first, then old secret

### Phase 3: Vercel Deployment Configuration

#### 3.1 Update Vercel Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your Choices project
3. Navigate to **Settings** → **Environment Variables**
4. Update the following variables:

```bash
# Supabase (New Format)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_new_publishable_key
SUPABASE_SECRET_KEY=your_new_secret_key

# Custom JWT
JWT_SECRET_CURRENT=your_new_64_char_hex_secret
JWT_SECRET_OLD=your_previous_64_char_hex_secret
JWT_ISSUER=your_jwt_issuer
JWT_AUDIENCE=your_jwt_audience
REFRESH_TOKEN_COOKIE=your_refresh_token_cookie_name

# Maintenance Control
NEXT_PUBLIC_MAINTENANCE=your_maintenance_setting
```

#### 3.2 Deploy to Vercel
```bash
# Deploy with new environment variables
vercel --prod

# Or trigger via Git push
git push origin main
```

### Phase 4: Verification & Testing

#### 4.1 Health Check
```bash
# Test health endpoint
curl https://your-domain.vercel.app/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-01-27T...",
  "environment": "production",
  "maintenance": false
}
```

#### 4.2 Authentication Flow Testing
1. **Registration:** Test new user registration
2. **Login:** Test existing user login
3. **Token Refresh:** Test automatic token refresh
4. **Logout:** Test session termination
5. **CSRF Protection:** Verify CSRF tokens are working

#### 4.3 Database Connectivity
```bash
# Test database connection
curl -H "Authorization: Bearer your_test_token" \
     https://your-domain.vercel.app/api/auth/me
```

## 🚨 Emergency Procedures

### Rollback Plan
If issues occur during rotation:

1. **Immediate Rollback:**
   ```bash
   # Revert to previous Supabase keys
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_old_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_old_service_role_key
   ```

2. **Maintenance Mode:**
   ```bash
   # Enable maintenance mode
   NEXT_PUBLIC_MAINTENANCE=1
   ```

3. **Redeploy:**
   ```bash
   vercel --prod
   ```

### Emergency Contacts
- **Supabase Support:** [support@supabase.com](mailto:support@supabase.com)
- **Vercel Support:** [Vercel Support Portal](https://vercel.com/support)

## 📊 Post-Rotation Monitoring

### Key Metrics to Monitor
- [ ] Authentication success rate
- [ ] Token refresh success rate
- [ ] Database connection health
- [ ] API response times
- [ ] Error rates in logs

### Monitoring Commands
```bash
# Check application logs
vercel logs --follow

# Monitor health endpoint
watch -n 30 'curl -s https://your-domain.vercel.app/api/health | jq'

# Check authentication endpoints
curl -s https://your-domain.vercel.app/api/auth/csrf | jq
```

## 🔒 Security Best Practices

### Environment Variable Security
- ✅ Never commit `.env.local` to version control
- ✅ Use strong, random secrets (64+ characters)
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Use different secrets for different environments
- ✅ Monitor for unauthorized access

### JWT Security
- ✅ Short access token lifetime (4 hours)
- ✅ Longer refresh token lifetime (7 days)
- ✅ Secure cookie storage (HTTP-only, Secure, SameSite)
- ✅ CSRF protection on all state-changing operations
- ✅ Proper secret rotation with fallback support

### Deployment Security
- ✅ Use HTTPS in production
- ✅ Enable security headers via middleware
- ✅ Monitor for suspicious activity
- ✅ Keep dependencies updated
- ✅ Regular security audits

## 📚 Reference Links

- [Supabase API Key Rotation Guide](https://supabase.com/docs/guides/troubleshooting/rotating-anon-service-and-jwt-secrets)
- [Supabase GitHub Discussion #29260](https://github.com/orgs/supabase/discussions/29260)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

## 🎯 Next Steps After Rotation

1. **Update Documentation:** Update any internal documentation with new key formats
2. **Team Notification:** Inform team members of successful rotation
3. **Schedule Next Rotation:** Set calendar reminder for next rotation (90 days)
4. **Security Review:** Conduct post-rotation security review
5. **Performance Analysis:** Analyze any performance impact from rotation

## ⚠️ Important Notes

- **Zero Downtime:** Our JWT implementation supports seamless rotation
- **Backward Compatibility:** Old tokens will continue to work during transition
- **Automatic Cleanup:** Old tokens will naturally expire and be cleaned up
- **Monitoring Required:** Watch for any authentication issues post-rotation
- **Team Coordination:** Ensure all team members update their local environments

---

**Last Updated:** January 27, 2025  
**Next Scheduled Rotation:** April 27, 2025  
**Rotation Status:** 🔄 In Progress

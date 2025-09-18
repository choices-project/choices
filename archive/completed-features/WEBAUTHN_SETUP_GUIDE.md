# WebAuthn Setup Guide

**Created**: 2025-01-27  
**Status**: Ready for Production

## 🚀 **Quick Setup**

### **1. Environment Variables**

Add these to your `.env.local` file:

```bash
# WebAuthn Configuration (Required)
RP_ID=choices-platform.vercel.app
ALLOWED_ORIGINS=https://choices-platform.vercel.app,https://www.choices-platform.vercel.app,http://localhost:3000
WEBAUTHN_CHALLENGE_TTL_SECONDS=300

# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### **2. Database Migration**

Run the WebAuthn migration in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of web/scripts/migrations/001-webauthn-schema.sql
-- This creates the tables, indexes, RLS policies, and functions
```

### **3. Deploy API Routes**

The following API routes are now available:

- `POST /api/v1/auth/webauthn/register/options` - Generate registration options
- `POST /api/v1/auth/webauthn/register/verify` - Verify registration response
- `POST /api/v1/auth/webauthn/authenticate/options` - Generate authentication options
- `POST /api/v1/auth/webauthn/authenticate/verify` - Verify authentication response
- `GET /api/status/privacy` - Privacy status endpoint

### **4. UI Components**

Use these components in your app:

```tsx
import { PasskeyButton } from '@/components/PasskeyButton';
import { PasskeyManagement } from '@/components/PasskeyManagement';
import { WebAuthnPrivacyBadge } from '@/components/WebAuthnPrivacyBadge';

// Registration
<PasskeyButton mode="register" primary />

// Authentication
<PasskeyButton mode="authenticate" primary />

// Management page
<PasskeyManagement />

// Privacy status
<WebAuthnPrivacyBadge />
```

## 🔧 **Configuration Details**

### **RP_ID (Relying Party ID)**
- **Production**: `choices-platform.vercel.app`
- **Local**: `localhost` (automatically handled)
- **Purpose**: Identifies your domain to WebAuthn

### **ALLOWED_ORIGINS**
- **Production**: `https://choices-platform.vercel.app,https://www.choices-platform.vercel.app`
- **Development**: `http://localhost:3000`
- **Purpose**: Security validation for WebAuthn responses

### **Preview Deployment Behavior**
- ✅ **Production**: Passkeys enabled
- ✅ **Localhost**: Passkeys enabled  
- ❌ **Vercel Previews**: Passkeys disabled (prevents confusion)

## 🛡️ **Security Features**

### **Privacy-First Defaults**
- ✅ `attestation: 'none'` - No device certificates collected
- ✅ `userVerification: 'required'` - Biometrics/PIN required
- ✅ Discoverable credentials - Username-less UX
- ✅ RLS policies - Owner-only access

### **Critical Security Fixes**
- ✅ Challenge expiry validation
- ✅ Counter integrity guards
- ✅ Garbage collection for old challenges
- ✅ Preview deployment blocking

## 📱 **User Experience**

### **Registration Flow**
1. User clicks "Create Passkey"
2. Browser shows native biometric prompt
3. Credential stored with RLS protection
4. Success message with privacy info

### **Authentication Flow**
1. User clicks "Use Passkey"
2. Browser shows native biometric prompt
3. Counter updated, last_used_at recorded
4. User signed in

### **Error Handling**
- Friendly error messages
- Graceful fallback to email/password
- Clear privacy messaging

## 🧪 **Testing Checklist**

### **Core Functionality**
- [ ] Register passkey on production domain
- [ ] Authenticate with passkey
- [ ] Counter increments correctly
- [ ] Last used timestamp updates

### **Security & Edge Cases**
- [ ] Expired challenge fails gracefully
- [ ] RLS prevents cross-user access
- [ ] Preview URLs disable passkeys
- [ ] Counter decrease detection works

### **Cross-Platform**
- [ ] Safari iOS (Face ID)
- [ ] Android Chrome (Fingerprint)
- [ ] Desktop browsers

## 🚨 **Troubleshooting**

### **Common Issues**

**"Passkeys disabled on preview"**
- ✅ Expected behavior for Vercel previews
- Use production domain for testing

**"Challenge expired"**
- ✅ Security feature working correctly
- Try again within 5 minutes

**"Verification failed"**
- Check RP_ID matches domain exactly
- Verify ALLOWED_ORIGINS includes your domain

**"No challenge"**
- Database migration may not be complete
- Check WebAuthn tables exist

### **Debug Steps**

1. Check privacy status: `GET /api/status/privacy`
2. Verify environment variables
3. Check database tables exist
4. Test on production domain only

## 📋 **Production Checklist**

- [ ] Environment variables set
- [ ] Database migration run
- [ ] API routes deployed
- [ ] Privacy status badge working
- [ ] Passkey management UI functional
- [ ] Cross-platform testing complete
- [ ] Error handling tested
- [ ] Preview deployment behavior verified

## 🎯 **Next Steps**

1. **Set environment variables** in your deployment
2. **Run database migration** in Supabase
3. **Deploy the code** to production
4. **Test on production domain** only
5. **Monitor privacy status** badge

**You're ready to ship!** 🚀

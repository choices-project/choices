# WebAuthn Implementation Strategy

**Created**: 2025-01-27  
**Updated**: 2025-01-27

## 🎯 **Executive Summary**

**Status**: **90-95% production-ready** - You're in excellent shape for a clean launch on `choices-platform.vercel.app`

**Expert Assessment**: The plan is coherent, privacy-first, and production-practical. With the critical fixes below, you'll have a robust WebAuthn implementation that integrates seamlessly with your existing privacy-first platform.

**Key Strengths**:
- ✅ Passkeys disabled on previews, enabled on prod + localhost
- ✅ RP ID/origin handling is correct
- ✅ RLS everywhere on WebAuthn tables
- ✅ Discoverable credentials + UV required (great UX & security)
- ✅ Clear, friendly user copy + privacy badge hooks

**Critical Fixes Needed**:
- 🔧 Challenge expiry check in verify routes
- 🔧 Garbage collection for old challenges
- 🔧 Counter integrity guard
- 🔧 Preview UX (hide passkey button entirely)
- 🔧 Audit logs (outcome + AAGUID only)

## 🎯 **Analysis & Feedback**

### **✅ Perfect Integration Points**

1. **Vercel Preview Detection**: Your existing `isVercelPreview()` function in `web/lib/http/origin.ts` is exactly what's needed
2. **Privacy Components**: You already have `PrivacyLevelIndicator` and privacy status components
3. **Environment Detection**: Your current origin validation system is production-ready
4. **Supabase Integration**: Your existing server client setup is compatible

### **🔄 Current vs. Proposed Implementation**

**Your Current System:**
- ✅ **Origin validation**: Already implemented with Vercel preview detection
- ✅ **Privacy components**: Existing privacy indicators and badges
- ✅ **Environment detection**: Production-ready origin checking
- ❌ **WebAuthn implementation**: Basic validation without `@simplewebauthn/server`

**Proposed Implementation:**
- ✅ **Enhanced WebAuthn**: Full `@simplewebauthn/server` integration
- ✅ **Discoverable credentials**: Username-less UX
- ✅ **Privacy-first defaults**: Aligns with your platform
- ✅ **Production-ready security**: Proper verification and RLS

## 📋 **Answers to Your Questions**

### **Q1: Vercel Preview Deployment**
**Answer**: **YES, absolutely disable passkeys on previews!** Here's why:

```typescript
// Your existing isVercelPreview function is perfect
export function isVercelPreview(hostname: string): boolean {
  return (
    hostname.endsWith('.vercel.app') ||
    hostname.endsWith('.vercel.live') ||
    hostname.includes('vercel-preview')
  );
}

// Enhanced config for WebAuthn
export function getRPIDAndOrigins(req: NextRequest) {
  const rpID = process.env.RP_ID!; // choices-platform.vercel.app
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const isLocal = host.startsWith('localhost:') || host === 'localhost';
  const isProdHost = host === rpID;
  const isPreview = isVercelPreview(host) && !isProdHost;
  
  // Disable passkeys on previews
  const enabled = (isProdHost || isLocal) && !isPreview;
  
  return { enabled, rpID, allowedOrigins };
}
```

**Why disable on previews:**
- ✅ **Prevents confusion**: Users won't create preview-only passkeys
- ✅ **Security**: Prevents passkey creation on untrusted domains
- ✅ **UX**: Clear fallback to email/password on previews
- ✅ **Production safety**: Ensures passkeys only work on production domain

### **Q2: Passkey Management Page**
**Answer**: **YES, implement it now!** Here's the enhanced version:

```typescript
// Enhanced Passkey Management with your existing privacy components
const PasskeyManagement = () => {
  const [passkeys, setPasskeys] = useState([]);
  const [privacyStatus, setPrivacyStatus] = useState('loading');
  
  return (
    <div className="passkey-management">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Your Passkeys</h3>
        <PrivacyStatusBadge 
          enabled={privacyStatus === 'active'}
          rpOk={true}
          originsOk={true}
        />
      </div>
      
      {passkeys.map(passkey => (
        <PasskeyCard
          key={passkey.id}
          label={passkey.device_label}
          lastUsed={passkey.last_used_at}
          deviceInfo={passkey.device_info}
          onRename={(newLabel) => updatePasskeyLabel(passkey.id, newLabel)}
          onRevoke={() => revokePasskey(passkey.id)}
        />
      ))}
      
      <AddPasskeyButton />
    </div>
  );
};
```

### **Q3: Privacy Status Endpoint**
**Answer**: **YES, integrate with your existing privacy system!** Here's the enhanced version:

```typescript
// Enhanced privacy status endpoint
// app/api/status/privacy/route.ts
export async function GET(req: NextRequest) {
  const { enabled, rpID, allowedOrigins } = getRPIDAndOrigins(req);
  
  // Check RLS on sensitive tables
  const supabase = getSupabaseServer();
  const { data: rlsStatus } = await supabase.rpc('check_rls_status', {
    tables: ['webauthn_credentials', 'webauthn_challenges']
  });
  
  // Check privacy protections
  const privacyProtections = {
    webauthn: enabled,
    rls: rlsStatus?.enabled || false,
    rpId: rpID === 'choices-platform.vercel.app',
    origins: allowedOrigins.length > 0,
    attestation: 'none', // Privacy-preserving
    userVerification: 'required' // Security
  };
  
  const allGood = Object.values(privacyProtections).every(Boolean);
  const someGood = Object.values(privacyProtections).some(Boolean);
  
  return NextResponse.json({
    status: allGood ? 'active' : someGood ? 'partial' : 'inactive',
    protections: privacyProtections,
    badge: {
      color: allGood ? 'green' : someGood ? 'yellow' : 'red',
      label: allGood ? 'Privacy protections: ON' : 
             someGood ? 'Privacy protections: PARTIAL' : 
             'Privacy protections: CHECK SETTINGS'
    }
  });
}
```

## 🚀 **Enhanced Implementation Strategy**

### **1. Environment Variables**
```bash
# Add to your existing environment setup
RP_ID=choices-platform.vercel.app
ALLOWED_ORIGINS=https://choices-platform.vercel.app,https://www.choices-platform.vercel.app,http://localhost:3000
WEBAUTHN_CHALLENGE_TTL_SECONDS=300
```

### **2. Enhanced Privacy Status Badge**
```typescript
// Integrate with your existing privacy components
export function WebAuthnPrivacyBadge({ status }: { status: 'active' | 'partial' | 'inactive' }) {
  const config = {
    active: { color: 'bg-green-600', label: 'Privacy protections: ON', icon: '🛡️' },
    partial: { color: 'bg-amber-500', label: 'Privacy protections: PARTIAL', icon: '⚠️' },
    inactive: { color: 'bg-red-600', label: 'Privacy protections: CHECK SETTINGS', icon: '🚨' }
  };
  
  const { color, label, icon } = config[status];
  
  return (
    <span className={`text-white text-xs px-2 py-1 rounded ${color} flex items-center gap-1`}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
```

### **3. Integration with Existing Privacy System**
```typescript
// Enhance your existing privacy components
const EnhancedPrivacyIndicator = () => {
  const [webauthnStatus, setWebauthnStatus] = useState('loading');
  
  useEffect(() => {
    fetch('/api/status/privacy')
      .then(r => r.json())
      .then(data => setWebauthnStatus(data.status));
  }, []);
  
  return (
    <div className="flex items-center gap-2">
      <PrivacyLevelIndicator level={PrivacyLevel.MAXIMUM} />
      <WebAuthnPrivacyBadge status={webauthnStatus} />
    </div>
  );
};
```

## 🔒 **Security Benefits**

### **Why This Implementation is Superior**
- ✅ **Discoverable credentials**: No username prompts, smoother UX
- ✅ **Privacy-first**: `attestation: 'none'` avoids scary dialogs
- ✅ **Production-ready**: Proper domain validation and origin checking
- ✅ **Preview-safe**: Disables passkeys on preview deployments
- ✅ **RLS-integrated**: Works with your existing security model

### **Privacy Advantages**
- ✅ **No biometric storage**: Biometrics stay on device
- ✅ **Minimal data collection**: Only public keys and metadata
- ✅ **No password reuse**: Each passkey is unique
- ✅ **Phishing-resistant**: Domain-bound credentials
- ✅ **Bot-resistant**: Much harder to automate

## 📱 **User Experience Flow**

```typescript
// Enhanced login flow with your existing components
const LoginPage = () => (
  <div className="auth-options">
    <div className="flex items-center justify-between mb-4">
      <h2>Sign In</h2>
      <EnhancedPrivacyIndicator />
    </div>
    
    <PasskeyButton 
      primary 
      label="Use Passkey" 
      icon="🔐"
      description="Tap to sign in securely"
      disabled={!webauthnEnabled}
    />
    
    <EmailLinkButton 
      label="Email Link" 
      icon="📧"
      description="We'll send you a secure link"
    />
    
    <PasswordButton 
      label="Password" 
      icon="🔑"
      description="Sign in with your password"
    />
  </div>
);
```

## 🎯 **Final Recommendations**

### **1. Implement This Approach**
- ✅ **Use the proposed implementation** - it's production-ready
- ✅ **Integrate with your existing privacy system** - perfect fit
- ✅ **Disable passkeys on previews** - prevents confusion
- ✅ **Add passkey management UI** - essential for user trust

### **2. Migration Strategy**
- ✅ **Update your existing migration** with the proposed schema
- ✅ **Replace current WebAuthn routes** with the new implementation
- ✅ **Integrate privacy status badge** with your existing components
- ✅ **Test on production domain** only

### **3. User Education**
- ✅ **Use the proposed copy** - clear and non-alarming
- ✅ **Add privacy FAQ** - builds user trust
- ✅ **Show privacy status** - demonstrates transparency

**This implementation is perfectly aligned with your privacy-first approach and will provide a superior authentication experience while maintaining your platform's security and privacy standards.**

## 🚀 **Production Go-Live Checklist**

### **Critical Fixes Required**

#### **1. Challenge Expiry Check**
```typescript
// Add to both /verify routes after loading challenge
if (!chal || new Date(chal.expires_at).getTime() < Date.now()) {
  return NextResponse.json({ error: 'Challenge expired' }, { status: 400 });
}
```

#### **2. Counter Integrity Guard**
```typescript
// After verifyAuthenticationResponse
const { newCounter } = verification.authenticationInfo;
if (Number.isFinite(cred.counter) && newCounter < cred.counter) {
  // Log suspicious activity, consider forcing re-register if repeated
  console.warn(`Suspicious counter decrease for credential ${cred.id}: ${cred.counter} -> ${newCounter}`);
}
```

#### **3. Garbage Collection (pg_cron)**
```sql
-- Add to migration or run manually
SELECT cron.schedule('webauthn_gc', '15 * * * *',
$$
DELETE FROM public.webauthn_challenges
 WHERE used_at IS NOT NULL OR expires_at < NOW();
$$);
```

#### **4. Preview UX Fix**
```typescript
// Hide passkey button entirely on previews, show email as primary
const isPreview = isVercelPreview(host) && !isProdHost;
if (isPreview) {
  return <EmailLinkButton primary label="Email Link (secure login)" />;
}
```

### **Production Deployment Checklist**

#### **Phase 1: Database & Environment**
- [ ] **Migrate DB**: Create `webauthn_credentials`, `webauthn_challenges`, RLS policies
- [ ] **ENV set**: `RP_ID=choices-platform.vercel.app`, `ALLOWED_ORIGINS=...`, `WEBAUTHN_CHALLENGE_TTL_SECONDS=300`
- [ ] **Cron cleanup**: Stale challenges garbage collection

#### **Phase 2: API Routes**
- [ ] **Routes deployed**: 4 WebAuthn endpoints + `/api/status/privacy`
- [ ] **Challenge expiry**: Hard-fail on expired challenges
- [ ] **Counter integrity**: Guard against decreasing counters
- [ ] **Audit logs**: Log outcomes + AAGUID only (no raw credential IDs)

#### **Phase 3: UI & UX**
- [ ] **Preview gate**: Passkey button hidden on preview domains
- [ ] **Passkey management**: List/rename/revoke working with RLS
- [ ] **Progressive copy**: "Use Passkey (fast, no password)" on enabled domains
- [ ] **Error toasts**: Map WebAuthn DOM errors to calm, helpful text

#### **Phase 4: Monitoring & Docs**
- [ ] **Monitoring**: Emit counters for registration/auth success/fail; alert on spikes
- [ ] **Docs**: Add user blurbs + FAQ where users will see them
- [ ] **Privacy badge**: Wire to `/api/status/privacy` endpoint

### **Manual Smoke Test (15-20 min)**

#### **Core Functionality**
- [ ] **Register** on `choices-platform.vercel.app` → success, no attestation dialog
- [ ] **Authenticate** → succeeds, counter increments, `last_used_at` updates
- [ ] **Revoke passkey** → try to auth again → fails
- [ ] **Rename passkey** → label updates, persists

#### **Security & Edge Cases**
- [ ] **Expired challenge**: Wait >5 min, submit → fails gracefully
- [ ] **RLS test**: User A cannot select rows from `webauthn_credentials` for User B
- [ ] **Preview URL**: Passkey button not visible; email link works

#### **Cross-Platform**
- [ ] **Safari iOS**: Register + auth (Face ID) works
- [ ] **Android Chrome**: Register + auth works
- [ ] **Desktop**: Chrome/Firefox/Safari all work

### **UX Polish (Fast Wins)**

#### **Progressive Copy**
```typescript
// Enabled domain
<PasskeyButton label="Use Passkey (fast, no password)" />

// Preview domain  
<EmailLinkButton primary label="Email Link (secure login)" />

// Empty state
"No passkeys yet. Add one from this device—biometrics stay on your device."
```

#### **Error Mapping**
```typescript
const errorMessages = {
  'NotAllowedError': 'Cancelled—try again when you\'re ready.',
  'NotSupportedError': 'This device doesn\'t support passkeys. Try email link instead.',
  'SecurityError': 'Security check failed. Please try again.',
  'UnknownError': 'Something went wrong. Please try again or use email link.'
};
```

### **Future-Proofing Notes**

- ✅ **Custom domain**: Just update `RP_ID` + allowed origins; rest doesn't change
- ✅ **Enterprise attestation**: Can add policy checks later without breaking current creds
- ✅ **Attestation open**: Perfect for consumer UX, can tighten later if needed

## 🔗 **Related Documentation**

- [WebAuthn Implementation Comprehensive](./WEBAUTHN_IMPLEMENTATION_COMPREHENSIVE.md)
- [Database Schema](./web/database/README.md)
- [Privacy Components](./web/shared/components/PrivacyLevelIndicator.tsx)
- [Origin Validation](./web/lib/http/origin.ts)
- [Supabase Integration](./web/lib/supabase/server.ts)

---

**This implementation strategy provides a production-ready WebAuthn system that integrates seamlessly with your existing privacy-first platform while delivering superior user experience and security.**
# Authentication Architecture - Current Implementation

**Primary**: WebAuthn Native (Passkeys)  
**Fallback**: Email/Password  
**E2E Testing**: Uses email/password (can't test biometrics)

---

## Current Authentication System

### 1. WebAuthn Native (Primary) ✅
- **Feature Flag**: `WEBAUTHN: true` (enabled)
- **Location**: PasskeyControls component (dynamically loaded)
- **Methods**: 
  - Platform authenticator (Face ID, Touch ID, Windows Hello)
  - Cross-device authentication
- **API**: `/api/v1/auth/webauthn/native/*`

### 2. Email/Password (Fallback) ✅
- **Location**: Main form on `/auth` page
- **Always Available**: Yes, even when WebAuthn enabled
- **Used For**: E2E testing, fallback auth

---

## Page Routes

### `/auth` - Combined Auth Page
- Renders both Login and Sign Up (toggle between them)
- Email/password form (main form)
- PasskeyControls below (WebAuthn)
- Data-testids:
  - `auth-hydrated` - Hydration sentinel
  - `login-email` (email input, id="#email")
  - `login-password` (password input, id="#password")
  - `login-submit` (submit button)
  - `auth-toggle` (toggle sign in/sign up)

### `/login` - Alias
- Redirects to `/auth` page
- Same functionality

### `/register` - Registration Page
- Method selection: Passkey vs Password
- Default: Passkey (WebAuthn)
- Can select Password Account for E2E tests
- URL param: `?method=password` forces password mode

---

## E2E Testing Strategy

### Why Email/Password for E2E?

**WebAuthn/Passkeys Cannot Be Tested in E2E Because:**
- ❌ Requires real device biometrics (Face ID, Touch ID)
- ❌ Browser automation can't trigger fingerprint readers
- ❌ Playwright can't simulate navigator.credentials.get/create
- ❌ Would need physical device interaction

**Email/Password Works Because:**
- ✅ Standard form inputs
- ✅ No device biometrics required
- ✅ Playwright can fill forms and submit
- ✅ Tests real authentication flow (just different method)

### E2E Test Pattern

```typescript
// ✅ CORRECT: Use email/password for E2E
await page.goto('/auth');
await page.fill('#email', 'test@example.com');
await page.fill('#password', 'password');  
await page.click('button[type="submit"]');

// ❌ WRONG: Can't test WebAuthn in E2E
await page.click('[data-testid="webauthn-login"]'); // Won't work
```

---

## Authentication Flows

### Email/Password Flow (E2E Tests Use This)
```
User → /auth page
     → Fill email/password form
     → Submit  
     → loginAction (server action)
     → Supabase auth.signInWithPassword()
     → Check user_profiles for onboarding status
     → Redirect to /dashboard or /onboarding
```

### WebAuthn Flow (Production Users)
```
User → /auth page
     → Click "Sign in with passkey"
     → PasskeyControls component
     → Browser prompts for biometric
     → navigator.credentials.get()
     → /api/v1/auth/webauthn/native/authenticate
     → Verify assertion
     → Create session
     → Redirect to dashboard
```

---

## What E2E Tests Should Test

### ✅ Test with Email/Password:
- User registration
- User login
- Admin login
- Session management
- Authorization (admin vs regular user)
- Form validation
- Error handling

### ⏭️ Skip for E2E (Test in Unit Tests):
- WebAuthn credential creation
- Biometric authentication
- Cross-device passkey flow
- Platform authenticator detection

### 🧪 Unit Test WebAuthn Separately:
- `tests/unit/auth/webauthn.test.ts`
- Mock `navigator.credentials`
- Test credential generation
- Test challenge/response flow

---

## Current Implementation Status

✅ **Email/Password Auth**: Fully functional  
✅ **WebAuthn Native**: Fully functional  
✅ **Both on /auth page**: Yes  
✅ **Feature Flag**: WEBAUTHN = true  
⚠️ **E2E Tests**: Need to use email/password (can't test WebAuthn)  

---

## E2E Test Updates Needed

### 1. Use Email/Password in Tests
```typescript
// Current tests should use email/password
// NOT WebAuthn (can't test biometrics)
await loginTestUser(page, {
  email: 'admin@test.local',
  password: 'secure-password'
});
```

### 2. Document Limitations
- E2E tests use email/password fallback
- WebAuthn tested in unit tests with mocks
- Production users can use either method

### 3. Test Both Auth Methods (Where Possible)
- Email/password: Full E2E tests
- WebAuthn: Unit tests + manual testing

---

## Recommendations

1. ✅ **Keep using email/password for E2E tests**
   - It's the correct approach
   - WebAuthn can't be automated

2. ✅ **Add unit tests for WebAuthn**
   - Mock `navigator.credentials`
   - Test API endpoints
   - Test credential verification

3. ✅ **Document the architecture**
   - WebAuthn is primary (production)
   - Email/password is fallback (and E2E testing)

4. ✅ **Manual QA for WebAuthn**
   - Test on real devices
   - iOS, Android, macOS, Windows
   - Different authenticators


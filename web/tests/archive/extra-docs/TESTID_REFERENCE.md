# Test ID Reference - Complete

**Last Updated**: November 6, 2025  
**Total Test IDs**: 291

---

## Authentication & Auth Pages

### Auth Page (`/auth`)
```typescript
'auth-hydrated'           // Hydration sentinel (wait for React)
'auth-toggle'             // Toggle between sign in/sign up
'login-form'              // Form element
'login-email'             // Email input (id="email")
'login-password'          // Password input (id="password")
'login-submit'            // Submit button
'auth-display-name'       // Display name (sign up only)
'auth-confirm-password'   // Confirm password (sign up only)
'password-toggle'         // Show/hide password button
'auth-error'              // Error message container
'auth-success'            // Success message container
'csrf-token'              // CSRF token hidden input
```

### Registration Page (`/register`)
```typescript
'register-form'           // Registration form
'register-hydrated'       // Hydration sentinel
'register-submit'         // Submit button
'username'                // Username input
'displayName'             // Display name input
'email'                   // Email input
'password'                // Password input
'confirmPassword'         // Confirm password
```

### Validation Messages
```typescript
'email-validation'        // Email validation status
'email-error'             // Email error message
'password-strength'       // Password strength indicator
'password-security'       // Password security message
'password-error'          // Password error message
'password-match'          // Password match indicator
'display-name-validation' // Display name validation
'display-name-error'      // Display name error
'error-summary'           // Error summary
'error-count'             // Error count
'rate-limit-message'      // Rate limit warning
```

---

## WebAuthn / Passkey

### Passkey Controls
```typescript
'webauthn-integration'    // WebAuthn section
'webauthn-login'          // WebAuthn login button
'webauthn-register'       // WebAuthn register button
'webauthn-biometric-button'    // Face ID/Touch ID button
'webauthn-cross-device-button' // Cross-device button
'webauthn-prompt'         // Auth prompt
'webauthn-biometric-prompt'    // Biometric prompt
'webauthn-auth-prompt'    // General auth prompt
'webauthn-qr'             // QR code for cross-device
'webauthn-offline'        // Offline message
'webauthn-network-error'  // Network error message
'webauthn-server-error'   // Server error message
```

### Credential Management
```typescript
'view-credentials-button' // View credentials
'add-device-button'       // Add new device
```

---

## Admin Pages

### Admin Access
```typescript
'admin-access-denied'     // Access denied message
```

### Admin Navigation
```typescript
'admin-dashboard-tab'     // Dashboard tab
'admin-analytics-tab'     // Analytics tab
'admin-feedback-tab'      // Feedback tab
'admin-monitoring-tab'    // Monitoring tab
'admin-system-tab'        // System settings tab
'admin-site-messages-tab' // Site messages tab
'admin-user-list'         // User list section
'admin-poll-list'         // Poll list section
'admin-polls-tab'         // Polls tab
'admin-users-tab'         // Users tab
```

### Admin Actions
```typescript
// Dynamic test IDs
`admin-ban-user-${userId}`      // Ban user button
`admin-promote-user-${userId}`  // Promote to admin button
```

---

## Navigation

### Global Navigation
```typescript
'dashboard-nav'           // Dashboard nav link
'polls-nav'               // Polls nav link
'home-nav'                // Home nav link
`nav-${item.id}`          // Dynamic nav items
```

---

## Polls & Voting

### Poll Management
```typescript
'poll-card'               // Poll card
'poll-title'              // Poll title
'create-poll-button'      // Create poll button
'add-option-btn'          // Add poll option
`option-input-${index}`   // Poll option input
'voting-method'           // Voting method selector
'active-polls'            // Active polls section
'trending-polls-section'  // Trending polls
```

### Voting
```typescript
'voting-form'             // Voting form
'voting-section-title'    // Voting section title
`option-${index}-radio`   // Radio button for option
`option-${index}-checkbox`// Checkbox for option (approval voting)
'vote-button'             // Submit vote button
'vote-confirmation'       // Vote confirmation message
'vote-receipt'            // Vote receipt
'total-votes'             // Total votes count
'votes-on-user-polls'     // User's poll votes
```

---

## Dashboard & Feed

### Dashboard
```typescript
'unified-feed'            // Unified feed section
'dashboard-overview'      // Dashboard overview
```

### Profile
```typescript
'profile-display-name'    // Display name
'profile-username'        // Username
'profile-email'           // Email
'profile-bio'             // Bio text
```

---

## Civics Features

### Representative Lookup
```typescript
'address-input'           // Address input field
'address-submit'          // Submit address button
`official-card-${id}`     // Representative card
`official-email-${id}`    // Rep email
`official-phone-${id}`    // Rep phone
```

### Location
```typescript
'location-section'        // Location section
'district-info'           // District information
```

---

## Onboarding

### Navigation
```typescript
'welcome-step'            // Welcome step
'welcome-next'            // Welcome next button
'onb-back'                // Back button (generic)
'onb-next'                // Next button (generic)
// Dynamic based on step - see BACK_TESTID/NEXT_TESTID
```

### Privacy
```typescript
'privacy-step'            // Privacy settings step
'privacy-next'            // Privacy next button
'onboarding-privacy-toggle'    // Privacy toggle
'essential-only-toggle'   // Essential only option
'full-analytics-toggle'   // Full analytics option
```

### Interests
```typescript
'interests-step'          // Interests step
'interests-next'          // Interests next button
```

### Tour
```typescript
'tour-next'               // Tour next button
```

---

## Feedback Widget

### Widget Button
```typescript
'feedback-widget-button'  // Floating feedback button (NEW - Added Nov 6, 2025)
```

### Feedback Form
```typescript
'feedback-type-selection' // Type selection
'feedback-details'        // Details textarea
'feedback-submit'         // Submit button
```

---

## PWA Features

### Installation
```typescript
'install-pwa-button'      // Install PWA button
'pwa-banner'              // PWA install banner
```

### Notifications
```typescript
'subscribe-notifications' // Subscribe to notifications
'notification-permission' // Permission status
```

### Offline
```typescript
'offline-indicator'       // Offline indicator
'sync-offline-data-button'// Sync offline data
```

---

## System & Settings

### System Information
```typescript
'system-date-info'        // System date info
'system-notifications-toggle' // System notifications toggle
```

---

## Usage in Tests

### Basic Usage
```typescript
import { expect } from '@playwright/test';

// Wait for element
await expect(page.locator('[data-testid="login-email"]')).toBeVisible();

// Click element
await page.click('[data-testid="login-submit"]');

// Fill input
await page.fill('[data-testid="login-email"]', 'test@example.com');
```

### With T Helper (from registry)
```typescript
import { T } from '@/tests/registry/testIds';

// Use typed test IDs
await page.click(`[data-testid="${T.webauthn.login}"]`);
await expect(page.locator(`[data-testid="${T.admin.accessDenied}"]`)).toBeVisible();
```

---

## Dynamic Test IDs

### Pattern: `${prefix}-${id}`
```typescript
// Officials
`official-card-${id}`
`official-email-${id}`
`official-phone-${id}`

// Poll options
`option-input-${index}`
`option-${index}-radio`
`option-${index}-checkbox`

// Admin actions
`admin-ban-user-${userId}`
`admin-promote-user-${userId}`

// Navigation
`nav-${item.id}`
```

---

## Best Practices

### ✅ DO
- Use descriptive, kebab-case names
- Add test IDs to all interactive elements
- Add test IDs to key content areas
- Use consistent naming patterns
- Document new test IDs here

### ❌ DON'T
- Use test IDs for styling (use classes)
- Create duplicate test IDs on same page
- Use spaces or special chars
- Change test IDs without updating tests

---

## Adding New Test IDs

### 1. Add to Component
```tsx
<button
  data-testid="my-new-button"
  onClick={handleClick}
>
  Click Me
</button>
```

### 2. Add to Registry (Optional)
```typescript
// tests/registry/testIds.ts
export const T = {
  myFeature: {
    button: 'my-new-button'
  }
}
```

### 3. Update This Reference
Add to appropriate section above.

### 4. Use in Tests
```typescript
await page.click('[data-testid="my-new-button"]');
```

---

## Complete Test ID List

**See**: `/tmp/all_testids.txt` for complete machine-generated list of all 291 test IDs currently in use.

**Common Test IDs**:
- Authentication: 30+ test IDs
- WebAuthn: 15+ test IDs
- Admin: 20+ test IDs
- Polls/Voting: 30+ test IDs
- Navigation: 15+ test IDs
- Onboarding: 20+ test IDs
- Civics: 10+ test IDs
- PWA: 10+ test IDs
- System: 10+ test IDs

---

## Recent Updates

**November 6, 2025**:
- ✅ Added `feedback-widget-button` - Floating feedback button
- ✅ Verified all auth page test IDs current
- ✅ Verified all admin page test IDs current
- ✅ Audited all 291 test IDs in codebase

---

## Verification

To regenerate the complete list:
```bash
cd web
grep -r "data-testid=" app/ components/ features/ --include="*.tsx" --include="*.ts" -h | \
  sed 's/.*data-testid="//' | sed 's/".*//' | sort -u
```

**Last Verified**: November 6, 2025  
**Total Count**: 291 test IDs  
**Status**: ✅ Current and Complete

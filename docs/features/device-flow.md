# Device Flow Auth - Quick Start Guide

## Overview

Device Flow Authentication allows limited-input devices (smart TVs, IoT devices, CLI tools) to authenticate users via OAuth 2.0 Device Authorization Grant (RFC 8628).

## Quick Integration

### 1. Enable the Feature

Set the feature flag in `web/lib/core/feature-flags.ts`:

```typescript
export const FEATURE_FLAGS = {
  // ... other flags
  DEVICE_FLOW_AUTH: true, // Enable device flow
};
```

### 2. Use the Component

```tsx
import { DeviceFlowAuth } from '@/components/auth/DeviceFlowAuth';

function MyDeviceApp() {
  return (
    <DeviceFlowAuth
      provider="google"
      redirectTo="/dashboard"
      onComplete={(userId) => {
        console.log('User authenticated:', userId);
        // Session is automatically managed by Supabase Auth cookies
      }}
      onError={(error) => {
        console.error('Auth failed:', error);
      }}
    />
  );
}
```

### 3. Manual API Usage

If you need to implement the flow manually:

```typescript
// Step 1: Request device code
const initResponse = await fetch('/api/auth/device-flow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ provider: 'google' }),
});

const { deviceCode, userCode, verificationUri, expiresIn, interval } = 
  await initResponse.json();

// Step 2: Display user code to user
console.log(`Go to ${verificationUri} and enter: ${userCode}`);

// Step 3: Poll for completion
const pollInterval = setInterval(async () => {
  const pollResponse = await fetch('/api/auth/device-flow/poll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceCode }),
  });

  const { status, userId } = await pollResponse.json();

  if (status === 'completed') {
    clearInterval(pollInterval);
    console.log('Authenticated! User ID:', userId);
    // Session cookies are set automatically
  } else if (status === 'expired') {
    clearInterval(pollInterval);
    console.error('Code expired - request a new one');
  }
}, interval * 1000); // Poll every `interval` seconds
```

## User Flow

1. **Device** requests a device code via `POST /api/auth/device-flow`
2. **Device** displays the user code (e.g., "ABCD-EFGH") to the user
3. **User** navigates to the verification page (`/auth/device-flow/verify`)
4. **User** enters the user code
5. **User** authenticates via OAuth provider (if not already signed in)
6. **Device** polls `POST /api/auth/device-flow/poll` until completion
7. **Device** receives completion status and user ID

## Supported Providers

- `google`
- `github`
- `facebook`
- `twitter`
- `linkedin`
- `discord`

## Rate Limits

- **Device Code Requests:** 3 per hour per IP
- **Polling Requests:** 60 per 5 minutes per IP
- **Verification Requests:** 10 per 15 minutes per IP

## Code Format

- **User Code:** 8 characters, formatted as `XXXX-XXXX` (e.g., "ABCD-EFGH")
- **Device Code:** 40-byte cryptographically secure random value
- **Expiration:** 30 minutes (1800 seconds)
- **Polling Interval:** 5 seconds (recommended by RFC 8628)

## Error Handling

Common error codes:
- `expired_token` - Code has expired (request a new one)
- `authorization_pending` - Still waiting for user authorization
- `invalid_code` - Invalid user code or device code
- `already_used` - Code has already been used
- `authentication_required` - User must sign in first

## Testing

### Manual Test Flow

1. Start your device application
2. Request a device code
3. Copy the user code
4. Open `/auth/device-flow/verify` in a browser
5. Enter the user code
6. Sign in with OAuth provider
7. Verify device receives completion status

### Example cURL Commands

```bash
# Request device code
curl -X POST http://localhost:3000/api/auth/device-flow \
  -H "Content-Type: application/json" \
  -d '{"provider": "google"}'

# Poll for completion (replace DEVICE_CODE)
curl -X POST http://localhost:3000/api/auth/device-flow/poll \
  -H "Content-Type: application/json" \
  -d '{"deviceCode": "DEVICE_CODE"}'

# Verify user code (replace USER_CODE and PROVIDER)
curl -X POST http://localhost:3000/api/auth/device-flow/verify \
  -H "Content-Type: application/json" \
  -d '{"userCode": "ABCD-EFGH", "provider": "google"}'
```

## Security Notes

- User codes are case-insensitive and accept input with or without dashes
- Device codes are stored securely and never exposed to users
- All endpoints are rate-limited to prevent abuse
- Expired codes are automatically cleaned up
- RLS policies ensure users can only see their own completed flows

## Related Documentation

- [Device Flow Auth Reference (archive)](../archive/reference/device-flow/device-flow-auth-2025.md)
- [OAuth 2.0 Device Authorization Grant (RFC 8628)](https://tools.ietf.org/html/rfc8628)
- [Authentication Architecture](../ARCHITECTURE.md)


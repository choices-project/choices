# Device Flow Authentication

## Overview

Device Flow Authentication implements the OAuth 2.0 Device Authorization Grant (RFC 8628) for limited-input devices such as smart TVs, IoT devices, and command-line tools. This allows users to authorize devices that cannot easily display a browser or enter credentials.

## Architecture

### Flow Diagram

```
┌─────────┐                    ┌──────────┐                    ┌──────────┐
│ Device  │                    │  Server  │                    │  Browser │
└────┬────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                                │
     │ 1. Request device code        │                                │
     ├──────────────────────────────>│                                │
     │                               │                                │
     │ 2. Return device_code,        │                                │
     │    user_code, verification_uri│                                │
     │<──────────────────────────────┤                                │
     │                               │                                │
     │                               │ 3. User navigates to            │
     │                               │    verification URI              │
     │                               │<───────────────────────────────┤
     │                               │                                │
     │                               │ 4. User enters user_code        │
     │                               │<───────────────────────────────┤
     │                               │                                │
     │                               │ 5. User authenticates via OAuth │
     │                               │<───────────────────────────────┤
     │                               │                                │
     │ 6. Poll for completion        │                                │
     ├──────────────────────────────>│                                │
     │                               │                                │
     │ 7. Return "pending"           │                                │
     │<──────────────────────────────┤                                │
     │                               │                                │
     │ 8. User completes auth        │                                │
     │                               │───────────────────────────────>│
     │                               │                                │
     │ 9. Poll again                 │                                │
     ├──────────────────────────────>│                                │
     │                               │                                │
     │ 10. Return "completed"        │                                │
     │<──────────────────────────────┤                                │
     │                               │                                │
     │ 11. Device has access         │                                │
     │                               │                                │
```

## API Endpoints

### 1. Device Code Generation

**POST** `/api/auth/device-flow`

Generates a device code and user code for device authorization.

**Request Body:**
```json
{
  "provider": "google" | "github" | "facebook" | "twitter" | "linkedin" | "discord",
  "redirectTo": "/dashboard",  // Optional
  "scopes": ["read", "write"]   // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deviceCode": "abc123...",
    "userCode": "ABCD-EFGH",
    "verificationUri": "https://choices.app/auth/device-flow/verify",
    "expiresIn": 1800,
    "interval": 5
  }
}
```

**Rate Limiting:** 3 requests per hour per IP

### 2. Polling Endpoint

**POST** `/api/auth/device-flow/poll`

Polls for device authorization completion.

**Request Body:**
```json
{
  "deviceCode": "abc123..."
}
```

**Response (Pending):**
```json
{
  "success": true,
  "data": {
    "status": "pending"
  }
}
```

**Response (Completed):**
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "userId": "user-uuid"
  }
}
```

**Response (Expired):**
```json
{
  "success": false,
  "data": {
    "status": "expired",
    "error": "expired_token",
    "errorDescription": "The device code has expired."
  }
}
```

**Rate Limiting:** 60 requests per 5 minutes per IP

### 3. Verification Endpoint

**POST** `/api/auth/device-flow/verify`

Verifies user code and completes device authorization. User must be authenticated before calling this endpoint.

**Request Body:**
```json
{
  "userCode": "ABCD-EFGH",
  "provider": "google"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Device authorization completed successfully."
  }
}
```

**Rate Limiting:** 10 requests per 15 minutes per IP

## Database Schema

The `device_flow` table stores device authorization state:

```sql
CREATE TABLE device_flow (
  id UUID PRIMARY KEY,
  device_code TEXT UNIQUE NOT NULL,
  user_code TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  client_ip TEXT NOT NULL,
  redirect_to TEXT,
  scopes TEXT[],
  user_id UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
```

## Usage

### Client-Side Component

```tsx
import { DeviceFlowAuth } from '@/components/auth/DeviceFlowAuth';

function MyDeviceApp() {
  return (
    <DeviceFlowAuth
      provider="google"
      redirectTo="/dashboard"
      onComplete={(userId) => {
        console.log('Authorization complete!', userId);
      }}
      onError={(error) => {
        console.error('Authorization failed:', error);
      }}
    />
  );
}
```

### Manual Implementation

```typescript
// 1. Request device code
const response = await fetch('/api/auth/device-flow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ provider: 'google' }),
});

const { deviceCode, userCode, verificationUri, expiresIn, interval } = await response.json();

// 2. Display user code to user
console.log(`Enter code: ${userCode} at ${verificationUri}`);

// 3. Poll for completion
const pollInterval = setInterval(async () => {
  const pollResponse = await fetch('/api/auth/device-flow/poll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceCode }),
  });

  const { status, userId } = await pollResponse.json();

  if (status === 'completed') {
    clearInterval(pollInterval);
    console.log('Authorization complete!', userId);
  } else if (status === 'expired') {
    clearInterval(pollInterval);
    console.error('Code expired');
  }
}, interval * 1000);
```

## Security Considerations

### Rate Limiting

- **Device Code Requests:** 3 per hour per IP
- **Polling Requests:** 60 per 5 minutes per IP
- **Verification Requests:** 10 per 15 minutes per IP

### Code Generation

- Device codes are 40-byte cryptographically secure random values (base64url encoded)
- User codes are 8-character codes using only consonants (no vowels or ambiguous characters)
- User codes are formatted as `XXXX-XXXX` for readability

### Expiration

- Device codes expire after 30 minutes (1800 seconds)
- Expired codes are automatically cleaned up by database function
- Polling should respect the `interval` value to avoid excessive requests

### Best Practices

1. **Polling Interval:** Always respect the `interval` value returned by the server (typically 5 seconds)
2. **Error Handling:** Handle expired tokens gracefully and allow users to request new codes
3. **User Experience:** Display clear instructions and countdown timers
4. **Security:** Never log or expose device codes or user codes in client-side code

## Testing

### Manual Testing

1. Request a device code via POST `/api/auth/device-flow`
2. Navigate to the verification page and enter the user code
3. Authenticate via OAuth provider
4. Poll the polling endpoint until completion

### Automated Testing

See `tests/unit/auth/device-flow.test.ts` for unit tests and `tests/e2e/device-flow.spec.ts` for end-to-end tests.

## Troubleshooting

### Common Issues

**Issue:** Polling always returns "pending"
- **Solution:** Ensure user has completed authentication on verification page

**Issue:** Code expires before user can enter it
- **Solution:** Codes expire after 30 minutes. Request a new code if expired.

**Issue:** Rate limit errors
- **Solution:** Respect rate limits. Wait before retrying.

## Related Documentation

- [OAuth 2.0 Device Authorization Grant (RFC 8628)](https://tools.ietf.org/html/rfc8628)
- [Authentication Architecture](../../../ARCHITECTURE.md)
- [Security & Rate Limiting](../../../SECURITY.md)


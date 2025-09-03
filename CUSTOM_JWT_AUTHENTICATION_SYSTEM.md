# Custom JWT Authentication System - Choices Platform

**Created:** January 27, 2025  
**Last Updated:** January 27, 2025  
**Status:** 🔐 **ACTIVE IMPLEMENTATION**

## 🎯 Overview

The Choices platform uses a custom JWT-based authentication system that operates independently of Supabase Auth. This system provides full control over user authentication, session management, and security policies while maintaining compatibility with the existing Supabase database infrastructure.

## 🏗️ Architecture

### Core Components
1. **JWT Token Generation & Verification** - Custom JWT implementation using `jsonwebtoken`
2. **Session Cookie Management** - HTTP-only cookies with security headers
3. **User Profile System** - Custom user management in `user_profiles` table
4. **Trust Tier System** - Progressive authentication levels (T0, T1, T2, T3)
5. **Middleware Integration** - Authentication middleware for API routes

### Database Schema
```sql
-- User profiles table (custom auth)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  trust_tier TEXT DEFAULT 'T0' CHECK (trust_tier IN ('T0', 'T1', 'T2', 'T3')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Session tracking (optional)
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(user_id),
  session_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true
);
```

## 🔑 JWT Token Structure

### Token Payload
```typescript
interface JWTPayload {
  userId: string          // Unique user identifier
  stableId: string        // Stable user identifier (same as userId for now)
  username: string        // User's username
  iat: number            // Issued at timestamp
  exp: number            // Expiration timestamp
}
```

### Token Generation
```typescript
// From web/app/api/auth/register/route.ts
const sessionToken = jwt.sign(
  {
    userId: userId,
    stableId: userId,
    username: username.toLowerCase(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  },
  process.env.JWT_SECRET!
)
```

### Token Verification
```typescript
// From web/lib/auth-utils.ts
export function verifyAuthToken(token: string): JWTPayload | null {
  try {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured')
      return null
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload
    return decoded
  } catch (error) {
    logger.error('JWT verification failed:', error)
    return null
  }
}
```

## 🍪 Session Cookie Management

### Cookie Configuration
```typescript
// From web/app/api/auth/register/route.ts
response.cookies.set('choices_session', sessionToken, {
  httpOnly: true,                                    // Prevent XSS
  secure: process.env.NODE_ENV === 'production',    // HTTPS only in production
  path: '/',                                         // Available across site
  sameSite: 'lax',                                  // CSRF protection
  maxAge: 7 * 24 * 60 * 60                          // 7 days
})
```

### Cookie Security Features
- **`__Host-` prefix** - Domain binding (when implemented)
- **HttpOnly** - Prevents JavaScript access
- **Secure** - HTTPS only in production
- **SameSite=Lax** - CSRF protection
- **Automatic expiration** - 7-day default

## 🔐 Authentication Flow

### 1. User Registration
```typescript
// POST /api/auth/register
export async function POST(request: NextRequest) {
  const { username, email, password } = await request.json()
  
  // 1. Validate input
  // 2. Check for existing users
  // 3. Hash password with bcrypt
  // 4. Create user profile in database
  // 5. Generate JWT token
  // 6. Set session cookie
  // 7. Return success response
}
```

### 2. User Login
```typescript
// POST /api/auth/login
export async function POST(request: NextRequest) {
  const { username, password } = await request.json()
  
  // 1. Validate credentials
  // 2. Verify password hash
  // 3. Generate new JWT token
  // 4. Set session cookie
  // 5. Return user data
}
```

### 3. Session Validation
```typescript
// Middleware pattern
export function withAuth(handler: Function) {
  return async (request: NextRequest) => {
    // 1. Extract token from cookies/headers
    // 2. Verify JWT token
    // 3. Check user permissions
    // 4. Execute handler with user context
  }
}
```

## 🛡️ Security Features

### Password Security
- **bcrypt hashing** with salt rounds of 12
- **No plaintext storage** of passwords
- **Secure password validation** (minimum 8 characters)

### Token Security
- **HS256 algorithm** for JWT signing
- **Environment-based secret** (JWT_SECRET)
- **Automatic expiration** (7 days default)
- **Token rotation** on re-authentication

### Cookie Security
- **HttpOnly** prevents XSS attacks
- **Secure flag** in production
- **SameSite=Lax** prevents CSRF
- **Automatic expiration** handling

## 🔧 Implementation Details

### Environment Variables Required
```bash
# Required for JWT signing
JWT_SECRET=your-super-secure-jwt-secret-key

# Supabase connection (for database access)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Key Files
1. **`web/app/api/auth/register/route.ts`** - User registration endpoint
2. **`web/app/api/auth/login/route.ts`** - User login endpoint
3. **`web/lib/auth-utils.ts`** - JWT verification utilities
4. **`web/lib/session.ts`** - Session management
5. **`web/hooks/useAuth.ts`** - React authentication hook
6. **`web/lib/auth-middleware.ts`** - Authentication middleware

### Dependencies
```json
{
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.3",
  "uuid": "^9.0.0"
}
```

## 🚀 Usage Examples

### Protecting API Routes
```typescript
// Simple auth check
export async function GET(request: NextRequest) {
  const user = getCurrentUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Handle authenticated request
}

// Using middleware
export const GET = withAuth(async (request: NextRequest, context: AuthContext) => {
  // User is guaranteed to be authenticated
  const { user } = context
  // Handle request
})
```

### Client-Side Authentication
```typescript
// React hook usage
const { user, isAuthenticated, login, logout } = useAuth()

if (isAuthenticated) {
  return <Dashboard user={user} />
} else {
  return <LoginForm onLogin={login} />
}
```

## 🔄 Session Management

### Token Refresh
- **Automatic expiration** after 7 days
- **Manual refresh** on re-authentication
- **Graceful degradation** for expired sessions

### Logout Process
```typescript
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  
  // Clear session cookie
  response.cookies.delete('choices_session')
  
  return response
}
```

### Multi-Device Support
- **Single session per device** (can be extended)
- **Session tracking** in database (optional)
- **Device fingerprinting** support (planned)

## 🎯 Trust Tier System

### Tier Levels
- **T0** - New user, limited access
- **T1** - Basic user, standard features
- **T2** - Trusted user, advanced features
- **T3** - Admin user, full access

### Progressive Authentication
- **Email/password** for T0-T1
- **2FA required** for T2
- **WebAuthn** for T3 (planned)

## 🚨 Security Considerations

### Current Implementation
✅ **Secure password hashing** with bcrypt  
✅ **JWT token expiration**  
✅ **HttpOnly cookies**  
✅ **CSRF protection** with SameSite  
✅ **Environment-based secrets**  

### Recommended Improvements
🔒 **Implement token refresh** mechanism  
🔒 **Add rate limiting** for auth endpoints  
🔒 **Implement account lockout** after failed attempts  
🔒 **Add audit logging** for security events  
🔒 **Implement device fingerprinting**  

### Known Limitations
⚠️ **Single JWT secret** (consider rotating secrets)  
⚠️ **No token blacklisting** (implement for logout)  
⚠️ **Limited session tracking** (add for security)  

## 🔧 Configuration

### Development
```bash
# .env.local
JWT_SECRET=dev-secret-key-change-in-production
NODE_ENV=development
```

### Production
```bash
# Environment variables
JWT_SECRET=super-secure-production-secret-min-32-chars
NODE_ENV=production
```

## 📚 Related Documentation

- **`docs/AUTHENTICATION_SYSTEM.md`** - General auth system overview
- **`docs/DATABASE_SECURITY_AND_SCHEMA.md`** - Database security details
- **`docs/SECURITY.md`** - Platform security policies

## 🚀 Deployment Notes

### Vercel Deployment
- **Environment variables** must be set in Vercel dashboard
- **JWT_SECRET** should be at least 32 characters
- **Cookie domains** automatically handled by Vercel

### Database Migration
```sql
-- Ensure user_profiles table exists
-- Run existing migrations for schema setup
-- Verify JWT_SECRET is set in environment
```

---

**This document provides comprehensive information about the custom JWT authentication system. For implementation questions or security concerns, refer to the security team or platform administrators.**

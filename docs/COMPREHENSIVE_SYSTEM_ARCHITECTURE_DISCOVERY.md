# Choices — Comprehensive System Architecture Discovery

**Created:** 2025-01-17  
**Last Updated:** 2025-01-17  
**Status:** Core infrastructure stable, UI components need test-ID alignment

## System Overview

The Choices platform is a comprehensive voting system built on Next.js 14 with Supabase backend, featuring:

- **Authentication**: Email/password + WebAuthn passkey support
- **Poll Management**: Creation, voting, results with multiple voting methods
- **Admin System**: User management, analytics, system monitoring
- **E2E Testing**: Playwright-based testing with comprehensive coverage

## Current Status & Next Steps

### ✅ Completed
- Core authentication flow (email/password)
- Basic poll creation (single choice)
- E2E test infrastructure
- TypeScript strict mode (reduced from 60+ to ~30 errors)

### 🔄 In Progress
- Extended poll creation (timing, validation, dynamic options)
- WebAuthn integration (UI components + CDP support)
- Admin system (test IDs and access control)
- Voting flows (has-voted API + UI components)

### 📋 Next Priorities
1. **Poll Creation Form**: Add missing fields and test IDs
2. **WebAuthn Components**: Implement UI elements for passkey flows
3. **Admin Interface**: Add test IDs and access control elements
4. **Voting System**: Complete has-voted API and UI components

## Frontend Testing Conventions

### Test ID Registry
All test IDs are centralized in `/web/lib/testing/testIds.ts`:

```typescript
export const T = {
  login: { email: 'login-email', password: 'login-password', ... },
  pollCreate: { title: 'poll-title', startTime: 'start-time', ... },
  webauthn: { register: 'register-passkey-button', ... },
  admin: { usersTab: 'admin-users-tab', ... },
} as const;
```

### Page Object Pattern
Tests use Page Objects that map to the T registry:

```typescript
// In tests
import { T } from '@/lib/testing/testIds';
await page.fill(`[data-testid="${T.pollCreate.title}"]`, 'My Poll');
```

## Key Files Reference

### Core Implementation
- `/web/app/(app)/polls/create/page.tsx` - Poll creation form
- `/web/components/auth/PasskeyControls.tsx` - WebAuthn UI
- `/web/app/(app)/admin/page.tsx` - Admin dashboard
- `/web/lib/testing/testIds.ts` - Test ID registry

### Test Suites
- `/web/tests/e2e/poll-creation.spec.ts` - Poll creation tests
- `/web/tests/e2e/webauthn.cdp.spec.ts` - WebAuthn tests
- `/web/tests/e2e/admin-system.spec.ts` - Admin tests
- `/web/tests/e2e/voting-flow.spec.ts` - Voting tests

## Maintenance Guidelines

### Adding New Features
1. Update T registry with new test IDs
2. Implement UI components with proper test IDs
3. Write E2E tests using Page Object pattern
4. Update documentation in this file

### Fixing Test Failures
1. Identify missing test IDs or UI elements
2. Update T registry if needed
3. Implement missing components
4. Verify tests pass locally before committing

---

**Note**: This document should be updated whenever significant architectural changes are made to the system. Keep it current with the actual implementation to serve as a reliable reference for new team members and AI assistants.
# Testing Guide

**Last Updated**: November 6, 2025

---

## Quick Start

### E2E Tests
```bash
npm run test:e2e
```

### Unit Tests
```bash
npm test
```

**That's it!** Test users are already configured.

---

## Test Users

✅ **Admin**: `michaeltempesta@gmail.com` (password in `.env.test.local`)  
✅ **Regular**: `anonysendlol@gmail.com` (password in `.env.test.local`)

---

## Test Structure

```
tests/
├── e2e/              ← 32 E2E tests
├── unit/             ← 11 unit tests
├── api/              ← 2 API tests
└── archive/          ← Old files
```

---

## Documentation

### E2E Testing
- **[e2e/README.md](./e2e/README.md)** - Complete E2E guide

### Status
- **[TEST_STATUS.md](./TEST_STATUS.md)** - Current status

---

## Test Coverage

- ✅ Authentication & auth flows
- ✅ Analytics (admin & user)
- ✅ Civics features (comprehensive)
- ✅ Privacy features
- ✅ PWA functionality
- ✅ Polls & voting
- ✅ Admin features
- ✅ Representatives
- ✅ Candidate features

**Total**: 45 active test files

---

## Running Tests

### All Tests
```bash
npm run test:e2e        # All E2E
npm test                # All unit
```

### Specific Tests
```bash
npx playwright test tests/e2e/analytics.spec.ts
npm test -- tests/unit/vote/
```

### Interactive
```bash
npm run test:e2e:ui     # Playwright UI
npm run test:e2e:debug  # Debug mode
```

---

## Test Users & Auth

All tests use **real Supabase authentication**:
- No mocks
- No bypasses
- Real session cookies
- Actual middleware validation

See `e2e/README.md` for authentication details.

---

**Status**: ✅ Infrastructure Ready  
**Pass Rate**: ~30-40% (improving)  
**Next**: Continue fixing test selectors

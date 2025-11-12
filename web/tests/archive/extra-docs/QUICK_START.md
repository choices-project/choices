# E2E Testing - Quick Start

## Run Tests

```bash
npm run test:e2e
```

That's it! Everything is ready.

---

## Test Users (Already Exist)

**Admin**: `michaeltempesta@gmail.com`  
**Regular**: `anonysendlol@gmail.com`

Both configured in `.env.test.local`

---

## Run Specific Tests

```bash
# Analytics tests
npx playwright test tests/e2e/analytics-charts.spec.ts

# API tests  
npx playwright test tests/e2e/api-endpoints.spec.ts

# Interactive mode
npm run test:e2e:ui
```

---

## Documentation

- `TEST_USERS.md` - User details
- `AUTHENTICATION.md` - How auth works
- `INDEX.md` - All documentation


# Production Monitoring Tests

**Archived:** November 30, 2025

## Overview

These test files were designed to monitor the production site (choices-app.com) for issues. They test against the live production environment, not the local development server.

## Why Archived

1. **Not part of development workflow** - These tests run against production, not local dev
2. **Not configured in CI** - Main Playwright config uses local baseURL (`http://127.0.0.1:3000`)
3. **Separate concern** - Production monitoring should be a separate suite/tool
4. **Maintenance burden** - 21 files testing production adds complexity

## Files

All `choices-app-*.spec.ts` files that test the production site:
- `choices-app-smoke.spec.ts`
- `choices-app-health-check.spec.ts`
- `choices-app-comprehensive.spec.ts`
- `choices-app-diagnostics.spec.ts`
- `choices-app-deep-diagnosis.spec.ts`
- `choices-app-investigation.spec.ts`
- `choices-app-react-init.spec.ts`
- `choices-app-script-execution.spec.ts`
- `choices-app-html-structure.spec.ts`
- `choices-app-edge-cases.spec.ts`
- `choices-app-api-endpoints.spec.ts`
- `choices-app-api-robustness.spec.ts`
- `choices-app-integration.spec.ts`
- `choices-app-performance.spec.ts`
- `choices-app-accessibility.spec.ts`
- `choices-app-security.spec.ts`
- `choices-app-auth.spec.ts`
- `choices-app-session.spec.ts`
- `choices-app-dashboard.spec.ts`
- `choices-app-user-journey.spec.ts`
- `choices-app-critical-flows.spec.ts`

## Restoring

If you need production monitoring tests:
1. Create a separate Playwright config for production
2. Set baseURL to `https://choices-app.com`
3. Configure separate CI job for production monitoring
4. Consider using dedicated monitoring tools (e.g., UptimeRobot, Pingdom)

## Current Development Tests

Active E2E tests for development are in:
- `tests/e2e/specs/` (excluding choices-app-*.spec.ts)
- These test against local dev server or test environment


# Admin System Testing Setup

## Overview

This directory contains comprehensive tests for the admin system, covering:

1. **Authentication Tests** (`admin-auth.test.ts`) - Unit tests for admin authentication logic
2. **API Tests** (`admin-apis.test.ts`) - Unit tests for all admin API endpoints
3. **E2E Tests** (`../e2e/admin-system.spec.ts`) - End-to-end tests for admin functionality

## Test Categories

### Unit Tests (Jest)
- **Admin Authentication**: Tests `isAdmin()`, `requireAdmin()`, and `getAdminUser()` functions
- **Admin APIs**: Tests all admin API endpoints for proper authentication and authorization
- **Error Handling**: Tests various error scenarios and edge cases

### End-to-End Tests (Playwright)
- **Admin Access Control**: Tests that non-admin users cannot access admin features
- **Admin Dashboard**: Tests admin dashboard functionality and navigation
- **Admin Features**: Tests user management, feedback management, analytics, system monitoring, and site messages
- **Security**: Tests that admin API endpoints are properly protected

## Running Tests

### Unit Tests
```bash
# Run all admin unit tests
npm test -- tests/admin

# Run specific test file
npm test -- tests/admin/admin-auth.test.ts

# Run with coverage
npm run test:coverage -- tests/admin
```

### End-to-End Tests
```bash
# Run all admin E2E tests
npm run test:e2e -- tests/e2e/admin-system.spec.ts

# Run with UI
npm run test:e2e:ui -- tests/e2e/admin-system.spec.ts

# Run in headed mode
npm run test:e2e:headed -- tests/e2e/admin-system.spec.ts
```

## Test Data Setup

### Admin User Setup
For E2E tests to work, you need to set up test users:

1. **Admin User**: `admin@example.com` with `is_admin = true` in database
2. **Regular User**: `regular@example.com` with `is_admin = false` in database

### Database Setup
Ensure the following database structure exists:
- `user_profiles` table with `is_admin` column
- Test data for users, feedback, polls, etc.

## Test Environment

### Environment Variables
Tests use the following environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY`

### Mock Data
Unit tests use mocked Supabase clients and admin auth functions to avoid database dependencies.

## Security Testing

The tests verify:
1. **Authentication**: Only authenticated users can access admin functions
2. **Authorization**: Only users with `is_admin = true` can access admin features
3. **API Protection**: All admin API endpoints require admin authentication
4. **UI Protection**: Admin UI is not accessible to non-admin users

## Continuous Integration

These tests are designed to run in CI/CD pipelines:
- Unit tests run quickly with mocked dependencies
- E2E tests run against a test database
- All tests verify security requirements

## Troubleshooting

### Common Issues
1. **Test Database**: Ensure test database is set up with proper schema
2. **Test Users**: Ensure admin and regular test users exist
3. **Environment Variables**: Ensure all required environment variables are set
4. **Mock Setup**: Ensure mocks are properly configured for unit tests

### Debug Mode
Run tests in debug mode for troubleshooting:
```bash
# Debug unit tests
npm test -- --verbose tests/admin

# Debug E2E tests
npm run test:e2e:debug -- tests/e2e/admin-system.spec.ts
```

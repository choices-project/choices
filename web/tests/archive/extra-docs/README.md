# Setup Scripts

**Test users already exist!** These scripts maintain them, but you don't need to run them manually.

## Scripts

### `global-setup.ts`
- Runs automatically before E2E tests
- Verifies test users exist
- Checks server is running

### `create-test-users.ts`
- Creates/updates test users if needed
- Uses service role key
- Verifies user profiles

### `verify-admin.ts`
- Verifies admin user has correct permissions
- Run manually: `npm run test:e2e:verify`

### `check-env.ts`
- Validates environment variables
- Run manually: `npm run test:e2e:check`

## Normal Usage

Just run tests - setup is automatic:

```bash
npm run test:e2e
```

## Manual Commands

Only if you need to debug:

```bash
# Check environment
npm run test:e2e:check

# Verify admin access
npm run test:e2e:verify

# Force user update (rarely needed)
npm run test:e2e:setup
```

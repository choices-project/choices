# Future Features Quarantine

This directory contains future features that are **NOT READY FOR PRODUCTION**.

## Quarantine Rules

1. **All files in this directory are excluded from:**
   - TypeScript strict checking
   - ESLint linting
   - CodeQL security scanning
   - CI/CD pipeline validation

2. **Files must have `.disabled` extension** to be properly quarantined

3. **Feature flags must be `false`** in `web/lib/core/feature-flags.ts`

4. **No imports from quarantined files** in production code

## Directory Structure

```
quarantine/
├── future-features/
│   ├── social-sharing/
│   │   ├── social-sharing.ts.disabled
│   │   ├── SocialLoginButtons.tsx.disabled
│   │   └── SocialSignup.tsx.disabled
│   ├── automated-polls/
│   │   └── automated-polls.ts.disabled
│   ├── device-flow/
│   │   ├── device-flow.ts.disabled
│   │   ├── DeviceFlowAuth.tsx.disabled
│   │   ├── page.tsx.disabled
│   │   └── api-routes/
│   │       ├── route.ts.disabled
│   │       ├── verify/route.ts.disabled
│   │       └── complete/route.ts.disabled
│   ├── contact-information/
│   │   └── contact-information-schema.sql.disabled
│   ├── archive-future-work/
│   │   └── social/ (all files have .disabled extension)
│   ├── dev-lib/
│   │   ├── comprehensive-testing-runner.ts.disabled
│   │   ├── cross-platform-testing.ts.disabled
│   │   ├── github-issue-integration.ts.disabled
│   │   ├── media-bias-analysis.ts.disabled
│   │   ├── mobile-compatibility-testing.ts.disabled
│   │   ├── poll-narrative-system.ts.disabled
│   │   └── testing-suite.ts.disabled
│   └── redundant-components/
│       └── AuthStep.tsx.disabled
└── README.md
```

## Moving Features Out of Quarantine

When a feature is ready for production:

1. Remove `.disabled` extension
2. Move to appropriate production directory
3. Set feature flag to `true`
4. Update CI configuration
5. Add proper tests

## Current Quarantined Features

- **Social Sharing** - Partially implemented (60%)
- **Automated Polls** - Partially implemented (40%)
- **Device Flow Auth** - Partially implemented (80%)
- **Contact Information** - Partially implemented (50%)

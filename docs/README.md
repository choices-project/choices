# Choices Documentation

**Platform**: Civic engagement and democratic decision-making  
**Last Updated**: November 4, 2025

---

## Quick Start

- **New AI Agent?** → [AGENT_ONBOARDING.md](AGENT_ONBOARDING.md) ⭐
- **New Developer?** → [DEVELOPMENT.md](DEVELOPMENT.md)
- **Deploying?** → [DEPLOYMENT.md](DEPLOYMENT.md)
- **Contributing?** → [CONTRIBUTING.md](CONTRIBUTING.md)
- **Need API docs?** → [API_DOCUMENTATION_CIVICS.md](API_DOCUMENTATION_CIVICS.md)

---

## Core Documentation

### System Design
- [ARCHITECTURE.md](ARCHITECTURE.md) - Next.js 15, Zustand, Supabase
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - 64 tables, complete schema
- [SECURITY.md](SECURITY.md) - WebAuthn, trust tiers, RLS
- [TRUST_TIER_DESIGN.md](TRUST_TIER_DESIGN.md) - Equal voting philosophy

### Development
- [DEVELOPMENT.md](DEVELOPMENT.md) - Local setup, tools, workflow
- [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) - Required env vars
- [LINT_STANDARDS.md](LINT_STANDARDS.md) - Code quality standards
- [DEVELOPER_GUIDE_SUPABASE_CLIENT.md](DEVELOPER_GUIDE_SUPABASE_CLIENT.md) - Supabase patterns

### Project Status
- [CURRENT_STATUS.md](CURRENT_STATUS.md) - Current state, error counts
- [FEATURES.md](FEATURES.md) - Feature overview and status
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment readiness

---

## Features

All features documented in `features/`:

### Core Features (Operational)
- [polls.md](features/polls.md) - Premier feature, 23 components
- [voting.md](features/voting.md) - Equal voting, trust tier analytics
- [authentication.md](features/authentication.md) - WebAuthn, passkeys
- [admin.md](features/admin.md) - Admin dashboard, 27 components
- [civics.md](features/civics.md) - Representative database, 15 components

### Supporting Features
- [analytics.md](features/analytics.md) - Platform analytics
- [feeds.md](features/feeds.md) - Content personalization
- [hashtags.md](features/hashtags.md) - Content organization
- [onboarding.md](features/onboarding.md) - User onboarding
- [profile.md](features/profile.md) - User profiles
- [contact.md](features/contact.md) - Representative contact
- [dashboard.md](features/dashboard.md) - User dashboard

### Partial/Framework
- [pwa.md](features/pwa.md) - PWA framework (incomplete)
- [candidate-platform.md](features/candidate-platform.md) - Partially implemented
- [filing-system.md](features/filing-system.md) - Filing assistance

---

## Guides

### Setup
- [guides/SUPABASE_CLI_SETUP.md](guides/SUPABASE_CLI_SETUP.md) - Link CLI, generate types
- [guides/MONITORING_SETUP.md](guides/MONITORING_SETUP.md) - Sentry, BetterStack
- [guides/UPSTASH_RATE_LIMITING.md](guides/UPSTASH_RATE_LIMITING.md) - Redis rate limiting
- [guides/SCRIPTS_INVENTORY.md](guides/SCRIPTS_INVENTORY.md) - Available scripts

### Testing
- [guides/testing/README.md](guides/testing/README.md) - Testing overview
- [guides/testing/QUICK_START_TESTING.md](guides/testing/QUICK_START_TESTING.md) - Quick start
- [guides/testing/TESTING_FEC_INTEGRATION.md](guides/testing/TESTING_FEC_INTEGRATION.md) - FEC tests
- [guides/testing/TESTING_FILING_SYSTEM.md](guides/testing/TESTING_FILING_SYSTEM.md) - Filing tests

---

## Archive

Historical documentation in `archive/2025-11/`:
- Comprehensive docs (system-wide detailed docs)
- Component docs (individual component documentation)
- Feature status docs (historical feature tracking)
- Audits (implementation audits and reports)
- Migrations (database migration docs)
- Future feature plans (roadmaps for unimplemented features)

**Note**: Archive preserved for reference, not current.

---

## Documentation Standards

- **Technically correct** - No grandstanding
- **Current** - Matches codebase as of date
- **Essential** - Only what's needed
- **File paths included** - For all code references
- **Status indicated** - ✅ Operational, 🟡 Partial, ❌ Not Implemented

---

**Total**: 39 essential documentation files  
**Archive**: 118 historical files (preserved for reference)

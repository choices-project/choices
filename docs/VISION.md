# Choices Platform Vision

_Last updated: January 2026_

## Mission

Choices is a privacy-first, open-source platform for participatory democracy that enables citizens to engage with polls, representatives, and civic actions in a transparent, accessible, and accountable way.

## Core Principles

1. **Privacy First** - User control over data, GDPR/CCPA compliant
2. **Equal Voting** - "A vote is a vote. Period." - No weighted votes in results
3. **Open Source** - Transparent and auditable codebase
4. **Accessibility** - Inclusive design for all users
5. **Performance** - Fast, reliable, and offline-capable

## MVP Status (Complete)

The Choices platform MVP is **complete and production-ready**. All core features are implemented, tested, and documented.

### ✅ MVP Features (Production Ready)

**Core Platform:**
- ✅ Customizable Analytics Dashboard - Drag-and-drop widgets, 5 presets
- ✅ Privacy System - GDPR/CCPA compliant (16 granular controls)
- ✅ Polling System - Equal voting, multiple voting methods
- ✅ Civic Engagement - Representatives, petitions, civic actions
- ✅ Location Features - District-based filtering (privacy-first)
- ✅ PWA - Offline-first, push notifications, installable
- ✅ WebAuthn - Passwordless biometric authentication
- ✅ Trust Tiers - T0-T3 verification (analytics only)
- ✅ Feed System - Personalized content with district filtering
- ✅ Candidate Onboarding & Verification - Owner edit + publish, official email fast-track
- ✅ Representative Overrides - Public-facing fields only; official records remain immutable
- ✅ Auditing & Admin Revert - Field-level audit logs and one-click revert endpoints

**Technical Foundation:**
- ✅ Zero TypeScript errors
- ✅ Zero linter errors
- ✅ Comprehensive testing (Jest + Playwright)
- ✅ Production deployment ready
- ✅ Complete documentation

## Future Roadmap

While the MVP is complete, the platform continues to evolve. Future work is tracked in:

- **Feature Status**: [`FEATURE_STATUS.md`](FEATURE_STATUS.md) - Current feature flags and their states
- **Roadmap**: `docs/ROADMAP_SINGLE_SOURCE.md` - Detailed outstanding work items
- **Current Status**: [`CURRENT_STATUS.md`](CURRENT_STATUS.md) - Active workstreams and known gaps

### Planned Enhancements (Not Blocking MVP)

**Beta Features (In Progress):**
- 🔄 Push Notifications - Client opt-in + delivery guarantees (see [`docs/archive/reference/push-notifications/push-notifications-audit-2025.md`](archive/reference/push-notifications/push-notifications-audit-2025.md))
- 🔄 Device Flow Auth - OAuth 2.0 Device Authorization (see [`docs/archive/reference/device-flow/device-flow-auth-2025.md`](archive/reference/device-flow/device-flow-auth-2025.md))
- 🔄 Internationalization - Expand locale coverage beyond en/es
- 🔄 Contact Information System - Complete ingestion + notification flows

**Experimental Features (Planned):**
- 📋 Social Sharing - Persist events, expose metrics, admin dashboards
- 📋 Advanced Privacy - Zero-knowledge proofs, differential privacy
- 📋 Performance Optimization - Expand adoption of optimization utilities
- 📋 Civic Engagement v2 - Enhanced integration with Supabase and UI

**Future Considerations:**
- 🔮 Automated Poll Generation
- 🔮 Social Signup (OAuth)
- 🔮 Advanced Analytics - Predictive modeling, constituent polling

## Technical Excellence

The Choices platform is built with:

- **Modern Stack**: Next.js 14, TypeScript, React, Tailwind CSS
- **State Management**: Zustand with Immer, following established patterns
- **Database**: PostgreSQL (Supabase) with Row Level Security
- **Testing**: Comprehensive Jest unit tests + Playwright E2E tests
- **Infrastructure**: Vercel (hosting), Supabase (database), Upstash (Redis)
- **Monitoring**: Sentry (error tracking), privacy-preserving analytics

## Governance

- **License**: MIT - Open source and free to use
- **Contributing**: DCO-based - See [`CONTRIBUTING.md`](../CONTRIBUTING.md)
- **Code of Conduct**: See [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md)
- **Security**: Responsible disclosure - See [`SECURITY.md`](SECURITY.md)
- **Voting Integrity**: "A vote is a vote. Period." - No manipulation, no weighting

## Getting Involved

**For Developers:**
- Start with [`GETTING_STARTED.md`](GETTING_STARTED.md)
- Read [`DEVELOPMENT.md`](DEVELOPMENT.md) for setup
- Check [`CONTRIBUTING.md`](../CONTRIBUTING.md) for workflow
- Explore [`CODEBASE_NAVIGATION.md`](CODEBASE_NAVIGATION.md) to understand structure

**For Contributors:**
- Look for `good first issue` labels
- Improve documentation (always welcome!)
- Fix bugs or add features
- Review pull requests

**For Users:**
- Deploy your own instance (see [`DEPLOYMENT.md`](DEPLOYMENT.md))
- Report issues or suggest features
- Contribute to documentation

## Success Metrics

The platform is successful when:

- ✅ Users can create and vote on polls easily
- ✅ Representatives can engage with constituents transparently
- ✅ Privacy controls are respected and user data is protected
- ✅ The platform is accessible to all users (WCAG compliant)
- ✅ The codebase is maintainable and well-documented
- ✅ Contributors can onboard quickly and contribute effectively

## Current State

**Status**: ✅ **MVP Complete - Production Ready**

- All MVP features implemented and tested
- Zero TypeScript/linter errors
- Comprehensive documentation
- Production deployment ready
- Active development continues on enhancements

For detailed current status, see [`CURRENT_STATUS.md`](CURRENT_STATUS.md).

---

**Built with** ❤️ **for participatory democracy**

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** TBD


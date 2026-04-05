# Choices Platform Vision

_Last updated: April 5, 2026_

## Mission

Choices is a privacy-first, open-source platform for participatory democracy that helps citizens engage with polls, representatives, and civic actions using transparent, checkable public data—not hype or sealed “black boxes.”

## Core Principles

1. **Privacy First** - User control over data; GDPR/CCPA aligned controls; we do not sell personal or row-level data
2. **Equal Voting (poll tallies)** - Public poll results use equal weight per participant in the tallies we present; no paid vote multipliers in those surfaces
3. **Trust Layer (optional)** - Verification tiers can signal legitimacy and reduce abuse; they complement—not replace—equal tabulation where the product promises it. See [TRUST_LAYER.md](TRUST_LAYER.md)
4. **Open Source** - Transparent and auditable codebase
5. **Accessibility** - Inclusive design for all users
6. **Performance** - Fast, reliable, and offline-capable where feasible

**Optional aggregate research:** Programs such as an “Insights Panel” may use **coarsened or aggregated** contributions only under explicit consent, with revocation and safeguards (minimum cell sizes, contracts). This is not the same as selling identifiable rows. Details live in [PRIVACY_POLICY.md](PRIVACY_POLICY.md) and [TRUST_LAYER.md](TRUST_LAYER.md).

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
- ✅ Trust Tiers - T0–T3 optional verification (signals and abuse resistance; see trust-layer doc)
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

**UX/UI Elevation (March 2026):**
- ✅ Design token system — HSL-based CSS custom properties with light, dark, and high-contrast modes
- ✅ Animation system — Framer Motion with reduced motion support
- ✅ Accessibility — Focus traps, LiveAnnouncer, keyboard navigation, ARIA labels
- ✅ Security hardening — Rate limiting, CSRF, input sanitization, env validation
- ✅ Production error handling — Global and route-level error boundaries
- ✅ Performance — React.memo, dynamic imports, FeedContext, scroll restoration

## Future Roadmap

While the MVP is complete, the platform continues to evolve. Future work is tracked in:

- **Roadmap**: [`ROADMAP.md`](ROADMAP.md) - Definitive MVP roadmap (all remaining work)

### Planned Enhancements (Not Blocking MVP)

**GA (shipped):** Contact Information System, Push Notifications, and Civic Engagement v2 are generally available (default on). See [ROADMAP.md](ROADMAP.md) for remaining work and post-deploy verification steps.

**In Progress / Quarantined:**
- 🔄 Device Flow Auth - Implementation complete; E2E and OAuth provider config on hold (see [ROADMAP.md](ROADMAP.md) §5 Quarantined)
- 🔄 Internationalization — en/es catalogue coverage still expanding; **CI** runs **`i18n:extract`** / **`i18n:validate`** (see **`.github/workflows/ci.yml`**); release **copy freeze** in [`docs/COPY_FREEZE.md`](COPY_FREEZE.md)
- 📋 Social Sharing - API + poll UI shipped; civics/OG pipelines on hold
- 📋 Advanced Privacy - Concept only (ZK/DP); quarantined
- 📋 Performance Optimization - Partially adopted; audit consumers for defaults

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
- **Security**: Responsible disclosure - See [SECURITY.md](../SECURITY.md)
- **Voting integrity**: Equal tabulation in public poll results we surface; optional verified-weight or analyst views, if ever exposed, must be labeled distinctly (see trust-layer doc)

## Getting Involved

**For Developers:**
- Start with [GETTING_STARTED.md](GETTING_STARTED.md) for setup and runbook
- Check [CONTRIBUTING.md](../CONTRIBUTING.md) for workflow
- Explore [ARCHITECTURE.md](ARCHITECTURE.md) to understand structure
- Roadmap and next steps: [ROADMAP.md](ROADMAP.md)

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

For detailed current status, see [`ROADMAP.md`](ROADMAP.md).

---

**Built with** ❤️ **for participatory democracy**

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** 2026-04-04 (documentation accuracy and codebase-reference review)


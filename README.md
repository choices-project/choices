# Choices - Participatory Democracy Platform

**Status**: ✅ **MVP Complete - Production Ready**  
**Last Updated**: January 2026

---

## 🎯 What is Choices?

A privacy-first, open-source platform for participatory democracy, enabling citizens to engage with polls, representatives, and civic actions.

---

## 🚀 Quick Start

### Deploy Now
```bash
# 1. Run database migration
cd supabase && supabase db push

# 2. Deploy to production
cd web && vercel deploy --prod
```

See **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** for the complete guide.

---

## ✨ Key Features

- ✅ **Customizable Analytics Dashboard** - Drag-and-drop widgets, 5 presets
- ✅ **Privacy System** - GDPR/CCPA compliant (16 granular controls)
- ✅ **Polling System** - Equal voting, multiple voting methods
- ✅ **Civic Engagement** - Representatives, petitions, civic actions
- ✅ **Location Features** - District-based filtering (privacy-first)
- ✅ **PWA** - Offline-first, push notifications, installable
- ✅ **WebAuthn** - Passwordless biometric authentication
- ✅ **Trust Tiers** - T0-T3 verification (analytics only)
- ✅ **Feed System** - Personalized content with district filtering
- ✅ **Candidate Onboarding & Verification** - Owner edit + publish, official email fast‑track (code flow)
- ✅ **Representative Overrides** - Public-facing fields only; official records remain immutable
- ✅ **Auditing & Admin Revert** - Field-level audit logs and one‑click revert endpoints

---

## 📚 Documentation

### Essential Reading
- **[docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md)** - Quick start guide for new developers
- **[docs/VISION.md](./docs/VISION.md)** - Project vision and roadmap
- **[docs/CURRENT_STATUS.md](./docs/CURRENT_STATUS.md)** - Current status and active work
- **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Deployment guide
- **[docs/FEATURE_STATUS.md](./docs/FEATURE_STATUS.md)** - Feature flags and status

### For Developers
- **[docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md)** - Quick start (5 minutes)
- **[docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md)** - Setup and development runbook
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System architecture
- **[docs/CODEBASE_NAVIGATION.md](./docs/CODEBASE_NAVIGATION.md)** - Codebase structure guide
- **[docs/CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution workflow
- **[docs/TESTING.md](./docs/TESTING.md)** - Testing strategies
- **[docs/STATE_MANAGEMENT.md](./docs/STATE_MANAGEMENT.md)** - State management patterns
- **[docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)** - Database schema
- **[docs/API/README.md](./docs/API/README.md)** - API documentation

### For Compliance
- **[docs/PRIVACY_POLICY.md](./docs/PRIVACY_POLICY.md)** - Privacy policy
- **[docs/SECURITY.md](./docs/SECURITY.md)** - Security practices
- **[docs/VOTING_INTEGRITY_POLICY.md](./docs/VOTING_INTEGRITY_POLICY.md)** - Voting integrity
 - **Security Reporting**: See [SECURITY.md](./SECURITY.md)

---

## 📊 Technical Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: React + Tailwind CSS + shadcn/ui
- **State**: Zustand + Immer
- **Charts**: Recharts
- **Widgets**: react-grid-layout
- **PWA**: Service Workers + Web Push

### Backend
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth + WebAuthn
- **Caching**: Redis (Upstash)
- **Rate Limiting**: Upstash
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

### Infrastructure
- **Hosting**: Vercel (Edge Functions)
- **Database**: Supabase
- **Caching**: Upstash Redis
- **Monitoring**: Sentry
- **Analytics**: Privacy-preserving

---

## 🔐 Environment & Email (Quick)

**Status:** ✅ All critical environment variables are configured in Vercel.

**Required Variables (All Configured):**
- `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` – Supabase service role key
- `UPSTASH_REDIS_REST_URL` – Upstash Redis URL (rate limiting)
- `UPSTASH_REDIS_REST_TOKEN` – Upstash Redis token
- `RESEND_API_KEY` – Resend API key (email service)
- `RESEND_FROM_EMAIL` – Email from address (currently test email; update to verified domain for production)
- `CRON_SECRET` – Secret for cron job authentication
- `ADMIN_MONITORING_KEY` – Admin endpoint security key
- `NEXT_PUBLIC_BASE_URL` – Application base URL

**Complete Documentation:**
- Full list: [`docs/ENVIRONMENT_VARIABLES.md`](./docs/ENVIRONMENT_VARIABLES.md)
- Email setup: [`docs/archive/runbooks/operations/email-deliverability-setup.md`](./docs/archive/runbooks/operations/email-deliverability-setup.md)

If you don’t have a domain yet, see the freemium/sandbox guidance in [email-deliverability-setup.md](./docs/archive/runbooks/operations/email-deliverability-setup.md).

Admin endpoints:
- `GET /api/admin/candidates/stats`
- `GET /api/admin/audit/candidates`
- `GET /api/admin/audit/representatives`
- `POST /api/admin/audit/revert`

Email webhook:
- `POST /api/webhooks/resend` (configure in Resend dashboard; optional signing supported with a small code addition)

Candidate verification:
- `POST /api/candidates/verify/request` – issue code via email
- `POST /api/candidates/verify/confirm` – confirm code and link representative if eligible

Representative overrides (fast‑track only):
- `POST|PATCH /api/representatives/self/overrides` – limited public-facing fields only

---

## 📈 Current State

### Metrics
- **API Endpoints**: 115 canonical (consolidated from 143)
- **Database Tables**: 70+ tables, 19 RPC functions
- **TypeScript**: Zero errors
- **Build**: Passing (85/85 pages)
- **Test Coverage**: Comprehensive E2E tests

### Code Quality
- ✅ Zero TypeScript errors
- ✅ Zero linter errors
- ✅ Zero duplicates
- ✅ Professional documentation
- ✅ Comprehensive testing

---

## 🎨 Recent Additions (November 2025)

### Widget System
- Customizable drag-and-drop analytics dashboard
- 5 layout presets
- Database persistence
- Undo/redo history
- Keyboard shortcuts
- 11 E2E tests

### API Consolidation
- Removed 28 duplicate endpoints (20% reduction)
- Clean canonical API structure
- Consistent versioning
- All client code updated

---

## 🏛️ Governance

- **License**: MIT — see [LICENSE](./LICENSE)
- **Contributing**: DCO-based — see [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Code of Conduct**: See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- **Security**: Responsible disclosure — see [SECURITY.md](./SECURITY.md)
- **Trademarks**: See [TRADEMARKS.md](./TRADEMARKS.md)
- **Voting Integrity**: "A vote is a vote. Period."
- **Privacy**: GDPR/CCPA compliant

---

## 🤝 Contributing

This platform is built with care for democracy and transparency.

### Principles
1. **Privacy First** - User control over data
2. **Equal Voting** - No weighted votes in results
3. **Open Source** - Transparent and auditable
4. **Accessibility** - Inclusive design
5. **Performance** - Fast and reliable

### Before Opening a PR
- Run `npm run lint`, `npm run type-check`, `npm run test`, and any relevant Playwright specs.
- Run `npm run governance:check` to ensure store or API changes include the required roadmap/doc/changelog updates (CI also enforces this).
- Fill out the checklist in `.github/PULL_REQUEST_TEMPLATE.md`, including the accessibility/i18n section and release-note entry.
- Sign your commits with DCO: `git commit -s -m "feat: ..."` (see CONTRIBUTING.md).

---

## 📞 Support

- **Documentation**: See [`docs/README.md`](./docs/README.md)
- **Deployment**: See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)
- **Status**: See [`docs/CURRENT_STATUS.md`](./docs/CURRENT_STATUS.md)

---

## 🎉 Status

**The Choices platform MVP is complete and ready for production deployment!**

- ✅ All MVP features implemented and tested
- ✅ Zero TypeScript/linter errors
- ✅ Comprehensive documentation
- ✅ Production tested
- ✅ Ready to deploy

For current status and ongoing work, see [`docs/CURRENT_STATUS.md`](docs/CURRENT_STATUS.md).  
For project vision and roadmap, see [`docs/VISION.md`](docs/VISION.md).

---

**Built with** ❤️ **for participatory democracy**  
**Last Updated**: January 2026  
**Version**: 1.0.0 (MVP Complete)

🚀 **DEPLOY NOW!**

# Choices Platform

**Civic Engagement & Democratic Decision-Making Platform**

**Status**: 85% Complete, Production-Ready  
**Last Updated**: November 5, 2025  
**License**: See [LICENSE](LICENSE)

---

## 🚀 Quick Start

### For Developers
```bash
# See /docs/DEVELOPMENT.md for full setup
npm install
npm run dev
```

### For Users
Visit the platform and explore:
- Create and vote on polls
- Connect with representatives
- Filter content by your district
- Privacy-first design

---

## 📚 Documentation

**Core Documentation**: [/docs/README.md](docs/README.md)

### Essential Docs
- **[docs/CURRENT_STATUS.md](docs/CURRENT_STATUS.md)** - Project status (85% complete)
- **[docs/FEATURES.md](docs/FEATURES.md)** - All features overview
- **[docs/DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md)** - Complete navigation
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture
- **[docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)** - 70 tables, 19 RPC functions

### Latest Features (Nov 5, 2025)
- **[docs/features/location.md](docs/features/location.md)** - District lookup & feed filtering
- **[docs/features/analytics.md](docs/features/analytics.md)** - Analytics dashboard (6 charts)
- **[docs/guides/USER_GUIDE_LOCATION_FEATURES.md](docs/guides/USER_GUIDE_LOCATION_FEATURES.md)** - User guide
- **[docs/guides/ADMIN_GUIDE_ANALYTICS.md](docs/guides/ADMIN_GUIDE_ANALYTICS.md)** - Admin guide

### Implementation Notes
- **[scratch/library-audit-nov2025/](scratch/library-audit-nov2025/)** - Detailed implementation history

---

## ✨ Key Features

- ✅ **Privacy-First** - 16 privacy controls, all opt-in, GDPR/CCPA compliant
- ✅ **District Filtering** - See civic content relevant to your congressional district
- ✅ **Equal Voting** - All votes count equally (no weighting)
- ✅ **Trust Tiers** - T0-T3 verification for analytics only
- ✅ **Analytics Dashboard** - Comprehensive insights for admins (6 chart types)
- ✅ **PWA** - Install as native app, offline-first
- ✅ **WebAuthn** - Passwordless authentication

---

## 🏗️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript, Tailwind CSS
- **State**: Zustand stores
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Charts**: Recharts
- **Auth**: WebAuthn, passkeys
- **Deployment**: Vercel

---

## 📊 Project Status

**Overall Progress**: 85%

| Component | Status |
|-----------|--------|
| Privacy System | ✅ 100% |
| Location Features | ✅ 100% |
| Analytics Dashboard | ✅ 85% |
| Polling System | ✅ 100% |
| Trust Tiers | ✅ 100% |
| Civic Engagement | ✅ 100% |
| PWA | ✅ 100% |

**What's Left**: Real API endpoints (15%), widget system implementation, caching

---

## 👥 For New Developers

1. Read [docs/README.md](docs/README.md)
2. Read [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
3. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
4. Check [docs/DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md)
5. Review [scratch/library-audit-nov2025/](scratch/library-audit-nov2025/) for implementation details

---

## 🔒 Privacy & Security

- **Privacy Policy**: [docs/PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md)
- **Security**: [docs/SECURITY.md](docs/SECURITY.md)
- **Trust Tiers**: [docs/TRUST_TIER_DESIGN.md](docs/TRUST_TIER_DESIGN.md)

**Key Principles**:
- Opt-in data collection (default: nothing collected)
- K-anonymity enforcement (min 5 users per group)
- District-only storage (never full addresses)
- GDPR/CCPA compliant export & deletion

---

## 🤝 Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)

**Quick Standards**:
- Follow [docs/LINT_STANDARDS.md](docs/LINT_STANDARDS.md)
- Zero lint errors required
- Privacy-first always
- Document everything

---

## 📝 License

See [LICENSE](LICENSE)

---

## 📞 Links

- **Documentation**: [docs/](docs/)
- **Implementation Notes**: [scratch/library-audit-nov2025/](scratch/library-audit-nov2025/)
- **Change Log**: [docs/CHANGELOG.md](docs/CHANGELOG.md)

---

**Built with civic responsibility and technical excellence** 🗳️✨


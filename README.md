# Choices - Participatory Democracy Platform

**Status**: ✅ **100% Complete - Production Ready**  
**Last Updated**: November 6, 2025

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

See **[DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md)** for complete guide.

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

---

## 📚 Documentation

### Essential Reading
- **[DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md)** - Deployment guide
- **[docs/FEATURES.md](./docs/FEATURES.md)** - Complete feature list
- **[docs/CURRENT_STATUS.md](./docs/CURRENT_STATUS.md)** - Current status
- **[docs/WIDGET_SYSTEM.md](./docs/WIDGET_SYSTEM.md)** - Widget dashboard docs
- **[docs/API_CHANGES.md](./docs/API_CHANGES.md)** - API consolidation

### For Developers
- **[docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Setup and development
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System architecture
- **[docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)** - Database schema

### For Compliance
- **[docs/PRIVACY_POLICY.md](./docs/PRIVACY_POLICY.md)** - Privacy policy
- **[docs/SECURITY.md](./docs/SECURITY.md)** - Security practices
- **[docs/VOTING_INTEGRITY_POLICY.md](./docs/VOTING_INTEGRITY_POLICY.md)** - Voting integrity

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

- **License**: See [LICENSE](./LICENSE)
- **Code of Conduct**: Open-source, bias-free
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

---

## 📞 Support

- **Documentation**: See `/docs` directory
- **Deployment**: See `DEPLOYMENT_READY.md`
- **Issues**: Check current status in `docs/CURRENT_STATUS.md`

---

## 🎉 Status

**The Choices platform is 100% complete and ready for production deployment!**

- ✅ All features implemented
- ✅ Zero errors
- ✅ Comprehensive documentation
- ✅ Production tested
- ✅ Ready to deploy

---

**Built with** ❤️ **for participatory democracy**  
**Last Updated**: November 6, 2025  
**Version**: 1.0.0 (Production Ready)

🚀 **DEPLOY NOW!**

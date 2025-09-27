# Choices - Democratic Platform

**Created:** January 19, 2025  
**Status:** Active Development - Enhanced MVP Implementation  
**Purpose:** Democratic platform for local candidate discovery and community voting

---

## 🎯 **Project Overview**

Choices is a privacy-first democratic platform that levels the playing field for all candidates. We provide equal access to local representatives and enable community-driven voting on important issues.

### **Core Features**
- ✅ **Progressive Web App (PWA)** - Native app-like experience
- ✅ **WebAuthn Authentication** - Biometric and passkey support
- ✅ **Admin Dashboard** - Comprehensive admin controls
- ✅ **Enhanced Feedback System** - Multi-step feedback collection
- ✅ **Enhanced Onboarding** - 9-step comprehensive user setup
- ✅ **Poll Management** - Create, vote, and moderate community polls
- ✅ **Privacy-First Design** - User data stays on device when possible

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 22.19.0+ (use Volta for version management)
- npm 10.9.3+
- Supabase account and project

### **Setup**
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
cd web && npm run dev
```

### **Documentation**
- 📖 **[Complete Onboarding Guide](docs/ONBOARDING.md)** - Project setup and development
- 🎯 **[Master Documentation](docs/MASTER_DOCUMENTATION.md)** - Complete documentation index
- 🗺️ **[Master Implementation Roadmap](docs/implementation/MASTER_IMPLEMENTATION_ROADMAP.md)** - Current development status
- 🧪 **[Unified Playbook](docs/UNIFIED_PLAYBOOK.md)** - Complete system documentation
- 🏗️ **[System Architecture](docs/COMPREHENSIVE_SYSTEM_ARCHITECTURE_DISCOVERY.md)** - Technical architecture

---

## 📁 **Project Structure**

```
Choices/
├── docs/                              # All documentation
│   ├── implementation/                # Current implementation guides
│   ├── future-features/              # Future feature documentation
│   └── *.md                          # Core documentation
├── web/                              # Next.js application
│   ├── app/                          # App Router pages
│   ├── components/                   # React components
│   ├── lib/                          # Utilities and configurations
│   ├── tests/e2e/                    # End-to-end tests
│   └── public/                       # Static assets
├── supabase/                         # Database schema and migrations
├── scratch/                          # Temporary files (clean regularly)
└── archive/                          # Completed and obsolete features
```

---

## 🧪 **Testing**

### **E2E Testing**
```bash
# Run all E2E tests
cd web && npm run test:e2e

# Run specific test suites
npm run test:e2e -- --grep "Enhanced Onboarding"
npm run test:e2e -- --grep "User Journeys"
```

### **Test Coverage**
- ✅ **Authentication Flows** - Login, registration, WebAuthn
- ✅ **User Journeys** - Complete workflows from registration to voting
- ✅ **Poll Management** - Creation, voting, moderation
- ✅ **Feature Flags** - All enabled/disabled states
- ✅ **PWA Features** - Installation, offline, notifications
- ✅ **Admin Functions** - Admin dashboard and controls

---

## 🏗️ **Current Development Status**

### **🟢 Production Ready (MVP)**
- Core authentication with WebAuthn
- Basic poll creation and voting
- Admin dashboard
- PWA functionality
- Enhanced feedback system
- Enhanced onboarding (9-step flow)

### **🟡 Enhanced Features (In Progress)**
- Enhanced profile management
- Enhanced authentication system
- Enhanced dashboard with analytics

### **🔴 Future Features**
- Automated poll generation
- Advanced privacy features
- Social sharing integration
- Civics address lookup

---

## 🔧 **Development Guidelines**

### **For Agents**
- 📋 **Follow the [Master Implementation Roadmap](docs/implementation/MASTER_IMPLEMENTATION_ROADMAP.md)**
- 🧪 **Ensure complete E2E testing** before marking features complete
- 📁 **Use `/scratch/` directory** for temporary files
- 📚 **Update documentation** after each major implementation
- 🗑️ **Clean up obsolete files** to maintain project clarity

### **Code Standards**
- TypeScript strict mode
- ESLint configuration
- Comprehensive E2E testing
- Feature flag driven development
- Privacy-first architecture

---

## 📊 **Feature Flags**

The platform uses a comprehensive feature flag system to control feature rollout:

```typescript
// Core MVP features (always enabled)
CORE_AUTH: true
CORE_POLLS: true
WEBAUTHN: true
PWA: true
ADMIN: true

// Enhanced MVP features (ready for implementation)
ENHANCED_ONBOARDING: true
ENHANCED_PROFILE: false
ENHANCED_AUTH: false

// Future features (development required)
SOCIAL_SHARING: false
AUTOMATED_POLLS: false
```

See [Feature Flags Documentation](docs/implementation/FEATURE_FLAGS_DOCUMENTATION.md) for complete details.

---

## 🤝 **Contributing**

1. **Read the documentation** - Start with [ONBOARDING.md](docs/ONBOARDING.md)
2. **Follow the roadmap** - Check [Master Implementation Roadmap](docs/implementation/MASTER_IMPLEMENTATION_ROADMAP.md)
3. **Write comprehensive tests** - E2E testing is required
4. **Update documentation** - Keep docs current with changes
5. **Use feature flags** - Enable features gradually

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 **Support**

For questions or issues:
- Check the [Unified Playbook](docs/UNIFIED_PLAYBOOK.md) for comprehensive guidance
- Review the [Master Implementation Roadmap](docs/implementation/MASTER_IMPLEMENTATION_ROADMAP.md) for current status
- Use the [scratch directory](scratch/) for temporary files during development
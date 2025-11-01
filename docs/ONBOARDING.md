# 🚀 Choices Project Onboarding Guide

**Created:** January 21, 2025  
**Status:** Production Ready  
**Purpose:** Complete onboarding guide for new developers and AI agents

---

## 🎯 **Quick Start**

### **Prerequisites**
- Node.js 22.19.0+ (use Volta for version management)
- npm 10.9.3+
- Supabase account and project
- Git

### **Setup Steps**
```bash
# 1. Clone the repository
git clone <repository-url>
cd Choices

# 2. Install dependencies
npm install
cd web && npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Run development server
cd web && npm run dev
```

---

## 📁 **Project Structure**

```
Choices/
├── docs/                              # All documentation
│   ├── core/                          # Core system documentation
│   ├── implementation/                # Implementation guides
│   ├── future-features/              # Future feature docs
│   └── getting-started/               # Getting started guides
├── web/                              # Next.js application
│   ├── app/                          # App Router pages
│   ├── components/                   # React components
│   ├── lib/                          # Utilities and configurations
│   ├── shared/                       # Shared utilities
│   ├── tests/                        # Test files
│   └── public/                       # Static assets
├── supabase/                         # Database schema and migrations
├── scratch/                          # Temporary files (clean regularly)
└── archive/                          # Completed and obsolete features
```

---

## 🏗️ **Current Implementation Status**

### **✅ PRODUCTION READY (MVP)**
- **Core Authentication** - WebAuthn + Password authentication
- **Core Polls** - Basic poll creation and voting
- **Core Users** - User management and profiles
- **Admin Dashboard** - Comprehensive admin controls
- **PWA Features** - Progressive Web App functionality
- **Enhanced Feedback** - Multi-step feedback collection

### **🟡 ENHANCED FEATURES (Ready for Implementation)**
- **Enhanced Onboarding** - 9-step comprehensive onboarding flow
- **Enhanced Profile** - Advanced profile management with privacy controls
- **Enhanced Dashboard** - User-centric analytics dashboard
- **Enhanced Polls** - 4-step poll wizard with 6 voting methods
- **Enhanced Voting** - Advanced voting system with offline support

### **🔴 FUTURE FEATURES (Development Required)**
- **Automated Polls** - AI-powered poll generation
- **Advanced Privacy** - Zero-knowledge proofs, differential privacy
- **Social Sharing** - Comprehensive social media integration
- **Civics Address Lookup** - Representative database integration

---

## 🧪 **Testing**

### **Test Structure**
```
web/tests/
├── unit/           # Unit tests (Jest)
│   ├── vote/       # Vote processing tests
│   ├── irv/        # IRV calculator tests
│   └── lib/        # Library tests
├── e2e/            # End-to-end tests (Playwright)
│   ├── helpers/    # E2E test helpers
│   ├── setup/      # Global setup
│   └── *.spec.ts   # E2E test files
└── integration/    # Integration tests
```

### **Running Tests**
```bash
# Unit tests
cd web && npm run test

# E2E tests
cd web && npm run test:e2e

# All tests
cd web && npm run test:all
```

### **Test Status**
- **Unit Tests**: ✅ All passing (VoteProcessor, VoteValidator fixed)
- **E2E Tests**: 🔄 17 failing tests (civics API, form hydration, navigation issues)
- **Integration Tests**: ✅ Limited coverage, working

---

## 🔧 **Development Guidelines**

### **For AI Agents**
1. **Read this onboarding guide first**
2. **Check the [Master Implementation Roadmap](docs/implementation/MASTER_IMPLEMENTATION_ROADMAP.md)**
3. **Review the [System Architecture](docs/core/SYSTEM_ARCHITECTURE.md)**
4. **Read the [Supabase Client Usage Guide](docs/DEVELOPER_GUIDE_SUPABASE_CLIENT.md)**
5. **Use feature flags for new features**
6. **Write comprehensive E2E tests**
7. **Update documentation after changes**

### **Code Standards**
- TypeScript strict mode
- ESLint configuration (no-restricted-syntax for object spreads)
- Comprehensive E2E testing
- Feature flag driven development
- Privacy-first architecture
- **Supabase Client Usage**: Use `getSupabaseBrowserClient()` for client-side, `getSupabaseServerClient()` for server-side

### **File Organization**
- Use `/scratch/` directory for temporary files
- Clean up obsolete files regularly
- Update documentation after major changes
- Follow the established project structure

---

## 🚨 **Critical Issues & Solutions**

### **1. E2E Test Failures (17 failing)**
**Issues:**
- Missing jurisdiction cookies (`cx_jurisdictions`)
- API timeouts on `/api/v1/civics/address-lookup`
- Form elements not found (`[data-testid="email"]`)
- Navigation issues (expecting `/dashboard` but getting `/onboarding?step=complete`)

**Solutions:**
- Fix civics API integration
- Resolve form hydration issues
- Complete onboarding flow properly
- Set up test data correctly

### **2. Documentation Gaps**
**Issues:**
- README references non-existent files
- Outdated API documentation
- Missing implementation details

**Solutions:**
- Create missing documentation files
- Update API documentation
- Align docs with current implementation

---

## 📚 **Key Documentation Files**

### **Core Documentation**
- **[System Architecture](docs/core/SYSTEM_ARCHITECTURE.md)** - Technical architecture
- **[Project Overview](docs/core/PROJECT_COMPREHENSIVE_OVERVIEW.md)** - Complete project status
- **[Feature Flags](docs/core/FEATURE_FLAGS_COMPREHENSIVE.md)** - Feature flag system
- **[Authentication](docs/core/AUTHENTICATION_COMPREHENSIVE.md)** - Auth system details

### **Implementation Guides**
- **[Master Roadmap](docs/implementation/MASTER_IMPLEMENTATION_ROADMAP.md)** - Development roadmap
- **[Implementation Summary](docs/implementation/IMPLEMENTATION_SUMMARY.md)** - Current status
- **[Test Audit](docs/implementation/E2E_TEST_AUDIT.md)** - Test status and issues

### **Getting Started**
- **[Getting Started Guide](docs/getting-started/README.md)** - Basic setup
- **[Contributing Guide](docs/CONTRIBUTING.md)** - Contribution guidelines

---

## 🎯 **Next Steps for New Agents**

### **1. Understand Current Status**
- Read this onboarding guide
- Review the [Master Implementation Roadmap](docs/implementation/MASTER_IMPLEMENTATION_ROADMAP.md)
- Check the [Test Audit](docs/implementation/E2E_TEST_AUDIT.md)

### **2. Identify Priorities**
- Fix E2E test failures (17 tests)
- Update documentation gaps
- Implement enhanced features
- Clean up obsolete code

### **3. Follow Best Practices**
- Use feature flags for new features
- Write comprehensive tests
- Update documentation
- Follow TypeScript standards

---

## 🔄 **Development Workflow**

### **1. Before Starting Work**
- Check current test status
- Review feature flags
- Understand current implementation
- Plan your approach

### **2. During Development**
- Use feature flags for new features
- Write tests as you develop
- Update documentation
- Follow code standards

### **3. After Completing Work**
- Run all tests
- Update documentation
- Clean up temporary files
- Verify feature flags

---

## 📞 **Support & Resources**

### **Documentation**
- [Master Implementation Roadmap](docs/implementation/MASTER_IMPLEMENTATION_ROADMAP.md)
- [System Architecture](docs/core/SYSTEM_ARCHITECTURE.md)
- [Test Audit](docs/implementation/E2E_TEST_AUDIT.md)

### **Development**
- Use `/scratch/` directory for temporary files
- Follow the established project structure
- Update documentation after changes
- Use feature flags for new features

---

**Last Updated:** January 21, 2025  
**Version:** 1.0.0  
**Status:** 🎉 **PRODUCTION READY - COMPREHENSIVE ONBOARDING GUIDE**

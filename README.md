# 🗳️ Choices Platform - Democratic Equalizer

**A privacy-first platform that levels the playing field for all candidates and exposes who's really bought off**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.32-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)

## 🎯 **Our Mission: Democratic Revolution**

**Citizens United broke democracy. We're fixing it.**

The Choices Platform is a **democratic equalizer** that levels the playing field for all candidates regardless of funding, exposes "bought off" politicians, and creates true accountability in our democracy.

### 🏛️ **What We're Building**
- **Equal Representation Space** - All candidates get equal voice regardless of funding
- **Campaign Finance Transparency** - Real-time exposure of who's buying whom
- **"Walk the Talk" Analysis** - Track promises vs. actions with AI-powered accountability
- **Geographic Electoral Feeds** - Complete candidate landscape for your area
- **Privacy-First Architecture** - Zero-knowledge analytics protecting user data

## 🚀 **Status: PRODUCTION READY - ALL TYPESCRIPT ERRORS RESOLVED!**

The Choices platform has achieved **perfect TypeScript compilation with 0 errors** and is ready for production deployment. We've built the most comprehensive democratic accountability system ever created, with privacy-first architecture and equal access for all candidates.

### ✅ **What's Working**
- **Multi-Source Data Integration** - 6 API clients with comprehensive government data coverage
- **Campaign Finance Transparency** - Real-time FEC and OpenSecrets integration
- **Geographic Electoral Feeds** - Location-based candidate information system
- **Equal Access Platform** - Verified candidate communication channels
- **Privacy-First Architecture** - Zero-knowledge analytics with client-side encryption
- **"Bought Off" Indicators** - AI-powered analysis of corporate influence
- **Complete Build Process** - Zero build errors, perfect TypeScript compilation
- **Comprehensive Security** - Multi-layer security with pre-commit hooks and CI

## 🎯 **Quick Start**

### Prerequisites
- Node.js 22.x
- npm 10.9.3
- Supabase account (for backend)

### Installation
```bash
# Clone the repository
git clone https://github.com/choices-project/choices.git
cd choices

# Install dependencies
npm install

# Set up environment variables
cd web
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

### Build for Production
```bash
# Build the application
cd web
npm run build

# Start production server
npm start
```

## 🏗️ **Architecture**

### **Democratic Equalizer System**
```
choices/
├── web/                           # Next.js frontend application
│   ├── app/                      # App Router pages and API routes
│   ├── components/               # React components
│   ├── features/                 # Feature-based organization
│   │   ├── auth/                 # Authentication system
│   │   ├── civics/               # Civics data integration
│   │   ├── polls/                # Polling system
│   │   └── webauthn/             # WebAuthn implementation
│   ├── lib/                      # Core platform libraries
│   │   ├── integrations/         # Multi-source API integration
│   │   │   ├── congress-gov/     # Official federal data
│   │   │   ├── open-states/      # State legislature data
│   │   │   ├── fec/              # Campaign finance data
│   │   │   ├── opensecrets/      # Enhanced financial analysis
│   │   │   ├── google-civic/     # Local officials and elections
│   │   │   └── govtrack/         # Congressional tracking
│   │   ├── electoral/            # Electoral system components
│   │   │   ├── geographic-feed.ts # Location-based candidate feeds
│   │   │   ├── candidate-verification.ts # Equal access verification
│   │   │   └── financial-transparency.ts # "Bought off" analysis
│   │   └── privacy/              # Privacy-first architecture
│   │       ├── encryption.ts     # Client-side encryption
│   │       ├── zero-knowledge.ts # Zero-knowledge analytics
│   │       └── differential-privacy.ts # Privacy-preserving analytics
│   ├── shared/                   # Shared utilities and components
│   ├── hooks/                    # React hooks
│   └── utils/                    # Helper functions
├── docs/                         # Comprehensive documentation
├── scripts/                      # Build and deployment scripts
├── tests/                        # Test configuration and utilities
├── supabase/                     # Database migrations and config
└── policy/                       # Security and governance policies
```

### **Technology Stack**
- **Frontend**: Next.js 14.2.32 with App Router
- **Language**: TypeScript 5.7.2
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Data Sources**: Congress.gov, Open States, FEC, OpenSecrets, Google Civic, GovTrack
- **Privacy**: Client-side encryption, zero-knowledge analytics, differential privacy
- **Testing**: Playwright (E2E), Jest (Unit)
- **Deployment**: Vercel with GitHub Actions CI

## 🔧 **Development**

### **Available Scripts**
```bash
# Development (from web/ directory)
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm run test             # Run unit tests
npm run test:e2e         # Run end-to-end tests
npm run test:coverage    # Generate test coverage

# Code Quality
npm run lint             # Run ESLint
npm run lint:strict      # Run strict linting
npm run type-check       # Run TypeScript checks
npm run type-check:strict # Run strict type checking

# Security
npm run security-check   # Run security checks
npm run audit:high       # Run security audit
```

### **Environment Variables**
Create a `.env.local` file in the `web/` directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Configuration
NEXTAUTH_SECRET=your_nextauth_secret
JWT_SECRET=your_jwt_secret
```

## 🧪 **Testing**

### **Running Tests**
```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test with UI
npm run test:e2e:ui
```

### **Test Coverage**
The project includes comprehensive testing:
- **Unit Tests** - Component and utility testing with Jest
- **E2E Tests** - Full user journey testing with Playwright
- **Integration Tests** - API and database testing
- **Security Tests** - Automated security scanning

## 🚀 **Deployment**

### **Vercel (Recommended)**
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on PR merge to main

### **Deployment Pipeline**
- **CI**: GitHub Actions with comprehensive checks
- **Security**: Pre-commit hooks, gitleaks, CodeQL
- **Quality**: TypeScript, ESLint, build validation
- **Deployment**: Vercel with branch protection

## 🔒 **Security**

### **Multi-Layer Security**
- **Pre-commit Hooks** - Context-aware security scanning
- **CI Security** - Automated security audits and secret detection
- **Code Quality** - Strict linting and type checking
- **Database Security** - Row Level Security (RLS) policies
- **Authentication** - Supabase Auth with biometric support

### **Security Features**
- **Secret Detection** - Prevents credential commits
- **Dependency Scanning** - Regular security audits
- **Code Analysis** - Static analysis with CodeQL
- **Access Control** - Comprehensive RLS policies

## 📚 **Documentation**

### **Core Documentation**
- **[Democratic Equalizer Vision](scratch/agent-e/DEMOCRATIC_EQUALIZER_ARCHITECTURE.md)** - Complete platform vision and architecture
- **[Privacy-First Architecture](scratch/agent-e/PRIVACY_FIRST_ARCHITECTURE.md)** - Zero-knowledge privacy protection
- **[Comprehensive AI Assessment](scratch/agent-e/COMPREHENSIVE_AI_ASSESSMENT.md)** - Complete system assessment for implementation
- **[Multi-Source Data Integration](scratch/agent-e/UNIFIED_DATA_ARCHITECTURE.md)** - Comprehensive data source strategy
- **[Project Status](docs/PROJECT_STATUS.md)** - Current development status
- **[System Architecture](docs/SYSTEM_ARCHITECTURE_OVERVIEW.md)** - High-level system design

### **Development Documentation**
- **[Developer Onboarding](docs/development/ONBOARDING.md)** - Setup and development guide
- **[Testing Guide](docs/testing/COMPREHENSIVE_TESTING_GUIDE.md)** - Testing procedures
- **[Contributing Guide](docs/CONTRIBUTING.md)** - Contribution guidelines
- **[Security Guide](docs/SECURITY.md)** - Security best practices

### **Feature Documentation**
- **[Civics Integration](CIVICS_INGEST_INTEGRATION_COMPLETE.md)** - Civics data system
- **[Deployment System](DEPLOYMENT_SYSTEM_FINAL_CONFIGURATION.md)** - Deployment pipeline
- **[Pre-commit System](PRECOMMIT_SYSTEM_DOCUMENTATION.md)** - Security hooks

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run pre-commit hooks (automatic)
5. Add tests for new functionality
6. Submit a pull request

### **Code Standards**
- **TypeScript** - Full type safety
- **ESLint** - Strict code quality
- **Prettier** - Consistent formatting
- **Security** - Comprehensive security checks

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Issues** - [GitHub Issues](https://github.com/choices-project/choices/issues)
- **Discussions** - [GitHub Discussions](https://github.com/choices-project/choices/discussions)
- **Documentation** - [Project Docs](docs/)

---

## 🗳️ **The Democratic Revolution Starts Here**

**Citizens United broke democracy. We're fixing it.**

The Choices Platform is building the most comprehensive democratic accountability system ever created. We're leveling the playing field for all candidates, exposing "bought off" politicians, and creating true accountability in our democracy.

**Join the revolution. Take back democracy.**

---

**Built with ❤️ for democratic revolution**

**Last Updated:** 2025-09-16  
**Status:** Production Ready - All TypeScript Errors Resolved  
**Version:** 3.0.0 - Democratic Equalizer  
**Build Status:** ✅ 0 errors, perfect compilation

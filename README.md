# Choices Platform

**A privacy-first, unbiased polling platform for democratic participation**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.32-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)

## 🚀 **Status: PRODUCTION READY**

The Choices platform is now in a **clean, production-ready state** with comprehensive security, clean architecture, and efficient deployment pipeline. All systems are functional and ready for production deployment.

### ✅ **What's Working**
- **Complete Build Process** - Zero build errors, perfect TypeScript compilation
- **Comprehensive Security** - Multi-layer security with pre-commit hooks and CI
- **Clean Architecture** - Feature-based organization with proper separation of concerns
- **Efficient Deployment** - Vercel + GitHub Actions with no duplication
- **Civics Integration** - Complete civics data ingestion system
- **Testing Framework** - Comprehensive E2E and unit testing

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

### **Monorepo Structure**
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
- **[Project Status](docs/PROJECT_STATUS.md)** - Current development status
- **[System Architecture](docs/SYSTEM_ARCHITECTURE_OVERVIEW.md)** - High-level system design
- **[Authentication System](docs/AUTHENTICATION_SYSTEM.md)** - Auth implementation
- **[Database Schema](docs/DATABASE_SECURITY_AND_SCHEMA.md)** - Database structure
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Deployment instructions

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

**Built with ❤️ for democratic participation**

**Last Updated:** December 19, 2024  
**Status:** Production Ready  
**Version:** 2.0.0

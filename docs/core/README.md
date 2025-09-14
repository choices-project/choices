# Choices Platform

**Status:** 🚀 **PRODUCTION READY - Supabase Auth Complete**  
*Last Updated: 2025-09-09*

A modern, democratic platform built with Next.js 14 and Supabase Auth, designed to provide secure, scalable voting and polling capabilities with a clean, maintainable architecture.

## 🎯 **Current Status**

### **✅ Supabase Auth Implementation Complete**
- **Exclusive Supabase Auth** - No dual authentication systems
- **Clean Database Schema** - Fresh Supabase database with proper user_profiles table
- **Zero Build Errors** - Production-ready codebase with clean TypeScript
- **Version Pinning** - Exact Node.js (22.19.0) and package versions for stability
- **Environment Configuration** - All Supabase credentials properly configured

### **✅ Production-Ready Features**
- **Secure Authentication** - Email/password with Supabase Auth
- **User Management** - Complete user registration, login, and profile management
- **API Routes** - All endpoints operational with proper error handling
- **Database Security** - Row Level Security (RLS) policies enabled
- **Clean Codebase** - No outdated files, proper logging, type safety

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 22.19.0 (exact version)
- npm
- Supabase account and project

### **Installation**
```bash
# Clone the repository
git clone <repository-url>
cd Choices

# Use the correct Node.js version (if using nvm)
nvm use

# Install dependencies
npm install

# Set up environment variables
node scripts/setup-supabase-env.js

# Edit web/.env.local with your Supabase credentials
nano web/.env.local

# Clear database for fresh start (optional)
node scripts/clear-supabase-database.js

# Start development server
cd web
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📚 **Documentation**

All documentation is organized in the `docs/` directory:

### **Core Documentation**
- [`docs/SETUP.md`](docs/SETUP.md) - Complete setup and installation guide
- [`docs/AUTHENTICATION_SYSTEM.md`](docs/AUTHENTICATION_SYSTEM.md) - Supabase Auth system documentation
- [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md) - Production deployment guide
- [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) - Current project status

### **Development**
- [`docs/development/ONBOARDING.md`](docs/development/ONBOARDING.md) - Developer onboarding guide
- [`docs/development/DEVELOPER_CHEAT_SHEET.md`](docs/development/DEVELOPER_CHEAT_SHEET.md) - Useful commands and tools
- [`docs/testing/CURRENT_TESTING_GUIDE.md`](docs/testing/CURRENT_TESTING_GUIDE.md) - Testing guide

### **Technical**
- [`docs/SYSTEM_ARCHITECTURE_OVERVIEW.md`](docs/SYSTEM_ARCHITECTURE_OVERVIEW.md) - System architecture
- [`docs/DATABASE_SECURITY_AND_SCHEMA.md`](docs/DATABASE_SECURITY_AND_SCHEMA.md) - Database documentation
- [`docs/technical/USER_GUIDE.md`](docs/technical/USER_GUIDE.md) - User documentation

### **Governance & Security**
- [`docs/governance/CODE_OF_CONDUCT.md`](docs/governance/CODE_OF_CONDUCT.md) - Code of conduct
- [`docs/governance/CONTRIBUTING.md`](docs/governance/CONTRIBUTING.md) - Contribution guidelines
- [`docs/security/SECURITY.md`](docs/security/SECURITY.md) - Security documentation

### **Summaries**
- [`docs/summaries/SUPABASE_AUTH_DEPLOYMENT_READY_SUMMARY.md`](docs/summaries/SUPABASE_AUTH_DEPLOYMENT_READY_SUMMARY.md) - Deployment summary
- [`docs/summaries/PROJECT_CLEANUP_COMPLETE.md`](docs/summaries/PROJECT_CLEANUP_COMPLETE.md) - Project cleanup summary

## 🏗️ **Architecture**

### **Technology Stack**
- **Frontend**: Next.js 14, React 18, TypeScript
- **Authentication**: Supabase Auth (exclusive)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: Zustand
- **Data Fetching**: TanStack Query

### **Project Structure**
```
Choices/
├── web/                    # Next.js application
├── packages/               # Monorepo packages
│   ├── civics-schemas/     # Civics data schemas
│   ├── civics-sources/     # Civics data sources
│   └── civics-client/      # Civics client library
├── docs/                   # Documentation
├── scripts/                # Utility scripts
└── README.md              # This file
```

## 🔧 **Development**

### **Available Scripts**
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks

# Database
node scripts/clear-supabase-database.js    # Clear database
node scripts/setup-supabase-env.js         # Setup environment
```

### **Environment Variables**
Required Supabase environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 🚀 **Deployment**

The platform is ready for production deployment. See [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

### **Vercel Deployment (Recommended)**
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## 📋 **Features**

### **Authentication & User Management**
- ✅ User registration and login
- ✅ Email/password authentication
- ✅ User profile management
- ✅ Secure session handling
- ✅ Row Level Security (RLS)

### **Platform Features**
- ✅ Poll creation and management
- ✅ Voting system
- ✅ User dashboard
- ✅ Analytics and reporting
- ✅ Mobile responsive design

### **Security**
- ✅ Supabase Auth integration
- ✅ Row Level Security policies
- ✅ Secure API routes
- ✅ Input validation and sanitization
- ✅ Error handling and logging

## 🤝 **Contributing**

We welcome contributions! Please see [`docs/governance/CONTRIBUTING.md`](docs/governance/CONTRIBUTING.md) for guidelines.

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Documentation**: Check the `docs/` directory for comprehensive guides
- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Security**: Report security issues privately

---

**Status: ✅ PRODUCTION READY - Supabase Auth Implementation Complete**
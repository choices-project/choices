# Choices Platform

**Status:** 🔄 **REBUILD IN PROGRESS - Phase 2 Complete**  
**Branch:** `fix/auth-system-cleanup`  
**Last Updated:** January 8, 2025

A modern, democratic platform built with Next.js 14, designed to break the duopoly by creating user-centric, open candidate platforms. Currently undergoing a comprehensive rebuild to establish a clean, maintainable foundation.

## 🎯 **Current Status**

### **✅ Phase 1 Complete: Database Nuke**
- **4 clean tables** created with Supabase Auth integration
- **25+ complex tables** removed (84% reduction)
- **Advanced auth features** safely archived (WebAuthn, Device Flow)
- **RLS policies** enabled with proper type casting

### **✅ Phase 2 Complete: Code Cleanup**
- **TypeScript interfaces** updated with proper type casting
- **Logger integration** properly implemented
- **Environment variables** updated to new Supabase format
- **Custom JWT system** completely removed
- **Documentation** cleaned and updated

### **🔄 Phase 3 In Progress: Rebuild**
- **Clean API routes** implementation
- **Trust tier system** proper integration
- **End-to-end testing** verification

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 22.x
- npm
- Supabase account

### **Setup**
```bash
# Clone the repository
git clone <repository-url>
cd Choices

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

### **Environment Variables**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_secret_key
```

## 🏗️ **Architecture**

### **Database Schema (Clean)**
```
user_profiles (linked to auth.users)
├── id, user_id, username, email, trust_tier
├── avatar_url, bio, is_active
└── created_at, updated_at

polls (linked to auth.users)
├── id, title, description, options
├── voting_method, created_by, status
├── privacy_level, total_votes
└── start_time, end_time

votes (linked to auth.users)
├── id, poll_id, user_id
├── selected_options, ip_address
└── user_agent, created_at

error_logs (linked to auth.users)
├── id, user_id, error_type
├── error_message, stack_trace
└── context, severity
```

### **Technology Stack**
- **Frontend:** Next.js 14, React, TypeScript
- **Backend:** Supabase (Auth, Database, RLS)
- **Styling:** Tailwind CSS
- **Testing:** Jest, Playwright
- **Deployment:** Vercel

## 📁 **Project Structure**

```
├── web/                    # Next.js application
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── lib/               # Utilities and configurations
│   ├── types/             # TypeScript type definitions
│   └── archive/           # Archived features (WebAuthn, Device Flow)
├── docs/                  # Documentation
│   ├── removed-features/  # Documentation for removed features
│   └── legal/             # Legal documents
├── scripts/               # Utility scripts
└── packages/              # Monorepo packages
```

## 🔧 **Development**

### **Available Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
npm run test         # Run tests
npm run test:e2e     # Run end-to-end tests
```

### **Code Quality**
- **TypeScript:** Strict type checking enabled
- **ESLint:** Configured with Next.js rules
- **Prettier:** Code formatting
- **Husky:** Pre-commit hooks

## 🔒 **Security**

- **Supabase Auth:** Built-in authentication and authorization
- **RLS Policies:** Row-level security for data protection
- **Environment Variables:** Secure configuration management
- **Type Safety:** TypeScript for runtime safety

## 📚 **Documentation**

- **[Current Status](CURRENT_REBUILD_STATUS.md)** - Detailed project status
- **[Rebuild Plan](COMPLETE_REBUILD_PLAN.md)** - Comprehensive rebuild strategy
- **[Setup Guide](docs/SETUP.md)** - Development setup instructions
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[Security Guide](SECURITY.md)** - Security overview

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Issues:** [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-repo/discussions)
- **Documentation:** [Project Documentation](docs/)

---

**Status:** Ready for Phase 3 implementation with clean, maintainable foundation.
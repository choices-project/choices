# 🛠️ Development Guide

**Complete Development Setup and Workflow for Choices Platform**

---

## 🎯 **Overview**

This guide covers everything you need to know to develop the Choices platform, from initial setup to deployment.

**Last Updated**: October 27, 2025  
**Status**: Production Ready

---

## 🚀 **Quick Start**

### **Prerequisites**
- **Node.js**: 22.19.0 (exact version required)
- **npm**: 10.9.3 (exact version required)
- **Git**: Latest version
- **Supabase Account**: For database and authentication

### **Initial Setup**
```bash
# Clone the repository
git clone https://github.com/choices-project/choices.git
cd choices

# Navigate to web directory
cd web

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit environment variables
# Add your Supabase credentials to .env.local
```

### **Environment Variables**
Create `.env.local` with:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Optional: AI Services
OLLAMA_API_URL=http://localhost:11434
HUGGING_FACE_API_KEY=your_hf_api_key
```

---

## 🏗️ **Development Workflow**

### **Daily Development**
```bash
# Start development server
npm run dev

# In another terminal, run tests in watch mode
npm run test:jest:watch

# Check code quality
npm run lint
npm run type-check
```

### **Before Committing**
```bash
# Run all checks
npm run lint:fix
npm run type-check
npm run test:jest
npm run build

# If everything passes, commit
git add .
git commit -m "Your commit message"
```

---

## 📁 **Project Structure**

```
web/
├── app/                    # Next.js App Router
│   ├── (app)/             # Authenticated routes
│   ├── (landing)/         # Public landing pages
│   ├── api/               # API routes
│   └── auth/              # Authentication pages
├── components/            # Reusable React components
│   ├── ui/                # Basic UI components
│   ├── shared/            # Shared components
│   └── business/           # Business logic components
├── features/              # Feature-specific code
│   ├── auth/              # Authentication feature
│   ├── polls/             # Polling feature
│   ├── analytics/         # Analytics feature
│   └── civics/            # Civic engagement feature
├── lib/                   # Utilities and services
│   ├── auth/              # Authentication utilities
│   ├── database/          # Database utilities
│   ├── ai/                # AI service integrations
│   └── utils/             # General utilities
├── tests/                 # Test suites
│   ├── jest/              # Unit tests
│   ├── playwright/        # E2E tests
│   └── helpers/           # Test utilities
└── docs/                  # Documentation
```

---

## 🔧 **Development Commands**

### **Core Commands**
```bash
# Development
npm run dev                # Start development server
npm run build              # Build for production
npm run start              # Start production server

# Code Quality
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint issues
npm run type-check         # Run TypeScript checks

# Testing
npm run test:jest          # Run unit tests
npm run test:jest:watch    # Run tests in watch mode
npm run test:ci            # Run all tests for CI
```

### **E2E Testing**
```bash
# Start dev server first
npm run dev

# In another terminal, run E2E tests
npx playwright test tests/playwright/e2e/core/pragmatic-e2e.spec.ts
npx playwright test tests/playwright/e2e/core/authentication-pragmatic.spec.ts
npx playwright test tests/playwright/e2e/core/polls-pragmatic.spec.ts
```

---

## 🗄️ **Database Development**

### **Supabase Setup**
1. **Create Supabase Project**: Go to [supabase.com](https://supabase.com)
2. **Get Credentials**: Copy URL and keys to `.env.local`
3. **Run Migrations**: Apply database schema
4. **Set up RLS**: Configure Row Level Security policies

### **Database Commands**
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Generate types
supabase gen types typescript --local > types/database.ts
```

---

## 🧪 **Testing Strategy**

### **Unit Tests (Jest)**
- **Location**: `tests/jest/`
- **Purpose**: Test individual functions and components
- **Command**: `npm run test:jest`
- **Coverage**: Components, utilities, stores

### **E2E Tests (Playwright)**
- **Location**: `tests/playwright/e2e/`
- **Purpose**: Test complete user journeys
- **Command**: `npx playwright test`
- **Coverage**: Authentication, polls, admin functionality

### **Test Data**
- **Consistent Test Users**: Pre-defined test accounts
- **Mock Data**: Realistic test data for development
- **Database Seeding**: Automated test data setup

---

## 🔐 **Authentication Development**

### **WebAuthn Setup**
1. **Enable WebAuthn**: Configure in Supabase dashboard
2. **Test Credentials**: Use test passkeys for development
3. **Fallback Options**: Email/password and social login

### **Auth Testing**
```bash
# Test authentication flow
npm run test:user-journey-complete

# Test admin authentication
npm run test:admin-journey-complete
```

---

## 📊 **Analytics Development**

### **AI Integration**
- **Ollama**: Local AI for development
- **Hugging Face**: Cloud AI for production
- **Analytics Pipeline**: Real-time data processing

### **Analytics Testing**
```bash
# Test analytics endpoints
curl http://localhost:3000/api/analytics/unified/events

# Test AI integration
curl http://localhost:3000/api/analytics/local-ai/test
```

---

## 🚀 **Deployment**

### **Development Deployment**
```bash
# Deploy to Vercel preview
vercel

# Deploy to production
vercel --prod
```

### **Environment Setup**
- **Development**: `localhost:3000`
- **Preview**: Vercel preview URLs
- **Production**: `choices-platform.vercel.app`

---

## 🐛 **Debugging**

### **Common Issues**
1. **Build Errors**: Check TypeScript errors with `npm run type-check`
2. **Database Issues**: Verify Supabase connection and RLS policies
3. **Auth Issues**: Check WebAuthn configuration and fallbacks
4. **Test Failures**: Run tests individually to isolate issues

### **Debug Tools**
- **Browser DevTools**: React DevTools, Network tab
- **Supabase Dashboard**: Database queries and logs
- **Vercel Dashboard**: Deployment logs and analytics
- **Playwright Debug**: `npx playwright test --debug`

---

## 📚 **Resources**

### **Documentation**
- **[Architecture](ARCHITECTURE.md)** - System design
- **[API Reference](API.md)** - Complete API docs
- **[Database Schema](DATABASE.md)** - Database structure
- **[Security](SECURITY.md)** - Security policies

### **External Resources**
- **[Next.js Docs](https://nextjs.org/docs)** - Next.js documentation
- **[Supabase Docs](https://supabase.com/docs)** - Supabase documentation
- **[Playwright Docs](https://playwright.dev/docs)** - E2E testing
- **[Tailwind CSS](https://tailwindcss.com/docs)** - Styling

---

## 🎯 **Best Practices**

### **Code Quality**
- **TypeScript**: Use strict typing, avoid `any`
- **ESLint**: Follow project linting rules
- **Testing**: Write tests for new features
- **Documentation**: Update docs when changing APIs

### **Git Workflow**
- **Feature Branches**: Create branches for new features
- **Commit Messages**: Use clear, descriptive messages
- **Pull Requests**: Review changes before merging
- **Clean History**: Squash commits when appropriate

### **Performance**
- **Code Splitting**: Use dynamic imports for large components
- **Image Optimization**: Use Next.js Image component
- **Database Queries**: Optimize queries and use indexes
- **Caching**: Implement appropriate caching strategies

---

## 🆘 **Getting Help**

### **Common Solutions**
- **Check Documentation**: Most issues are covered in docs
- **Run Tests**: Tests often reveal the issue
- **Check Logs**: Look at browser console and server logs
- **Search Issues**: Check GitHub issues for similar problems

### **Support Channels**
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and general discussion
- **Documentation**: Comprehensive guides and references

---

**Development Guide Version**: 1.0.0  
**Last Updated**: October 27, 2025  
**Status**: ✅ Production Ready

---

*This guide gives you everything you need to develop the Choices platform effectively.*

# Choices Platform

**A privacy-first, unbiased polling platform for democratic participation**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.31-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)

## 🚀 **Status: DEPLOYMENT READY**

The Choices platform is now in a **clean, deployable state** with all critical SSR issues resolved. The application builds successfully, runs properly in development, and is ready for production deployment.

### ✅ **What's Working**
- **Complete Build Process** - No blocking errors
- **Next.js 14 SSR** - Fully compatible and working
- **Authentication System** - Functional with Supabase
- **API Routes** - All operational
- **Development Environment** - Fully functional
- **Testing Framework** - Comprehensive E2E coverage

## 🎯 **Quick Start**

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for backend)

### Installation
```bash
# Clone the repository
git clone https://github.com/choices-project/choices.git
cd choices

# Install dependencies
cd web
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

### Build for Production
```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🏗️ **Architecture**

### Frontend
- **Next.js 14.2.31** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Supabase** - Backend-as-a-Service

### Backend
- **Supabase** - Database, authentication, and real-time features
- **PostgreSQL** - Primary database
- **Row Level Security (RLS)** - Data protection

### Testing
- **Playwright** - End-to-end testing
- **Jest** - Unit testing framework
- **TypeScript** - Type checking

## 📁 **Project Structure**

```
choices/
├── web/                    # Next.js frontend application
│   ├── app/               # App Router pages and API routes
│   ├── components/        # React components
│   ├── lib/              # Utility libraries
│   ├── utils/            # Helper functions
│   └── tests/            # Test files
├── docs/                 # Documentation
├── scripts/              # Build and deployment scripts
└── supabase/            # Database migrations and config
```

## 🔧 **Development**

### Available Scripts
```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm run test             # Run unit tests
npm run test:e2e         # Run end-to-end tests
npm run test:coverage    # Generate test coverage

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript checks
```

### Environment Variables
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

### Running Tests
```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test with UI
npm run test:e2e:ui
```

### Test Coverage
The project includes comprehensive testing:
- **Unit Tests** - Component and utility testing
- **E2E Tests** - Full user journey testing
- **Integration Tests** - API and database testing

## 🚀 **Deployment**

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main

### Manual Deployment
```bash
# Build the application
npm run build

# Deploy to your preferred platform
# (Vercel, Netlify, AWS, etc.)
```

## 📚 **Documentation**

- **[Project Status](./PROJECT_STATUS.md)** - Current development status
- **[API Documentation](./API.md)** - API endpoints and usage
- **[Authentication System](./AUTHENTICATION_SYSTEM.md)** - Auth implementation
- **[Database Schema](./DATABASE_SECURITY_AND_SCHEMA.md)** - Database structure
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[Testing Guide](./testing/COMPREHENSIVE_TESTING_GUIDE.md)** - Testing procedures

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](../CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 **Support**

- **Issues** - [GitHub Issues](https://github.com/choices-project/choices/issues)
- **Discussions** - [GitHub Discussions](https://github.com/choices-project/choices/discussions)
- **Documentation** - [Project Docs](./)

---

**Built with ❤️ for democratic participation**

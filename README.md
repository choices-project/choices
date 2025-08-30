# Choices Platform

**A privacy-first, unbiased polling platform for democratic participation**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.31-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)

## 🚀 **Status: PRODUCTION READY**

The Choices platform is now in a **production-ready state** with all critical SSR issues resolved and a comprehensive authentication system implemented. The application builds successfully, runs properly in development and production, and includes robust error handling.

### ✅ **Recent Improvements (Latest Release)**
- **SSR Cookie Issues Fixed** - All API routes now properly handle Next.js 14 dynamic rendering
- **Authentication System Standardized** - Hooks-based auth system with proper error handling
- **Registration Workflow Fixed** - Signup process now works correctly
- **Profile Page Restored** - Complete user profile management functionality
- **Zero Linting Errors** - Clean, maintainable codebase following best practices
- **Comprehensive Testing** - E2E tests covering critical user journeys

### ✅ **What's Working**
- **Complete Build Process** - No blocking errors, clean builds
- **Next.js 14 App Router** - Fully compatible with SSR and static generation
- **Authentication System** - Hooks-based system with Supabase integration
- **API Routes** - All operational with proper dynamic rendering
- **User Registration** - Complete signup workflow with validation
- **Profile Management** - Full user profile and settings functionality
- **Development Environment** - Fully functional with hot reloading
- **Testing Framework** - Comprehensive E2E coverage with Playwright

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
- **TypeScript** - Type-safe development with strict mode
- **Tailwind CSS** - Utility-first styling with custom components
- **Supabase** - Backend-as-a-Service integration
- **React Hooks** - Modern state management and authentication

### Backend
- **Supabase** - Database, authentication, and real-time features
- **PostgreSQL** - Primary database with Row Level Security
- **JWT Authentication** - Secure session management
- **API Routes** - Server-side API endpoints with proper SSR handling

### Authentication System
- **Hooks-based Auth** - `useAuth` hook for consistent authentication
- **Multiple Auth Methods** - Email/password, biometric, device flow
- **Session Management** - Secure JWT-based sessions
- **User Profiles** - Complete user data management

### Testing
- **Playwright** - End-to-end testing with comprehensive coverage
- **Jest** - Unit testing framework
- **TypeScript** - Type checking and validation

## 📁 **Project Structure**

```
choices/
├── web/                    # Next.js frontend application
│   ├── app/               # App Router pages and API routes
│   │   ├── api/           # API endpoints with SSR fixes
│   │   ├── auth/          # Authentication pages
│   │   ├── profile/       # User profile management
│   │   └── polls/         # Polling functionality
│   ├── components/        # React components
│   │   ├── ui/           # Reusable UI components
│   │   ├── auth/         # Authentication components
│   │   └── voting/       # Voting interface components
│   ├── hooks/            # Custom React hooks
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

# Optional: Development settings
NODE_ENV=development
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
- **E2E Tests** - Full user journey testing including registration
- **Integration Tests** - API and database testing
- **Authentication Tests** - Login, registration, and session management

## 🚀 **Deployment**

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch
4. Monitor deployment logs for any issues

### Manual Deployment
```bash
# Build the application
npm run build

# Deploy to your preferred platform
# (Vercel, Netlify, AWS, etc.)
```

### Deployment Status
- ✅ **Git-based Deployments** - Automatic deployments on main branch
- ✅ **Environment Variables** - Properly configured for production
- ✅ **SSR Compatibility** - All API routes handle dynamic rendering
- ✅ **Error Handling** - Comprehensive error boundaries and logging

## 📚 **Documentation**

- **[Project Status](./docs/PROJECT_STATUS.md)** - Current development status
- **[API Documentation](./docs/API.md)** - API endpoints and usage
- **[Authentication System](./docs/AUTHENTICATION_SYSTEM.md)** - Auth implementation
- **[Database Schema](./docs/DATABASE_SECURITY_AND_SCHEMA.md)** - Database structure
- **[Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[Testing Guide](./docs/testing/COMPREHENSIVE_TESTING_GUIDE.md)** - Testing procedures
- **[Core Documentation](./docs/CORE_DOCUMENTATION_MAINTENANCE_GUIDE.md)** - Documentation maintenance

## 🔒 **Security Features**

- **Row Level Security (RLS)** - Database-level data protection
- **JWT Authentication** - Secure session management
- **Input Validation** - Comprehensive form and API validation
- **Rate Limiting** - Protection against abuse
- **CORS Configuration** - Proper cross-origin request handling
- **Environment Variables** - Secure credential management

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our coding standards
4. Add tests for new functionality
5. Ensure all tests pass (`npm run test && npm run lint`)
6. Submit a pull request

### Code Standards
- **TypeScript** - Strict mode enabled
- **ESLint** - Zero linting errors required
- **Prettier** - Consistent code formatting
- **Testing** - Comprehensive test coverage
- **Documentation** - Updated documentation for all changes

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 **Support**

- **Issues** - [GitHub Issues](https://github.com/choices-project/choices/issues)
- **Discussions** - [GitHub Discussions](https://github.com/choices-project/choices/discussions)
- **Documentation** - [Project Docs](./docs/)

## 🎯 **Roadmap**

### Current Focus
- **Production Stability** - Ensuring reliable deployment
- **User Experience** - Improving onboarding and usability
- **Performance** - Optimizing load times and responsiveness
- **Testing** - Expanding test coverage

### Future Features
- **Advanced Polling** - More sophisticated voting mechanisms
- **Real-time Updates** - Live poll results and notifications
- **Mobile App** - Native mobile application
- **Analytics** - Comprehensive user and poll analytics

---

**Built with ❤️ for democratic participation**

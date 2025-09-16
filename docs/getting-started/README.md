# Getting Started with Choices Platform

This guide will help you set up your development environment and get the Choices platform running locally.

## 📋 Prerequisites

- **Node.js** 18+ (we use Node.js 19)
- **npm** 9+
- **Git** 2.30+
- **Supabase Account** (for database and authentication)

## 🚀 Quick Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/choices.git
cd choices
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install web app dependencies
cd web
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the `web/` directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# WebAuthn Configuration
NEXT_PUBLIC_PRIMARY_DOMAIN=localhost
NEXT_PUBLIC_ORIGIN=http://localhost:3000

# Feature Flags (JSON encoded)
NEXT_PUBLIC_FEATURE_FLAGS={"WEBAUTHN":false,"PWA":false,"ADMIN":true}
```

### 4. Database Setup

Run the database migrations:

```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d postgres -f web/scripts/migrations/001-webauthn-schema.sql
```

### 5. Start Development Server

```bash
cd web
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🗄️ Database Configuration

### Supabase Setup

1. **Create a new Supabase project**
2. **Get your project URL and API keys**
3. **Run the database migrations** (see [Database Setup](database-setup.md))
4. **Configure Row Level Security (RLS) policies**

### Required Tables

The application uses these main tables:
- `user_profiles` - User information and preferences
- `polls` - Poll definitions and metadata
- `poll_options` - Poll choices and options
- `votes` - User votes and preferences
- `webauthn_credentials` - WebAuthn public keys
- `webauthn_challenges` - Temporary authentication challenges

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm run test             # Run unit tests
npm run test:e2e         # Run E2E tests
npm run test:coverage    # Run tests with coverage

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # Run TypeScript type checking
npm run type-check:strict # Run strict TypeScript checking
```

## 🎯 Feature Flags

The application uses feature flags to control functionality. Here are the current settings:

```typescript
// Current feature flags (from lib/feature-flags.ts)
{
  "CORE_AUTH": true,           // ✅ Core authentication system (Supabase)
  "CORE_POLLS": true,          // ✅ Poll management system
  "CORE_USERS": true,          // ✅ User management
  "ADMIN": true,               // ✅ Admin dashboard
  "WEBAUTHN": false,           // 🚧 WebAuthn passkey authentication (disabled)
  "PWA": false,                // 🚧 Progressive Web App features (disabled)
  "ANALYTICS": false,          // 🚧 Analytics and tracking (disabled)
  "ADVANCED_PRIVACY": false,   // 🚧 Advanced privacy features (disabled)
  "EXPERIMENTAL_UI": false,    // 🚧 Experimental UI features (disabled)
  "EXPERIMENTAL_ANALYTICS": false // 🚧 Experimental analytics (disabled)
}
```

### What's Currently Working
- **Authentication**: Email/password login with Supabase
- **Polling**: Create polls, vote, view results
- **Admin**: User management and system monitoring
- **TypeScript**: Full type safety with 0 compilation errors

## 🛡️ Security Configuration

### Environment Variables

Ensure these environment variables are set for security:

```bash
# Required for production
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# WebAuthn configuration
NEXT_PUBLIC_PRIMARY_DOMAIN=your_domain.com
NEXT_PUBLIC_ORIGIN=https://your_domain.com

# Optional security settings
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your_domain.com
```

### Row Level Security (RLS)

The database uses RLS policies for security:
- Users can only access their own data
- Admins have elevated permissions
- Public polls are readable by all users
- Private polls are restricted to authorized users

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:coverage
```

## 🚀 Deployment

See the [Deployment Guide](../deployment/README.md) for production deployment instructions.

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Ensure RLS policies are configured

2. **TypeScript Errors**
   - Run `npm run type-check` to verify type safety
   - ✅ **All TypeScript errors have been resolved** (0 errors)
   - The project now has full type safety

3. **Build Issues**
   - Clear node_modules and reinstall
   - Check for conflicting dependencies
   - Verify environment variables

### Getting Help

- **GitHub Issues:** [Create an issue](https://github.com/your-org/choices/issues)
- **Documentation:** Check the relevant documentation sections
- **Community:** [GitHub Discussions](https://github.com/your-org/choices/discussions)

## 📚 Next Steps

- **[Architecture Overview](../architecture/README.md)** - Understand the system design
- **[Development Guide](../development/README.md)** - Learn the development workflow
- **[API Reference](../api/README.md)** - Explore the API endpoints
- **[Security Guide](../security/README.md)** - Understand security implementation

---

**Last Updated:** December 15, 2024  
**Version:** 1.0.0



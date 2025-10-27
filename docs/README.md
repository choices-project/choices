# 🗳️ Choices Platform

**Democratic Equalizer Platform - Making Democracy More Accessible**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)

---

## 🎯 **What is Choices?**

Choices is a sophisticated civic engagement platform designed to create a more informed and engaged democracy through technology. It combines polling, civic data, and analytics to help citizens make better decisions and stay connected with their representatives.

### **Key Features**
- 🗳️ **Interactive Polling** - Create and participate in polls
- 🏛️ **Civic Data** - Access to representative information and voting records
- 📊 **Analytics** - AI-powered insights and trend analysis
- 🔐 **Secure Authentication** - WebAuthn, social login, and anonymous access
- 📱 **Progressive Web App** - Works offline, installable on any device
- 🛡️ **Trust Tiers** - Sophisticated user verification system
- 🌐 **Internationalization** - Multi-language support

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 22.19.0
- npm 10.9.3
- Supabase account

### **Development Setup**
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

### **Production Deployment**
```bash
# Build the application
npm run build

# Deploy to Vercel
vercel --prod
```

---

## 🏗️ **Architecture**

### **Tech Stack**
- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Authentication**: WebAuthn, OAuth, Anonymous access
- **Analytics**: AI-powered insights with Ollama integration
- **Deployment**: Vercel with Git-based deployments

### **Key Components**
- **Polling System** - Create, vote, and analyze polls
- **Civic Data Pipeline** - Representative information and voting records
- **Analytics Engine** - AI-powered insights and trend analysis
- **Trust Tier System** - User verification and reputation
- **Admin Dashboard** - Comprehensive management interface

---

## 📚 **Documentation**

### **Core Documentation**
- **[Architecture](docs/ARCHITECTURE.md)** - System design and components
- **[Development](docs/DEVELOPMENT.md)** - Setup and development workflow
- **[Deployment](docs/DEPLOYMENT.md)** - Production deployment guide
- **[API Reference](docs/API.md)** - Complete API documentation
- **[Database Schema](docs/DATABASE.md)** - Database structure and functions
- **[Security](docs/SECURITY.md)** - Security policies and procedures

### **Feature Documentation**
- **[Authentication](docs/features/AUTH.md)** - Auth system and WebAuthn
- **[Polls](docs/features/POLLS.md)** - Polling system and features
- **[Analytics](docs/features/ANALYTICS.md)** - Analytics and insights
- **[Civics](docs/features/CIVICS.md)** - Civic engagement features
- **[Admin](docs/features/ADMIN.md)** - Admin functionality

---

## 🛠️ **Development**

### **Available Scripts**
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Run TypeScript checks

# Testing
npm run test:jest    # Run unit tests
npm run test:ci      # Run all tests
```

### **Project Structure**
```
web/
├── app/                 # Next.js App Router
├── components/          # React components
├── features/           # Feature-specific code
├── lib/                # Utilities and services
├── tests/              # Test suites
└── docs/               # Documentation
```

---

## 🔐 **Security**

Choices prioritizes security and privacy:
- **Row Level Security** - Database-level access control
- **WebAuthn Authentication** - Passwordless, secure authentication
- **Data Encryption** - All sensitive data encrypted
- **Privacy Protection** - Differential privacy for analytics
- **Trust Tiers** - Sophisticated user verification

See [Security Documentation](docs/SECURITY.md) for details.

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌟 **Status**

**Current Status**: Production Ready  
**Last Updated**: October 27, 2025  
**Version**: 1.0.0

### **Recent Updates**
- ✅ Comprehensive testing suite
- ✅ AI-powered analytics integration
- ✅ Enhanced security and privacy features
- ✅ Progressive Web App capabilities
- ✅ Internationalization support

---

## 📞 **Support**

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/choices-project/choices/issues)
- **Discussions**: [GitHub Discussions](https://github.com/choices-project/choices/discussions)

---

**Choices Platform** - Making democracy more accessible through technology. 🗳️✨
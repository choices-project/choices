# 🏗️ Architecture Overview

**Last Updated**: 2025-01-27 19:15 UTC  
**Status**: ✅ **Production Ready**

## 🎯 **System Architecture**

### **High-Level Overview**
Choices is a privacy-first, modular voting and polling platform built with a modern tech stack designed for security, scalability, and user privacy.

### **Core Components**

#### **Frontend (Next.js 14)**
- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks + custom hooks
- **Charts**: ECharts for React
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **PWA**: Progressive Web App capabilities

#### **Backend Services (Go)**
- **IA Service**: Identity Authority for blinded token issuance
- **PO Service**: Poll Orchestrator for vote management
- **Profile Service**: User profile management

#### **Database**
- **Primary**: PostgreSQL (via Supabase)
- **Local Development**: SQLite fallback
- **ORM**: Prisma
- **Security**: Row Level Security (RLS) on all tables

#### **Authentication**
- **Primary**: Supabase Auth
- **Enhanced**: WebAuthn for biometric authentication
- **JWT**: Custom JWT implementation with refresh tokens
- **Tiers**: T0-T3 user verification system

## 🔐 **IA/PO Architecture (Critical Security Model)**

### **IA (Identity Authority)**
- **Purpose**: Issues blinded tokens for voting
- **Security**: Validates user verification and policy compliance
- **Tokens**: Signs blinded tokens bound to specific polls and tier limits
- **Privacy**: Uses VOPRF for unlinkable issuance
- **Table**: `ia_tokens` with proper RLS policies

### **PO (Poll Orchestrator)**
- **Purpose**: Manages poll voting and verification
- **Security**: Verifies token signatures and prevents double-spending
- **Voting**: Associates ballots with tags, allows revotes
- **Audit**: Provides Merkle tree receipts for inclusion verification
- **Privacy**: Vote privacy protection implemented

### **Critical Security Properties**
- **User Data Isolation**: Users can never see other users' data
- **Vote Privacy**: Only aggregated poll results are displayed
- **Admin Access**: Owner-only admin functions
- **Audit Logging**: Comprehensive security audit trails

## 📁 **Project Structure**

```
choices/
├── web/                    # Next.js frontend application (PWA)
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   ├── modules/          # Feature modules
│   └── types/            # TypeScript type definitions
├── server/               # Backend services
│   ├── ia/              # AI/ML service (Go)
│   ├── po/              # Poll orchestration (Go)
│   └── profile/         # User profiles (Go)
├── database/             # Database schemas and migrations
├── docs/                 # Project documentation
├── scripts/              # Utility scripts and tools
└── specs/               # Technical specifications
```

## 🔧 **Key Features**

### **Core Functionality**
- **Poll Creation & Voting**: Create polls, vote, real-time results
- **User Profiles**: Privacy-first user profiles with tiered verification
- **Analytics Dashboard**: Comprehensive data visualization
- **Admin Panel**: Poll management, user administration, system monitoring
- **PWA Features**: Offline support, push notifications, app-like experience

### **Privacy & Security**
- **Differential Privacy**: Noise injection for data protection
- **Zero-Knowledge Proofs**: Privacy-preserving verification
- **Data Encryption**: End-to-end encryption for sensitive data
- **Privacy Budgets**: User-controlled data sharing limits
- **Audit Logging**: Comprehensive security audit trails

### **Advanced Features**
- **Feature Flags**: Dynamic feature enabling/disabling
- **Modular Architecture**: Pluggable components and services
- **Cross-Platform Testing**: Automated testing across devices
- **Performance Monitoring**: Real-time performance tracking
- **Feedback System**: User feedback collection and analysis

## 🚀 **Deployment Architecture**

### **Production**
- **Platform**: Vercel
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **CI/CD**: GitHub Actions

### **Environment Variables**
```bash
# Required for production
DATABASE_URL=postgresql://...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
NEXT_PUBLIC_VAPID_PRIVATE_KEY=...
```

## 📊 **Performance & Monitoring**

### **Performance Metrics**
- Page load times < 2s
- Time to Interactive < 3s
- Core Web Vitals optimization
- Mobile performance parity

### **Monitoring**
- Real-time error tracking
- Performance analytics
- User behavior analysis
- System health monitoring

## 🛡️ **Security Standards**

### **Code Security**
- Pre-commit hooks for credential detection
- Automated security scanning
- Regular dependency updates
- Code review requirements

### **Data Protection**
- Environment variable management
- No hardcoded credentials
- Encrypted data transmission
- Privacy-first design principles

### **Access Control**
- Role-based permissions
- Multi-factor authentication
- Session management
- Audit logging

## 🔄 **Development Workflow**

### **Feature Development**
1. Create feature branch from `main`
2. Implement feature with feature flags
3. Write tests and documentation
4. Create pull request
5. CI/CD validation
6. Merge to main (auto-deploys to Vercel)

### **Testing Strategy**
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API and service testing
- **E2E Tests**: Full user flow testing
- **Performance Tests**: Load and stress testing
- **Security Tests**: Vulnerability scanning

## 📈 **Development Phases**

### **Phase 1: Foundation** ✅
- Basic Next.js setup
- Authentication system
- Database schema
- Core voting functionality

### **Phase 2: Privacy & Security** ✅
- Differential privacy implementation
- WebAuthn integration
- Security audit system
- Privacy controls

### **Phase 3: Advanced Features** ✅
- Analytics dashboard
- Admin panel
- PWA capabilities
- Feature flag system

### **Phase 4: Production Readiness** ✅
- CI/CD pipeline
- Performance optimization
- Security hardening
- Documentation

### **Phase 5: PWA Enhancement & Testing** 🔄
- Progressive Web App optimization
- Comprehensive testing
- Cross-platform validation
- Performance monitoring

---

**This architecture ensures a secure, scalable, and privacy-first voting platform with comprehensive security measures and modern development practices.**

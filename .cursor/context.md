# Cursor AI Context - Choices Platform

**Created:** January 19, 2025  
**Status:** 🚀 **ACTIVE** - Project context for AI agents  
**Scope:** Complete project context for Cursor AI agents  

## 🎯 **PROJECT OVERVIEW**

### **Platform Details**
- **Name**: Choices Platform
- **Type**: Democratic Polling Platform
- **Framework**: Next.js 14.2.32
- **React**: 18.2.0
- **TypeScript**: 5.7.2
- **State Management**: Zustand 5.0.2
- **Database**: Supabase 2.55.0
- **Deployment**: Vercel
- **Current Date**: Check system date dynamically

### **Project Structure**
```
Choices/
├── web/                    # Next.js application
│   ├── app/               # App Router
│   ├── components/        # React components
│   ├── features/          # Feature modules
│   ├── lib/              # Utilities and integrations
│   ├── stores/           # Zustand stores
│   └── types/            # TypeScript types
├── docs/                 # Documentation
│   ├── features/         # Feature documentation
│   └── FEATURE_AUDITS/   # Audit reports
└── .cursor/             # Cursor AI configuration
```

## 🏗️ **ARCHITECTURE PATTERNS**

### **Error Handling Architecture**
- **Base Class**: `ApplicationError` in `web/lib/errors/base.ts`
- **Custom Errors**: `CongressGovApiError`, `GoogleCivicError`, etc.
- **Error Handlers**: `handleError`, `handleAsyncOperation`, etc.
- **Logging**: Custom logger in `web/lib/utils/logger.ts`
- **Error Boundaries**: React error boundaries for UI

### **State Management Architecture**
- **Zustand Stores**: Centralized state management
- **Store Patterns**: `create`, `devtools`, `persist` middleware
- **State Optimization**: Efficient state updates
- **Provider Pattern**: Minimal provider usage

### **API Architecture**
- **Next.js API Routes**: Server-side API endpoints
- **Error Handling**: Comprehensive error handling
- **Validation**: Request/response validation
- **Security**: Security headers and validation

### **PWA Architecture**
- **Service Worker**: Offline functionality
- **Caching**: Strategic caching strategies
- **Push Notifications**: User engagement
- **App Store**: PWA installation

## 🔧 **TECHNICAL STACK**

### **Frontend Technologies**
- **Next.js 14.2.32**: App Router, Server Components
- **React 18.2.0**: Concurrent features, Suspense
- **TypeScript 5.7.2**: Type safety, strict mode
- **Tailwind CSS**: Utility-first styling
- **Zustand 5.0.2**: State management

### **Backend Technologies**
- **Supabase 2.55.0**: Database, authentication
- **Next.js API Routes**: Server-side logic
- **PostgreSQL**: Database engine
- **Row Level Security**: Data security

### **Development Tools**
- **Jest 30.1.2**: Unit testing
- **Playwright 1.55.0**: E2E testing
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks

### **Deployment & Infrastructure**
- **Vercel**: Hosting and deployment
- **GitHub**: Version control
- **GitHub Actions**: CI/CD
- **Environment Variables**: Configuration

## 📊 **CURRENT FEATURES**

### **Core Features**
- **Polling System**: Create and manage polls
- **User Authentication**: Supabase auth integration
- **Real-time Updates**: Live poll results
- **Admin Dashboard**: User and poll management
- **PWA Support**: Progressive web app capabilities

### **Advanced Features**
- **Error Handling**: Comprehensive error management
- **State Management**: Optimized Zustand stores
- **API Integration**: External service integration
- **Security**: Row-level security, CSRF protection
- **Performance**: Optimized loading and caching

## 🎯 **DEVELOPMENT GUIDELINES**

### **Code Standards**
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent formatting
- **Conventional Commits**: Commit message standards
- **Testing**: Comprehensive test coverage

### **Error Handling Standards**
- **ApplicationError**: Base error class
- **Structured Logging**: Custom logger utility
- **Error Boundaries**: React error boundaries
- **Recovery Mechanisms**: Graceful error recovery
- **User Feedback**: User-friendly error messages

### **State Management Standards**
- **Zustand Patterns**: Consistent store patterns
- **State Optimization**: Efficient updates
- **Provider Minimization**: Minimal provider usage
- **Type Safety**: TypeScript integration

### **API Standards**
- **Error Handling**: Comprehensive error handling
- **Validation**: Request/response validation
- **Security**: Security headers and validation
- **Documentation**: API documentation

## 🚀 **PERFORMANCE OPTIMIZATION**

### **Frontend Optimization**
- **Code Splitting**: Dynamic imports
- **Lazy Loading**: Component lazy loading
- **Bundle Optimization**: Webpack optimization
- **Image Optimization**: Next.js image optimization
- **Caching**: Strategic caching

### **Backend Optimization**
- **Database Optimization**: Query optimization
- **Caching**: Redis caching
- **CDN**: Content delivery network
- **Compression**: Response compression

## 🔒 **SECURITY MEASURES**

### **Authentication & Authorization**
- **Supabase Auth**: Secure authentication
- **Row Level Security**: Database security
- **CSRF Protection**: Cross-site request forgery
- **Rate Limiting**: API rate limiting

### **Data Security**
- **Environment Variables**: Secret management
- **Input Validation**: User input validation
- **SQL Injection**: Prevention measures
- **XSS Protection**: Cross-site scripting prevention

## 📱 **PWA CAPABILITIES**

### **Offline Functionality**
- **Service Worker**: Offline support
- **Caching**: Strategic caching
- **Sync**: Background sync
- **Push Notifications**: User engagement

### **App Store Integration**
- **Manifest**: PWA manifest
- **Installation**: App installation
- **Updates**: Automatic updates
- **Native Features**: Device integration

## 🧪 **TESTING STRATEGY**

### **Unit Testing**
- **Jest**: Unit test framework
- **Test Coverage**: Comprehensive coverage
- **Mocking**: Service mocking
- **Assertions**: Test assertions

### **Integration Testing**
- **API Testing**: Endpoint testing
- **Database Testing**: Data testing
- **Service Testing**: Integration testing
- **Error Testing**: Error scenario testing

### **E2E Testing**
- **Playwright**: End-to-end testing
- **User Flows**: Complete user journeys
- **Cross-browser**: Multi-browser testing
- **Performance**: Performance testing

## 📈 **MONITORING & ANALYTICS**

### **Error Monitoring**
- **Error Tracking**: Error logging
- **Performance Monitoring**: Performance metrics
- **User Analytics**: User behavior tracking
- **System Health**: System monitoring

### **Business Analytics**
- **Poll Analytics**: Poll performance
- **User Engagement**: User activity
- **Conversion Tracking**: Goal tracking
- **ROI Analysis**: Return on investment

## 🔄 **DEPLOYMENT WORKFLOW**

### **CI/CD Pipeline**
- **GitHub Actions**: Automated workflows
- **Testing**: Automated testing
- **Linting**: Code quality checks
- **Deployment**: Automated deployment

### **Environment Management**
- **Development**: Local development
- **Staging**: Testing environment
- **Production**: Live environment
- **Configuration**: Environment variables

## 📚 **DOCUMENTATION STRUCTURE**

### **Feature Documentation**
- **Feature Files**: Individual feature docs
- **API Documentation**: API reference
- **Component Documentation**: Component guides
- **Integration Guides**: Integration documentation

### **Audit Reports**
- **Feature Audits**: Comprehensive audits
- **Error Audits**: Error handling audits
- **Performance Audits**: Performance analysis
- **Security Audits**: Security assessments

## 🎯 **AGENT BEHAVIOR CONTEXT**

### **Current Agent Behavior**
- **Date Accuracy**: Always check system date dynamically, only update files when modifying them
- **Error Handling**: Comprehensive error management
- **Implementation**: Complete, non-lazy implementations
- **Code Quality**: High-quality, maintainable code

### **Agent Optimization**
- **Team Rules**: Global behavior control
- **Custom Instructions**: Specific behavior guidance
- **Agent Roles**: Specialized agent configurations
- **Hooks**: Pre/post-commit validation

### **Quality Assurance**
- **Validation**: Automated validation
- **Monitoring**: Behavior monitoring
- **Feedback**: Continuous improvement
- **Optimization**: Performance optimization

---

**This context is ACTIVE for all Cursor AI agents working on the Choices platform.**
**Use this context to ensure consistent, high-quality implementations.**

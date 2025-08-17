# 🤖 Agent Onboarding Guide

## 🎯 Quick Start

Welcome to the **Choices** platform! This is a comprehensive voting and polling system with automated trending topic analysis.

### **📚 First: Read the Documentation System**
Before diving in, please read [`DOCUMENTATION_SYSTEM.md`](DOCUMENTATION_SYSTEM.md) to understand how our documentation is organized and how to navigate it effectively.

### **Current Project State**
- ✅ **Core Application**: Next.js frontend with Go backend services
- ✅ **Database**: PostgreSQL via Supabase with comprehensive RLS security
- ✅ **Authentication**: Supabase Auth with tiered user system
- ✅ **Automated Polls**: MVP feature for trending topic analysis
- ⚠️ **Security Policies**: Need final deployment (see deployment guide)

### **Key Architecture**
```
Frontend: Next.js (web/)
Backend: Go services (server/)
Database: PostgreSQL/Supabase
Auth: Supabase Auth
Security: Row Level Security (RLS)
```

## 📁 Essential Files & Directories

### **Core Application**
```markdown
📁 web/                    # Next.js frontend application
📁 server/                 # Go backend services
📁 database/               # Database schemas and migrations
├── automated_polls_tables.sql   # Automated polls feature tables
└── security_policies_fixed.sql  # Security policies (needs deployment)
```

### **Documentation (Read These First)**
```markdown
📄 PROJECT_SUMMARY.md           # Current project state and features
📄 DEVELOPMENT_BEST_PRACTICES.md # Our research-first methodology
📄 CURRENT_IMPLEMENTATION_ANALYSIS.md # Lessons learned
📄 FINAL_DEPLOYMENT_INSTRUCTIONS.md # Current deployment needs
📄 DATABASE_SETUP_GUIDE.md      # Database setup and configuration
```

### **Useful Utilities (Keep These)**
```markdown
📁 scripts/ci/                    # CI/CD utilities
📁 scripts/email-templates/       # Email template management
📁 scripts/check_production_urls.js # Production validation
📁 scripts/check_supabase_auth.js # Auth validation
📁 scripts/check-duplicate-users.js # Data integrity checks
📁 scripts/clear-database.js      # Development utilities
📁 scripts/configure_supabase_auth.js # Auth setup
📁 scripts/configure-email-templates.js # Email setup
📁 scripts/diagnose-email.js      # Email troubleshooting
📁 scripts/fix-otp-expiry.js      # Security utilities
📁 scripts/test_*.js              # Various testing utilities
```

## 🚀 Quick Development Workflow

### **1. Start Development Server**
```bash
cd web && npm run dev
```

### **2. Check Database Status**
```bash
node scripts/check_supabase_auth.js
```

### **3. Deploy Database Changes**
```bash
# Follow FINAL_DEPLOYMENT_INSTRUCTIONS.md
# Use Supabase Dashboard → SQL Editor
```

### **4. Test Features**
```bash
# Test authentication
node scripts/test-auth-flow.js

# Test complete flow
node scripts/test-complete-flow.js

# Test user sync
node scripts/test-user-sync.js
```

## 🔧 Common Development Tasks

### **Database Operations**
```markdown
✅ Schema changes: Edit files in database/
✅ Deploy changes: Use Supabase Dashboard SQL Editor
✅ Test queries: Use scripts/check_*.js utilities
✅ Clear data: Use scripts/clear-database.js
```

### **Authentication & Security**
```markdown
✅ Auth setup: scripts/configure_supabase_auth.js
✅ Security policies: database/security_policies_fixed.sql
✅ Email templates: scripts/email-templates/
✅ OTP issues: scripts/fix-otp-expiry.js
```

### **Testing & Validation**
```markdown
✅ Auth flow: scripts/test-auth-flow.js
✅ Complete flow: scripts/test-complete-flow.js
✅ User sync: scripts/test-user-sync.js
✅ Production URLs: scripts/check_production_urls.js
✅ Supabase config: scripts/verify_supabase_config.js
```

## 🎯 Current Priorities

### **Immediate (High Priority)**
1. **Deploy Security Policies**
   - Follow `FINAL_DEPLOYMENT_INSTRUCTIONS.md`
   - Deploy `database/security_policies_fixed.sql`
   - Test admin access and user permissions

2. **Test Automated Polls Feature**
   - Visit `/admin/automated-polls`
   - Test trending topics analysis
   - Verify poll generation workflow

3. **Validate User Experience**
   - Test poll creation
   - Test voting system
   - Verify aggregated results display

### **Next Phase (Medium Priority)**
1. **Enhance Security**
   - Audit current RLS policies
   - Implement additional security measures
   - Add comprehensive logging

2. **Improve Testing**
   - Add automated tests
   - Implement CI/CD pipeline
   - Add performance monitoring

3. **Feature Development**
   - Expand automated polls functionality
   - Add more voting methods
   - Implement advanced analytics

## 🛠️ Development Best Practices

### **Follow Our Methodology**
1. **Research First**: Always research before implementing
2. **Plan Comprehensively**: Design before coding
3. **Validate Assumptions**: Test before deployment
4. **Document Everything**: Keep documentation current
5. **Security First**: Consider security implications first

### **Code Quality Standards**
```markdown
✅ TypeScript for frontend
✅ Go for backend services
✅ PostgreSQL for database
✅ Comprehensive error handling
✅ Security-first approach
✅ Thorough testing
✅ Clear documentation
```

## 🔍 Troubleshooting Guide

### **Common Issues**

#### **Database Connection Issues**
```bash
# Check Supabase connection
node scripts/check_supabase_auth.js

# Verify configuration
node scripts/verify_supabase_config.js
```

#### **Authentication Problems**
```bash
# Test auth flow
node scripts/test-auth-flow.js

# Check for duplicate users
node scripts/check-duplicate-users.js

# Fix OTP expiry
node scripts/fix-otp-expiry.js
```

#### **Email Issues**
```bash
# Diagnose email problems
node scripts/diagnose-email.js

# Configure email templates
node scripts/configure-email-templates.js
```

#### **Production Issues**
```bash
# Check production URLs
node scripts/check_production_urls.js

# Test complete flow
node scripts/test-complete-flow.js
```

## 📚 Key Documentation

### **Architecture & Design**
- `docs/architecture.md` - System architecture
- `docs/protocol.md` - Communication protocols
- `docs/standards.md` - Development standards
- `docs/threat_model.md` - Security threat model

### **Security & Privacy**
- `SECURITY.md` - Security policy
- `SECURITY_STANDARDS.md` - Security standards
- `docs/PRIVACY_ENCRYPTION.md` - Privacy and encryption
- `docs/verification_tiers.md` - User verification tiers

### **Deployment & Operations**
- `DEPLOYMENT_GUIDE.md` - Deployment procedures
- `DATABASE_SETUP_GUIDE.md` - Database setup
- `QUICK_RLS_DEPLOYMENT.md` - Quick RLS deployment

## 🎯 Success Metrics

### **Development Quality**
```markdown
✅ Zero security vulnerabilities
✅ All tests passing
✅ Performance benchmarks met
✅ Documentation complete
✅ User acceptance achieved
```

### **Process Quality**
```markdown
✅ Research phase completed
✅ Planning phase documented
✅ Validation phase passed
✅ No backtracking required
✅ Timeline maintained
```

## 🚀 Getting Help

### **When You Need Assistance**
1. **Check Documentation**: Start with `PROJECT_SUMMARY.md`
2. **Review Best Practices**: Follow `DEVELOPMENT_BEST_PRACTICES.md`
3. **Analyze Issues**: Use `CURRENT_IMPLEMENTATION_ANALYSIS.md`
4. **Use Utilities**: Leverage scripts in `scripts/` directory
5. **Test Thoroughly**: Use test scripts before asking for help

### **Before Asking Questions**
```markdown
✅ Have you read the relevant documentation?
✅ Have you tried the troubleshooting utilities?
✅ Have you tested the specific issue?
✅ Have you checked the current project state?
✅ Have you followed the best practices?
```

---

## 🎉 Welcome to Choices!

**You're now ready to contribute to this exciting voting and polling platform. Remember to follow our research-first methodology and maintain the high quality standards we've established.**

**Happy coding! 🚀**

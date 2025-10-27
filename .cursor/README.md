# 🤖 Cursor Configuration - Choices Platform

**AI-Powered Development Environment for Democratic Engagement Platform**

---

## 📋 Overview

This directory contains optimized Cursor AI configuration for the Choices platform - a democratic engagement platform focused on civic participation, polling, and representative engagement.

**Last Updated**: October 27, 2025  
**Status**: Production Ready  
**Purpose**: Streamlined AI development for Choices platform

---

## 🚀 Quick Start

### **Essential Commands**
```bash
# Fix 90% of errors automatically
npm run auto-fix

# Verify everything is working
npm run types:strict && npm run lint:gradual && npm run test:all

# Choices-specific testing
npm run test:user-journey-complete
npm run test:admin-journey-complete
npm run test:platform-journey-modern
```

### **Development Workflow**
```bash
# Start development
npm run dev
npm run test:jest -- --watch

# Before committing
npm run auto-fix:test
npm run test:both-journeys-complete
```

---

## 📁 Configuration Structure

### **📚 Documentation** (`docs/`)
- **AGENT_GUIDE.md** - Comprehensive guide for AI agents
- **DEVELOPMENT_WORKFLOW.md** - Step-by-step development process
- **CHOICES_SPECIFICS.md** - Platform-specific guidance
- **TROUBLESHOOTING.md** - Common issues and solutions

### **⚡ Commands** (`commands/`)
- **essential-commands.md** - Core development commands
- **testing-commands.md** - Testing and validation commands
- **deployment-commands.md** - Build and deployment commands
- **maintenance-commands.md** - Maintenance and cleanup commands

### **🔧 Rules** (`rules/`)
- **CORE_RULES.md** - Essential development rules
- **QUALITY_STANDARDS.md** - Code quality requirements
- **SECURITY_RULES.md** - Security best practices
- **CHOICES_RULES.md** - Platform-specific rules

### **🎯 Hooks** (`hooks/`)
- **pre-commit.md** - Pre-commit validation
- **post-commit.md** - Post-commit actions
- **pre-push.md** - Pre-push validation

### **⚙️ Configs** (`configs/`)
- **cursor-settings.json** - Cursor IDE configuration
- **ai-prompts.json** - Optimized AI prompts
- **workspace-settings.json** - Workspace-specific settings

---

## 🎯 Key Features

### **✅ Choices Platform Optimized**
- **Platform-specific testing**: User journey, admin journey, civics backend
- **Democratic engagement focus**: Polling, voting, representative lookup
- **Security-first**: WebAuthn, RLS, trust tiers, anonymous access
- **AI integration**: Ollama, Hugging Face, analytics

### **✅ Automated Error Fixing**
The platform includes a sophisticated auto-fix system that:
- Fixes 90% of common errors automatically
- Uses testing infrastructure for verification
- Handles TypeScript, ESLint, and test errors
- Provides iterative improvement

### **✅ Quality Gates**
- TypeScript strict mode enforcement
- ESLint with comprehensive rules
- Comprehensive test coverage
- Security and performance testing
- Automated verification pipeline

### **✅ Development Tools**
- Hot reload development server
- Test watchers for continuous feedback
- Automated error fixing
- Quality verification commands

---

## 🔧 Usage

### **For New AI Agents**
1. Read `docs/QUICK_START.md` for 30-second setup
2. Follow `docs/DEVELOPMENT_WORKFLOW.md` for step-by-step guidance
3. Use `commands/essential-commands.md` for core commands
4. Follow `rules/CORE_RULES.md` for best practices

### **For Experienced Agents**
1. Use `commands/essential-commands.md` for quick reference
2. Follow `rules/CORE_RULES.md` for quality standards
3. Use `docs/CHOICES_SPECIFICS.md` for platform-specific guidance

---

## 🚨 Emergency Procedures

### **When Everything Breaks**
```bash
npm run auto-fix && npm run test:all
```

### **When Tests Fail**
```bash
npm run auto-fix
npm run test:jest -- --verbose
```

### **When TypeScript Errors**
```bash
npm run auto-fix
npm run types:strict
```

### **When Civics Backend Issues**
```bash
npm run test:real-database-activity
npm run test:platform-journey-modern
```

---

## 📊 Success Metrics

### **Green Status (Good)**
- ✅ Auto-fix completes successfully
- ✅ All tests pass (including Choices-specific)
- ✅ TypeScript strict mode passes
- ✅ ESLint shows minimal warnings
- ✅ Security tests pass
- ✅ Performance tests pass
- ✅ Civics backend health checks pass

### **Red Status (Fix Required)**
- ❌ Auto-fix fails
- ❌ Tests failing
- ❌ TypeScript errors
- ❌ ESLint errors
- ❌ Security vulnerabilities
- ❌ Performance regressions
- ❌ Civics backend issues

---

## 🔄 Workflow Templates

### **Feature Development**
```bash
# 1. Start clean
npm run auto-fix

# 2. Develop with tests
npm run test:jest -- --watch

# 3. Test Choices-specific functionality
npm run test:user-journey-complete
npm run test:admin-journey-complete

# 4. Final verification
npm run test:both-journeys-complete
```

### **Civics Backend Development**
```bash
# 1. Auto-fix common issues
npm run auto-fix

# 2. Test database connectivity
npm run test:real-database-activity

# 3. Test platform journey
npm run test:platform-journey-modern

# 4. Verify civics functionality
npm run test:civics-backend-health
```

### **Security Development**
```bash
# 1. Quality check
npm run test:security

# 2. Authentication testing
npm run test:auth-security

# 3. RLS policy testing
npm run test:rls-policies

# 4. Trust tier validation
npm run test:trust-tiers
```

---

## 💡 Pro Tips

### **Always Run Auto-Fix First**
The `npm run auto-fix` command uses the testing infrastructure to automatically fix 90% of common errors. Always run this first!

### **Keep Tests Running**
Use `npm run test:jest -- --watch` to catch issues immediately while developing.

### **Verify Before Committing**
Run `npm run test:both-journeys-complete` before committing to ensure all Choices platform functionality works.

### **When in Doubt**
```bash
npm run auto-fix && npm run test:all
```

### **Choices-Specific Testing**
Always test the core platform functionality:
- User journey (polling, voting, sharing)
- Admin journey (moderation, analytics, management)
- Civics backend (representative lookup, data ingestion)
- Security (authentication, RLS, trust tiers)

---

## 🎯 Focus Areas

### **High Priority**
1. **Error-Free Code**: Use auto-fix and testing infrastructure
2. **Type Safety**: Strict TypeScript, no `any` types
3. **Test Coverage**: All features must be tested
4. **Security**: All security tests must pass
5. **Performance**: No performance regressions
6. **Choices Functionality**: Core platform features must work

### **Code Quality**
- Use meaningful variable names
- Write self-documenting code
- Follow established patterns
- Keep functions small and focused
- Add proper error handling
- Consider democratic engagement context

---

**Remember:** The auto-fix system is your best friend. It handles most errors automatically, so you can focus on building democratic engagement features!
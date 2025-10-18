# Cursor Configuration - Choices Platform

**Created:** January 27, 2025  
**Updated:** January 27, 2025  
**Purpose:** Streamlined configuration for AI agents working on the Choices Platform

## 🚀 Quick Start

### **Essential Commands**
```bash
# Fix 90% of errors automatically
npm run auto-fix

# Verify everything is working
npm run types:strict && npm run lint:gradual && npm run test:all
```

### **Development Workflow**
```bash
# Start development
npm run dev
npm run test:jest -- --watch

# Before committing
npm run auto-fix:test
```

## 📁 Configuration Files

### **Agent Guidance**
- `AGENT_GUIDE.md` - Essential guide for agents
- `AGENT_COMMANDS.md` - Essential commands for agents
- `AGENT_RULES.md` - Core rules and principles
- `AGENT_CHECKLIST.md` - Step-by-step checklist
- `QUICK_START.md` - 30-second setup guide

## 🎯 Key Features

### **Automated Error Fixing**
The platform includes a sophisticated auto-fix system that:
- Fixes 90% of common errors automatically
- Uses testing infrastructure for verification
- Handles TypeScript, ESLint, and test errors
- Provides iterative improvement

### **Quality Gates**
- TypeScript strict mode enforcement
- ESLint with comprehensive rules
- Comprehensive test coverage
- Security and performance testing
- Automated verification pipeline

### **Development Tools**
- Hot reload development server
- Test watchers for continuous feedback
- Automated error fixing
- Quality verification commands

## 🔧 Usage

### **For New Agents**
1. Read `QUICK_START.md` for 30-second setup
2. Follow `AGENT_CHECKLIST.md` for step-by-step guidance
3. Use `AGENT_COMMANDS.md` for essential commands
4. Follow `AGENT_RULES.md` for best practices

### **For Experienced Agents**
1. Use `AGENT_COMMANDS.md` for quick reference
2. Follow `AGENT_RULES.md` for quality standards
3. Use `AGENT_CHECKLIST.md` for verification

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

## 📊 Success Metrics

### **Green Status (Good)**
- ✅ Auto-fix completes successfully
- ✅ All tests pass
- ✅ TypeScript strict mode passes
- ✅ ESLint shows minimal warnings
- ✅ Security tests pass
- ✅ Performance tests pass

### **Red Status (Fix Required)**
- ❌ Auto-fix fails
- ❌ Tests failing
- ❌ TypeScript errors
- ❌ ESLint errors
- ❌ Security vulnerabilities
- ❌ Performance regressions

## 🔄 Workflow Templates

### **Feature Development**
```bash
# 1. Start clean
npm run auto-fix

# 2. Develop with tests
npm run test:jest -- --watch

# 3. Test E2E
npm run test:playwright

# 4. Final verification
npm run auto-fix:test
```

### **Bug Fixing**
```bash
# 1. Auto-fix common issues
npm run auto-fix

# 2. Test specific functionality
npm run test:jest -- --testNamePattern="bug-description"

# 3. Verify fix
npm run test:all
```

### **Code Review**
```bash
# 1. Quality check
npm run check

# 2. Security review
npm run test:security

# 3. Performance check
npm run test:performance
```

## 💡 Pro Tips

### **Always Run Auto-Fix First**
The `npm run auto-fix` command uses the testing infrastructure to automatically fix 90% of common errors. Always run this first!

### **Keep Tests Running**
Use `npm run test:jest -- --watch` to catch issues immediately while developing.

### **Verify Before Committing**
Run `npm run auto-fix:test` before committing to ensure everything is working.

### **When in Doubt**
```bash
npm run auto-fix && npm run test:all
```

---

**Remember:** The auto-fix system is your best friend. It handles most errors automatically, so you can focus on the important stuff!
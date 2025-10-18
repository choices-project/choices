# Agent Commands - Optimized for Choices Platform

**Created:** January 27, 2025  
**Updated:** January 27, 2025  
**Purpose:** Simple, optimized commands to keep AI agents on track

## 🚀 Quick Commands

### **Error Fixing & Quality**
```bash
# Auto-fix all errors using testing infrastructure
npm run auto-fix

# Comprehensive error fixing with verification
npm run auto-fix:test

# Check current error status
npm run lint:gradual && npm run types:strict
```

### **Testing & Verification**
```bash
# Run all tests (unit + e2e)
npm run test:all

# Run specific test suites
npm run test:jest          # Unit tests
npm run test:playwright    # E2E tests
npm run test:security      # Security tests
npm run test:performance   # Performance tests
```

### **Development Workflow**
```bash
# Start development server
npm run dev

# Build and verify
npm run build && npm run test:all

# Deploy verification
npm run ci:verify:deploy
```

## 🎯 Agent Focus Areas

### **1. Always Run Auto-Fix First**
```bash
npm run auto-fix
```
**Why:** Automatically fixes 90% of common errors using testing infrastructure.

### **2. Verify Before Proceeding**
```bash
npm run types:strict && npm run lint:gradual
```
**Why:** Ensures no TypeScript or linting errors before making changes.

### **3. Test-Driven Development**
```bash
npm run test:jest -- --watch
```
**Why:** Run tests continuously while developing to catch issues early.

### **4. Security & Performance**
```bash
npm run test:security && npm run test:performance
```
**Why:** Critical for production-ready code.

## 🔧 Configuration Commands

### **Database & API**
```bash
# Check database schema
npm run test:schema

# Verify API endpoints
npm run test:e2e:core
```

### **Code Quality**
```bash
# Comprehensive quality check
npm run check

# Security audit
npm run audit:high
```

## 📊 Status Commands

### **Quick Health Check**
```bash
# Overall system status
npm run auto-fix && npm run test:all
```

### **Detailed Analysis**
```bash
# Full system verification
npm run ci:verify:deploy
```

## 🚨 Emergency Commands

### **When Things Go Wrong**
```bash
# Reset and auto-fix everything
npm run auto-fix && npm run test:all

# Force rebuild
rm -rf .next node_modules && npm install && npm run build
```

### **Debug Mode**
```bash
# Run with detailed logging
DEBUG=* npm run dev

# Test with verbose output
npm run test:jest -- --verbose
```

## 📋 Agent Checklist

### **Before Starting Work**
- [ ] Run `npm run auto-fix`
- [ ] Verify `npm run types:strict` passes
- [ ] Check `npm run lint:gradual` passes

### **During Development**
- [ ] Keep `npm run test:jest -- --watch` running
- [ ] Run `npm run auto-fix` after major changes
- [ ] Test specific features with `npm run test:playwright`

### **Before Committing**
- [ ] Run `npm run auto-fix:test`
- [ ] Verify `npm run ci:verify:deploy`
- [ ] Check security with `npm run test:security`

## 🎯 Success Metrics

### **Green Status Indicators**
- ✅ `npm run auto-fix` completes without errors
- ✅ `npm run types:strict` passes
- ✅ `npm run test:all` passes
- ✅ `npm run lint:gradual` shows minimal warnings

### **Red Flags to Watch**
- ❌ TypeScript errors in core files
- ❌ Test failures in critical paths
- ❌ Security test failures
- ❌ Performance regressions

## 🔄 Workflow Templates

### **Feature Development**
```bash
# 1. Start with clean state
npm run auto-fix

# 2. Develop with tests
npm run test:jest -- --watch

# 3. Test E2E scenarios
npm run test:playwright

# 4. Final verification
npm run auto-fix:test
```

### **Bug Fixing**
```bash
# 1. Auto-fix common issues
npm run auto-fix

# 2. Run specific tests
npm run test:jest -- --testNamePattern="bug-description"

# 3. Verify fix
npm run test:all
```

### **Code Review**
```bash
# 1. Check quality
npm run check

# 2. Security review
npm run test:security

# 3. Performance check
npm run test:performance
```

---

**Remember:** Always run `npm run auto-fix` first - it fixes 90% of issues automatically using the testing infrastructure!

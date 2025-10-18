# Agent Guide - Choices Platform

**Created:** January 27, 2025  
**Updated:** January 27, 2025  
**Purpose:** Essential guide for AI agents working on the Choices Platform

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

## 🎯 Core Principles

### **1. Auto-Fix First, Always**
```bash
npm run auto-fix
```
**Rule:** Before making any changes, run auto-fix to resolve 90% of common errors automatically.

### **2. Test-Driven Development**
```bash
npm run test:jest -- --watch
```
**Rule:** Keep tests running while developing. Never commit code that breaks tests.

### **3. Quality Gates**
```bash
npm run types:strict && npm run lint:gradual
```
**Rule:** All code must pass TypeScript strict mode and ESLint before proceeding.

## 🚫 What NOT to Do

### **Never Skip These Steps**
- ❌ Don't make changes without running `npm run auto-fix` first
- ❌ Don't commit code with TypeScript errors
- ❌ Don't ignore test failures
- ❌ Don't bypass security checks
- ❌ Don't use `any` types without justification

### **Never Break These**
- ❌ Don't break existing tests
- ❌ Don't introduce new linting errors
- ❌ Don't compromise security
- ❌ Don't ignore performance implications

## ✅ What TO Do

### **Always Do These**
- ✅ Run `npm run auto-fix` before starting work
- ✅ Write tests for new features
- ✅ Use proper TypeScript types
- ✅ Follow the established patterns
- ✅ Document complex logic

### **Quality Standards**
- ✅ All functions must have proper types
- ✅ All components must be tested
- ✅ All API endpoints must have E2E tests
- ✅ All security features must be verified

## 🔧 Development Workflow

### **Step 1: Preparation**
```bash
npm run auto-fix
npm run types:strict
npm run lint:gradual
```

### **Step 2: Development**
```bash
npm run test:jest -- --watch
# Make changes while tests run
```

### **Step 3: Verification**
```bash
npm run test:all
npm run auto-fix:test
```

### **Step 4: Final Check**
```bash
npm run ci:verify:deploy
```

## 🎯 Focus Areas

### **High Priority**
1. **Error-Free Code**: Use auto-fix and testing infrastructure
2. **Type Safety**: Strict TypeScript, no `any` types
3. **Test Coverage**: All features must be tested
4. **Security**: All security tests must pass
5. **Performance**: No performance regressions

### **Code Quality**
- Use meaningful variable names
- Write self-documenting code
- Follow established patterns
- Keep functions small and focused
- Add proper error handling

## 🚨 Emergency Procedures

### **When Tests Fail**
```bash
# 1. Run auto-fix
npm run auto-fix

# 2. Check specific failures
npm run test:jest -- --verbose

# 3. Fix and re-test
npm run test:all
```

### **When TypeScript Errors**
```bash
# 1. Auto-fix first
npm run auto-fix

# 2. Check specific errors
npm run types:strict

# 3. Fix manually if needed
```

### **When Linting Issues**
```bash
# 1. Auto-fix
npm run auto-fix

# 2. Check remaining issues
npm run lint:gradual

# 3. Fix manually
npm run lint:fix:gradual
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

## 🔄 Iterative Improvement

### **Daily Routine**
1. Run `npm run auto-fix`
2. Check `npm run types:strict`
3. Run `npm run test:all`
4. Fix any issues found
5. Repeat until green

### **Weekly Review**
1. Run `npm run ci:verify:deploy`
2. Check security with `npm run test:security`
3. Verify performance with `npm run test:performance`
4. Update documentation

## 🎯 Agent Success Criteria

### **Must Have**
- All tests passing
- No TypeScript errors
- Minimal ESLint warnings
- Security tests passing
- Performance tests passing

### **Should Have**
- Good test coverage
- Clean code structure
- Proper error handling
- Good documentation
- Performance optimizations

### **Could Have**
- Advanced features
- Complex integrations
- Performance enhancements
- User experience improvements

---

**Remember:** The auto-fix system handles 90% of common errors automatically. Use it first, then focus on the remaining 10% that require manual attention.

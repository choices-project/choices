# Agent Checklist - Choices Platform

**Created:** January 27, 2025  
**Updated:** January 27, 2025  
**Purpose:** Step-by-step checklist to keep agents on track

## 🚀 Pre-Work Checklist

### **Before Starting Any Task**
- [ ] Run `npm run auto-fix` to fix common errors
- [ ] Verify `npm run types:strict` passes
- [ ] Check `npm run lint:gradual` shows minimal warnings
- [ ] Run `npm run test:jest` to ensure tests pass

### **Environment Setup**
- [ ] Development server running (`npm run dev`)
- [ ] Test watcher running (`npm run test:jest -- --watch`)
- [ ] Auto-fix completed successfully
- [ ] No blocking errors in console

## 🔧 Development Checklist

### **During Development**
- [ ] Keep test watcher running
- [ ] Write tests for new features
- [ ] Use proper TypeScript types
- [ ] Follow established patterns
- [ ] Run `npm run auto-fix` after major changes

### **Code Quality**
- [ ] No `any` types without justification
- [ ] Proper error handling
- [ ] Meaningful variable names
- [ ] Self-documenting code
- [ ] Small, focused functions

### **Testing**
- [ ] Unit tests for all new functions
- [ ] E2E tests for user workflows
- [ ] Security tests for sensitive features
- [ ] Performance tests for critical paths

## ✅ Pre-Commit Checklist

### **Before Committing Code**
- [ ] Run `npm run auto-fix` to fix any new errors
- [ ] Verify `npm run types:strict` passes
- [ ] Check `npm run lint:gradual` shows minimal warnings
- [ ] Run `npm run test:all` to ensure all tests pass
- [ ] Run `npm run test:security` for security verification
- [ ] Run `npm run test:performance` for performance check

### **Final Verification**
- [ ] `npm run auto-fix:test` completes successfully
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Minimal ESLint warnings
- [ ] Security tests passing
- [ ] Performance tests passing

## 🚨 Emergency Checklist

### **When Things Go Wrong**
- [ ] Run `npm run auto-fix` first
- [ ] Check `npm run types:strict` for TypeScript errors
- [ ] Check `npm run lint:gradual` for linting issues
- [ ] Run `npm run test:jest` to identify failing tests
- [ ] Fix issues one by one
- [ ] Re-run `npm run auto-fix` after each fix

### **When Tests Fail**
- [ ] Run `npm run auto-fix` to fix common issues
- [ ] Check specific test failures with `npm run test:jest -- --verbose`
- [ ] Fix failing tests
- [ ] Re-run `npm run test:all`

### **When TypeScript Errors**
- [ ] Run `npm run auto-fix` first
- [ ] Check `npm run types:strict` for specific errors
- [ ] Fix type issues manually if needed
- [ ] Re-run `npm run types:strict`

## 📊 Quality Gates

### **Must Pass Before Proceeding**
- [ ] Auto-fix completes without errors
- [ ] TypeScript strict mode passes
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] Security tests pass
- [ ] Performance tests pass

### **Should Pass for Production**
- [ ] ESLint shows minimal warnings
- [ ] Good test coverage
- [ ] No console errors
- [ ] No performance regressions
- [ ] No security vulnerabilities

## 🔄 Daily Routine

### **Start of Day**
- [ ] Run `npm run auto-fix`
- [ ] Check `npm run types:strict`
- [ ] Run `npm run test:all`
- [ ] Start development server
- [ ] Start test watcher

### **End of Day**
- [ ] Run `npm run auto-fix:test`
- [ ] Verify `npm run ci:verify:deploy`
- [ ] Check security with `npm run test:security`
- [ ] Verify performance with `npm run test:performance`

## 🎯 Success Metrics

### **Green Status (Ready to Proceed)**
- ✅ Auto-fix completes successfully
- ✅ All tests passing
- ✅ TypeScript strict mode passes
- ✅ ESLint shows minimal warnings
- ✅ Security tests passing
- ✅ Performance tests passing

### **Red Status (Fix Required)**
- ❌ Auto-fix fails
- ❌ Tests failing
- ❌ TypeScript errors
- ❌ ESLint errors
- ❌ Security vulnerabilities
- ❌ Performance regressions

## 🚀 Quick Commands Reference

### **Essential Commands**
```bash
npm run auto-fix              # Fix 90% of errors automatically
npm run types:strict          # Check TypeScript
npm run lint:gradual         # Check ESLint
npm run test:all             # Run all tests
npm run auto-fix:test        # Fix errors + run tests
```

### **Quality Commands**
```bash
npm run check                # Full quality check
npm run test:security        # Security tests
npm run test:performance     # Performance tests
npm run ci:verify:deploy    # Production verification
```

### **Development Commands**
```bash
npm run dev                  # Start dev server
npm run test:jest -- --watch # Run tests in watch mode
npm run build               # Build for production
```

---

**Remember:** Always run `npm run auto-fix` first - it handles 90% of common errors automatically using the testing infrastructure!

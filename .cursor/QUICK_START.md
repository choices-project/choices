# Quick Start Guide - Choices Platform

**Created:** January 27, 2025  
**Updated:** January 27, 2025  
**Purpose:** Get agents up and running quickly with the right commands

## 🚀 30-Second Setup

### **1. Auto-Fix Everything**
```bash
npm run auto-fix
```
**This fixes 90% of common errors automatically using the testing infrastructure.**

### **2. Verify Status**
```bash
npm run types:strict && npm run lint:gradual
```
**Check that TypeScript and ESLint are clean.**

### **3. Run Tests**
```bash
npm run test:all
```
**Verify everything is working.**

## 🎯 Essential Commands

### **Daily Workflow**
```bash
# Start your day
npm run auto-fix

# Develop with tests
npm run test:jest -- --watch

# Check before committing
npm run auto-fix:test
```

### **When Things Break**
```bash
# Fix everything automatically
npm run auto-fix

# If still broken, check specific issues
npm run types:strict
npm run lint:gradual
npm run test:jest
```

### **Quality Assurance**
```bash
# Full system check
npm run ci:verify:deploy

# Security check
npm run test:security

# Performance check
npm run test:performance
```

## 🔧 Development Commands

### **Start Development**
```bash
npm run dev                    # Start dev server
npm run test:jest -- --watch   # Run tests in watch mode
```

### **Testing**
```bash
npm run test:jest              # Unit tests
npm run test:playwright        # E2E tests
npm run test:security         # Security tests
npm run test:performance      # Performance tests
```

### **Code Quality**
```bash
npm run auto-fix              # Fix errors automatically
npm run types:strict          # TypeScript check
npm run lint:gradual          # ESLint check
npm run check                 # Full quality check
```

## 🚨 Emergency Fixes

### **When Everything is Broken**
```bash
# Nuclear option - fix everything
npm run auto-fix && npm run test:all
```

### **When Tests Fail**
```bash
# Check what's failing
npm run test:jest -- --verbose

# Fix and re-test
npm run auto-fix && npm run test:jest
```

### **When TypeScript Errors**
```bash
# Auto-fix first
npm run auto-fix

# Check remaining errors
npm run types:strict

# Fix manually if needed
```

## 📊 Status Check

### **Quick Health Check**
```bash
npm run auto-fix && npm run test:all
```

### **Detailed Status**
```bash
npm run types:strict && npm run lint:gradual && npm run test:all
```

### **Production Ready**
```bash
npm run ci:verify:deploy
```

## 🎯 Success Indicators

### **✅ Good Status**
- Auto-fix completes without errors
- All tests pass
- TypeScript strict mode passes
- ESLint shows minimal warnings

### **❌ Needs Attention**
- Auto-fix fails
- Tests failing
- TypeScript errors
- ESLint errors

## 🔄 Common Workflows

### **Feature Development**
```bash
# 1. Start clean
npm run auto-fix

# 2. Develop with tests
npm run test:jest -- --watch

# 3. Test E2E
npm run test:playwright

# 4. Final check
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

### **Use Auto-Fix First**
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

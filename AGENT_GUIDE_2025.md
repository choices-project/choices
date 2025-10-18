# Agent Guide 2025 - Choices Platform
**The Complete Onboarding Guide for AI Agents**

**Created:** January 27, 2025  
**Updated:** October 18, 2025  
**Status:** 🎯 **COMPREHENSIVE AGENT ONBOARDING** - Single Source of Truth  
**Version:** 2.0 - Enhanced with Real-World Experience  
**Current System Date:** October 18, 2025 (Always check with `date` command)

---

## 🎯 **MISSION STATEMENT**

You are working on the **Choices Platform** - a modern, secure, and scalable civic engagement platform built with Next.js 15, React 19, TypeScript 5.9, and ESLint 9. Your mission is to maintain the highest standards of code quality, security, and user experience while following established best practices.

**This guide contains everything you need to know to work effectively on this project.**

---

## 📋 **CRITICAL BEHAVIORAL REQUIREMENTS**

### **1. COMPREHENSIVE FILE ANALYSIS**
- **ALWAYS** read the entirety of any file you work on
- **ALWAYS** check for outdated comments, misleading implementations, or hidden issues
- **ALWAYS** ensure comments are current and accurate
- **ALWAYS** verify no TODO comments or temporary code remains

### **2. RESEARCH-FIRST APPROACH**
- **ALWAYS** research if an implementation already exists in the codebase
- **ALWAYS** check for existing patterns, utilities, or solutions
- **ALWAYS** avoid duplicating functionality
- **ALWAYS** build upon existing architecture

### **3. ERROR-FREE IMPLEMENTATION**
- **ALWAYS** fix ALL errors in any file you modify
- **ALWAYS** ensure TypeScript compilation passes
- **ALWAYS** ensure ESLint passes without errors
- **ALWAYS** test your changes thoroughly

### **4. CURRENT DATE AWARENESS**
- **ALWAYS** check the system date using `date` command
- **ALWAYS** use the actual current date, not arbitrary dates
- **ALWAYS** update timestamps in documentation
- **ALWAYS** ensure date references are accurate
- **ALWAYS** mark "Updated" dates only when files are actually modified

### **5. SCRATCH DIRECTORY USAGE**
- **ALWAYS** use `/Users/alaughingkitsune/src/Choices/scratch/` for temporary files
- **ALWAYS** generate reports, analysis, and temporary content in scratch
- **ALWAYS** clean up scratch directory when appropriate
- **NEVER** commit scratch directory contents

---

## 🏗️ **SYSTEM ARCHITECTURE OVERVIEW**

### **Core Technology Stack**
- **Framework:** Next.js 15.5.6 (App Router)
- **Frontend:** React 19.0.0
- **Language:** TypeScript 5.9.3
- **Linting:** ESLint 9.38.0 (Flat Config)
- **Styling:** Tailwind CSS 3.4.17
- **Testing:** Jest 30.2.0, Playwright 1.56.1
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth + Native WebAuthn API

### **Project Structure**
```
/Users/alaughingkitsune/src/Choices/
├── web/                          # Main application
│   ├── app/                      # Next.js 15 App Router
│   ├── components/               # Shared components
│   ├── features/                 # Feature-based modules
│   ├── lib/                      # Utility libraries
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Utility functions
│   ├── types/                    # TypeScript definitions
│   └── tests/                    # Test files
├── docs/                         # Documentation
├── scripts/                      # Build and utility scripts
├── policy/                       # Security policies
└── scratch/                      # Temporary files (use this!)
```

---

## 🔧 **DEVELOPMENT WORKFLOW**

### **1. Pre-Development Checklist**
- [ ] **Check system date** using `date` command
- [ ] Read the entire file you're working on
- [ ] Check for existing implementations
- [ ] Research current best practices
- [ ] Understand the system architecture
- [ ] Plan your approach thoroughly
- [ ] Use scratch directory for temporary files

### **2. During Development**
- [ ] Follow established patterns
- [ ] Maintain code consistency
- [ ] Write clear, current comments
- [ ] Fix all errors immediately
- [ ] Test your changes
- [ ] Use current dates (check with `date` command)

### **3. Post-Development**
- [ ] Verify no errors remain
- [ ] Update documentation if needed
- [ ] Ensure comments are current
- [ ] Test functionality thoroughly
- [ ] Update timestamps appropriately
- [ ] Clean up scratch directory

---

## 📁 **KEY FILES TO UNDERSTAND**

### **Configuration Files**
- `web/tsconfig.json` - TypeScript 5.9.3 configuration
- `web/eslint.config.js` - ESLint 9 flat configuration
- `web/next.config.js` - Next.js 15.5.6 configuration
- `web/jest.config.js` - Jest 30.2.0 configuration
- `web/tailwind.config.js` - Tailwind CSS configuration
- `web/playwright.config.optimized.ts` - Optimized Playwright configuration

### **Core Application Files**
- `web/app/layout.tsx` - Root layout
- `web/app/page.tsx` - Home page
- `web/middleware.ts` - Next.js middleware
- `web/lib/supabase/` - Supabase client configuration
- `web/features/auth/` - Authentication system (Native WebAuthn)
- `web/features/polls/` - Polling system
- `web/features/admin/` - Admin dashboard

### **Documentation Files**
- `WEBAUTHN_MIGRATION_ROADMAP.md` - WebAuthn implementation status
- `CONFIGURATION_AUDIT_REPORT_2025.md` - Configuration audit results
- `COMPREHENSIVE_MIGRATION_PLAN_2025.md` - Migration planning
- `TESTING_ARCHITECTURE_DIAGRAM.md` - Testing architecture

---

## 🚨 **CRITICAL SYSTEM STATUS**

### **✅ COMPLETED MAJOR UPGRADES**
- **Next.js 15.5.6** - Successfully upgraded from 14.2.32
- **React 19.0.0** - Successfully upgraded from 18.2.0
- **TypeScript 5.9.3** - Successfully upgraded from 5.7.2
- **ESLint 9.38.0** - Successfully upgraded from 8.57.1
- **WebAuthn Migration** - Native API implementation complete
- **Build System** - All critical build issues resolved
- **E2E Testing Suite** - Comprehensive testing framework built

### **🔄 CURRENT STATUS**
- **Build System:** ✅ Working (Next.js 15.5.6)
- **TypeScript:** ✅ Strict mode enabled
- **ESLint:** ✅ Flat config system
- **Testing:** ✅ Jest 30.2.0 + Playwright 1.56.1
- **Dependencies:** ✅ All locked to exact versions
- **WebAuthn:** ✅ Native API implementation (no @simplewebauthn)

### **⚠️ REMAINING TASKS**
- **Linting Errors:** 8551 problems (7838 errors, 713 warnings)
- **TypeScript Errors:** Various type safety issues
- **Code Quality:** Nullish coalescing, console statements, any types
- **Testing:** Enhanced test coverage needed

---

## 🎯 **GOLD STANDARD PRACTICES**

### **1. Code Quality Standards**
- **TypeScript:** Use strict typing, avoid `any`, prefer type guards
- **ESLint:** Follow all rules, fix errors immediately
- **Comments:** Keep current, remove outdated information
- **Naming:** Use descriptive, consistent naming conventions
- **Structure:** Follow established patterns and architecture

### **2. Security Standards**
- **Authentication:** Use Supabase Auth + Native WebAuthn API
- **Data Protection:** Implement proper validation and sanitization
- **CSP Headers:** Maintain comprehensive security headers
- **Secrets:** Never commit sensitive information
- **Dependencies:** Keep all dependencies current and secure

### **3. Performance Standards**
- **Bundle Size:** Optimize imports and tree-shaking
- **Loading:** Implement proper loading states
- **Caching:** Use appropriate caching strategies
- **Images:** Optimize images and use modern formats
- **Code Splitting:** Implement proper code splitting

### **4. Testing Standards**
- **Unit Tests:** Write comprehensive unit tests
- **Integration Tests:** Test component interactions
- **E2E Tests:** Use Playwright for end-to-end testing
- **Coverage:** Maintain high test coverage
- **Quality:** Write meaningful, non-trivial tests

---

## 📚 **ESSENTIAL KNOWLEDGE BASE**

### **Next.js 15 App Router**
- Use `async` components for server-side data fetching
- Implement proper error boundaries
- Use `headers()` and `cookies()` as async functions
- Handle `params` as `Promise<{ id: string }>`
- Implement proper loading and error states

### **React 19 Features**
- Use `use()` hook for promises
- Implement proper Suspense boundaries
- Handle concurrent features
- Use modern React patterns
- Optimize for React 19 performance

### **TypeScript 5.9 Best Practices**
- Use strict type checking
- Implement proper type guards
- Use modern TypeScript features
- Avoid `any` types
- Use proper type assertions

### **ESLint 9 Flat Config**
- Use modern flat configuration
- Implement proper rule sets
- Use type-aware linting
- Follow security best practices
- Maintain code quality standards

### **Native WebAuthn API**
- **Status:** ✅ Fully implemented (no @simplewebauthn dependencies)
- **Client:** `web/features/auth/lib/webauthn/native/client.ts`
- **Server:** `web/features/auth/lib/webauthn/native/server.ts`
- **API Endpoints:** `/api/v1/auth/webauthn/native/`
- **Features:** Registration, authentication, biometric support

---

## 🔍 **RESEARCH METHODOLOGY**

### **Before Implementing Any Feature**
1. **Search the codebase** for existing implementations
2. **Check documentation** for established patterns
3. **Research best practices** for the technology stack
4. **Understand the architecture** and design decisions
5. **Plan the implementation** thoroughly
6. **Use scratch directory** for analysis and planning

### **Codebase Search Strategy**
- Use semantic search for functionality
- Check for similar implementations
- Look for established patterns
- Verify compatibility with current stack
- Ensure consistency with existing code

---

## 🧪 **TESTING INFRASTRUCTURE**

### **Jest Unit Tests**
- **Configuration:** `web/jest.config.js`
- **Setup:** `web/jest.setup.js`
- **Coverage:** 70% threshold
- **Status:** 648 tests (611 passed, 37 failed)

### **Playwright E2E Tests**
- **Configuration:** `web/playwright.config.optimized.ts`
- **Test Directory:** `web/tests/e2e/`
- **Coverage:** Authentication, polls, onboarding, admin, performance, accessibility
- **Status:** Comprehensive test suite built

### **Test Scripts**
```bash
# Unit tests
npm run test:jest
npm run test:coverage

# E2E tests
npm run test:e2e:optimized
npm run test:e2e:performance
npm run test:e2e:accessibility
npm run test:e2e:core

# All tests
npm run test:all
```

---

## 🚀 **DEFINITIVE NEXT STEPS**

### **Immediate Priority (Week 1)**
1. **Fix Critical Linting Errors**
   - Address 7838 ESLint errors systematically
   - Focus on type safety and code quality
   - Implement proper error handling

2. **Enhance TypeScript Safety**
   - Fix remaining type errors
   - Implement proper type guards
   - Remove `any` types where possible

3. **Improve Code Quality**
   - Replace `||` with `??` (nullish coalescing)
   - Replace `console.log` with proper logging
   - Fix unsafe operations with type guards

### **Short-term Goals (Week 2-3)**
1. **Complete Testing Coverage**
   - Enhance Jest test coverage
   - Implement Playwright E2E tests
   - Add performance testing

2. **Documentation Updates**
   - Update all documentation
   - Ensure accuracy and completeness
   - Add new features and changes

3. **Performance Optimization**
   - Optimize bundle size
   - Implement proper caching
   - Enhance loading performance

### **Long-term Goals (Month 1-2)**
1. **Advanced Features**
   - Implement advanced WebAuthn features
   - Add comprehensive admin tools
   - Enhance user experience

2. **Monitoring and Analytics**
   - Implement comprehensive monitoring
   - Add performance analytics
   - Enhance error tracking

3. **Security Enhancements**
   - Implement additional security measures
   - Add comprehensive audit logging
   - Enhance data protection

---

## 📋 **REQUIRED TODO LIST ITEMS**

### **Critical Tasks (Must Complete)**
- [ ] **Fix all linting errors** in any file you modify
- [ ] **Read entire files** before making changes
- [ ] **Research existing implementations** before creating new ones
- [ ] **Update comments** to be current and accurate
- [ ] **Fix all TypeScript errors** in modified files
- [ ] **Test all changes** thoroughly
- [ ] **Update documentation** when needed
- [ ] **Use current dates** (check with `date` command)
- [ ] **Use scratch directory** for temporary files

### **Quality Assurance Tasks**
- [ ] **Verify no TODO comments** remain in production code
- [ ] **Ensure no temporary code** is left behind
- [ ] **Check for outdated comments** and update them
- [ ] **Verify no hidden issues** exist in files
- [ ] **Maintain code consistency** with existing patterns
- [ ] **Follow established architecture** and design decisions

### **Research Tasks**
- [ ] **Search codebase** for existing functionality
- [ ] **Check documentation** for established patterns
- [ ] **Research best practices** for current technology stack
- [ ] **Understand system architecture** before making changes
- [ ] **Plan implementation** thoroughly before coding
- [ ] **Use scratch directory** for analysis and planning

---

## 🎯 **SUCCESS CRITERIA**

### **Code Quality**
- ✅ Zero TypeScript errors
- ✅ Zero ESLint errors
- ✅ High test coverage
- ✅ Clean, maintainable code
- ✅ Current, accurate comments

### **System Performance**
- ✅ Fast build times
- ✅ Optimized bundle size
- ✅ Fast loading times
- ✅ Responsive user interface
- ✅ Efficient data handling

### **Security**
- ✅ Secure authentication (Native WebAuthn)
- ✅ Data protection
- ✅ Input validation
- ✅ Secure headers
- ✅ No sensitive data exposure

### **User Experience**
- ✅ Intuitive interface
- ✅ Fast interactions
- ✅ Error-free functionality
- ✅ Accessible design
- ✅ Mobile-friendly

---

## 🚨 **CRITICAL WARNINGS**

### **NEVER DO THESE**
- ❌ **Never** commit sensitive information
- ❌ **Never** leave TODO comments in production
- ❌ **Never** ignore linting errors
- ❌ **Never** skip testing
- ❌ **Never** use outdated patterns
- ❌ **Never** duplicate existing functionality
- ❌ **Never** leave temporary code
- ❌ **Never** ignore security concerns
- ❌ **Never** commit scratch directory contents

### **ALWAYS DO THESE**
- ✅ **Always** read entire files before modifying
- ✅ **Always** research existing implementations
- ✅ **Always** fix all errors immediately
- ✅ **Always** test your changes
- ✅ **Always** update documentation
- ✅ **Always** use current dates (check with `date` command)
- ✅ **Always** follow established patterns
- ✅ **Always** maintain code quality
- ✅ **Always** use scratch directory for temporary files

---

## 📞 **SUPPORT RESOURCES**

### **Documentation**
- `WEBAUTHN_MIGRATION_ROADMAP.md` - WebAuthn implementation
- `CONFIGURATION_AUDIT_REPORT_2025.md` - Configuration details
- `COMPREHENSIVE_MIGRATION_PLAN_2025.md` - Migration planning
- `TESTING_ARCHITECTURE_DIAGRAM.md` - Testing architecture

### **Key Files for Reference**
- `web/tsconfig.json` - TypeScript configuration
- `web/eslint.config.js` - ESLint configuration
- `web/next.config.js` - Next.js configuration
- `web/jest.config.js` - Jest configuration
- `web/tailwind.config.js` - Tailwind configuration
- `web/playwright.config.optimized.ts` - Playwright configuration

### **Architecture Understanding**
- `web/app/` - Next.js 15 App Router structure
- `web/features/` - Feature-based architecture
- `web/lib/` - Utility libraries
- `web/components/` - Shared components
- `web/hooks/` - Custom React hooks

### **Scratch Directory**
- `scratch/` - Use this for temporary files, reports, analysis
- **Examples:** `scratch/testing-optimization-report-2025-10-18.md`
- **Purpose:** Temporary files, analysis, planning documents
- **Cleanup:** Remove when no longer needed

---

## 🎯 **FINAL REMINDER**

You are working on a **production-ready, enterprise-grade platform** that serves real users. Every change you make affects the user experience, security, and performance. Maintain the highest standards of code quality, follow established patterns, and always prioritize the user experience.

**Remember:** This is not just code - it's a platform that enables civic engagement and democratic participation. Your work has real-world impact.

### **Key Success Factors:**
1. **Research First:** Always check for existing implementations
2. **Quality Focus:** Fix all errors, maintain high standards
3. **Documentation:** Keep everything current and accurate
4. **Testing:** Comprehensive testing for all changes
5. **Scratch Usage:** Use scratch directory for temporary work
6. **Current Dates:** Always check system date with `date` command

---

**Guide Created:** January 27, 2025  
**Last Updated:** October 18, 2025  
**Status:** 🎯 **COMPREHENSIVE AGENT ONBOARDING**  
**Next Agent:** Follow this guide religiously for optimal results
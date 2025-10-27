# 🎯 Core Rules - Choices Platform

**Essential Development Rules for Democratic Engagement Platform**

---

## 📋 Overview

Core development rules and principles for building the Choices platform - a democratic engagement platform focused on civic participation, polling, and representative engagement.

**Last Updated**: October 27, 2025  
**Status**: Production Ready  
**Focus**: Quality, security, and democratic engagement

---

## 🚀 Core Principles

### **1. Auto-Fix First, Always**
```bash
npm run auto-fix
```
**Rule:** Before making any changes, run auto-fix to resolve 90% of common errors automatically.

### **2. Choices Platform Testing**
```bash
npm run test:both-journeys-complete
```
**Rule:** Always test the core platform functionality - user journey and admin journey.

### **3. Quality Gates**
```bash
npm run types:strict && npm run lint:gradual
```
**Rule:** All code must pass TypeScript strict mode and ESLint before proceeding.

### **4. Security First**
```bash
npm run security:audit
```
**Rule:** Security considerations are paramount in democratic engagement platforms.

---

## 🚫 What NOT to Do

### **Never Skip These Steps**
- ❌ Don't make changes without running `npm run auto-fix` first
- ❌ Don't commit code with TypeScript errors
- ❌ Don't ignore test failures
- ❌ Don't bypass security checks
- ❌ Don't use `any` types without justification
- ❌ Don't break core platform functionality

### **Never Break These**
- ❌ Don't break existing tests
- ❌ Don't introduce new linting errors
- ❌ Don't compromise security
- ❌ Don't ignore performance implications
- ❌ Don't break user journey or admin journey
- ❌ Don't compromise democratic engagement features

### **Choices Platform Specific**
- ❌ Don't hardcode API keys or secrets
- ❌ Don't bypass RLS policies
- ❌ Don't ignore trust tier validation
- ❌ Don't compromise anonymous access
- ❌ Don't break civics backend integration
- ❌ Don't ignore privacy protection

---

## ✅ What TO Do

### **Always Do These**
- ✅ Run `npm run auto-fix` before starting work
- ✅ Write tests for new features
- ✅ Use proper TypeScript types
- ✅ Follow the established patterns
- ✅ Document complex logic
- ✅ Test core platform functionality

### **Choices Platform Specific**
- ✅ Test user journey (polling, voting, sharing)
- ✅ Test admin journey (moderation, analytics)
- ✅ Test civics backend (representative lookup)
- ✅ Test security features (authentication, RLS)
- ✅ Test trust tier system
- ✅ Test anonymous access functionality

### **Quality Standards**
- ✅ All functions must have proper types
- ✅ All components must be tested
- ✅ All API endpoints must have E2E tests
- ✅ All security features must be verified
- ✅ All civics features must be tested
- ✅ All polling features must be tested

---

## 🔧 Development Workflow

### **Step 1: Preparation**
```bash
npm run auto-fix
npm run types:strict
npm run lint:gradual
npm run security:audit
```

### **Step 2: Development**
```bash
npm run test:jest -- --watch
# Make changes while tests run
```

### **Step 3: Choices Platform Testing**
```bash
npm run test:user-journey-complete
npm run test:admin-journey-complete
npm run test:platform-journey-modern
```

### **Step 4: Verification**
```bash
npm run test:both-journeys-complete
npm run auto-fix:test
npm run security:audit
```

### **Step 5: Final Check**
```bash
npm run qa:complete
npm run health:platform
```

---

## 🎯 Focus Areas

### **High Priority**
1. **Error-Free Code**: Use auto-fix and testing infrastructure
2. **Type Safety**: Strict TypeScript, no `any` types
3. **Test Coverage**: All features must be tested
4. **Security**: All security tests must pass
5. **Performance**: No performance regressions
6. **Choices Functionality**: Core platform features must work
7. **Democratic Engagement**: Features must enhance civic participation

### **Code Quality**
- Use meaningful variable names
- Write self-documenting code
- Follow established patterns
- Keep functions small and focused
- Add proper error handling
- Consider democratic engagement context
- Respect user privacy and anonymity

### **Choices Platform Specific**
- **Polling System**: Ensure voting works correctly
- **Civics Integration**: Verify representative lookup
- **Analytics**: Protect user privacy in analytics
- **Admin Panel**: Secure admin functionality
- **Authentication**: Implement proper WebAuthn
- **Trust Tiers**: Validate trust tier system

---

## 🔒 Security Rules

### **Authentication & Authorization**
- ✅ Use WebAuthn/passkeys as primary authentication
- ✅ Implement proper session management
- ✅ Use RLS policies for all database access
- ✅ Validate trust tiers properly
- ✅ Support anonymous access where appropriate

### **Data Protection**
- ✅ Never hardcode secrets or API keys
- ✅ Use environment variables for configuration
- ✅ Implement proper input validation
- ✅ Protect user privacy in analytics
- ✅ Use differential privacy where needed

### **API Security**
- ✅ Implement rate limiting
- ✅ Validate all inputs with Zod schemas
- ✅ Handle errors without exposing sensitive data
- ✅ Use proper CORS configuration
- ✅ Implement proper authentication checks

---

## 🗳️ Democratic Engagement Rules

### **Accessibility**
- ✅ Ensure platform is accessible to all users
- ✅ Support anonymous participation
- ✅ Provide clear voting instructions
- ✅ Make representative lookup easy
- ✅ Support multiple languages where possible

### **Transparency**
- ✅ Make poll results transparent
- ✅ Provide clear privacy policies
- ✅ Explain trust tier system
- ✅ Document civic data sources
- ✅ Make analytics transparent

### **Fairness**
- ✅ Ensure equal voting power
- ✅ Prevent vote manipulation
- ✅ Implement proper moderation
- ✅ Respect user privacy
- ✅ Provide equal access to features

---

## 🚨 Emergency Procedures

### **When Tests Fail**
```bash
# 1. Run auto-fix
npm run auto-fix

# 2. Check specific failures
npm run test:jest -- --verbose

# 3. Test core functionality
npm run test:both-journeys-complete

# 4. Fix and re-test
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

### **When Security Issues**
```bash
# 1. Run security audit
npm run security:audit

# 2. Check for secrets
npm run security:secrets

# 3. Validate authentication
npm run security:auth

# 4. Test RLS policies
npm run security:rls
```

### **When Civics Backend Issues**
```bash
# 1. Test civics health
npm run health:civics

# 2. Test representative lookup
npm run test:representative-lookup

# 3. Test data ingestion
npm run test:data-ingestion

# 4. Check API connectivity
npm run test:civics-backend-health
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
- ✅ User journey and admin journey work

### **Red Status (Fix Required)**
- ❌ Auto-fix fails
- ❌ Tests failing
- ❌ TypeScript errors
- ❌ ESLint errors
- ❌ Security vulnerabilities
- ❌ Performance regressions
- ❌ Civics backend issues
- ❌ Core platform functionality broken

---

## 🔄 Iterative Improvement

### **Daily Routine**
1. Run `npm run auto-fix`
2. Check `npm run types:strict`
3. Run `npm run test:both-journeys-complete`
4. Fix any issues found
5. Repeat until green

### **Weekly Review**
1. Run `npm run qa:complete`
2. Check security with `npm run security:audit`
3. Verify performance with `npm run analytics:performance`
4. Test civics backend with `npm run health:civics`
5. Update documentation

---

## 🎯 Agent Success Criteria

### **Must Have**
- All tests passing (including Choices-specific)
- No TypeScript errors
- Minimal ESLint warnings
- Security tests passing
- Performance tests passing
- Core platform functionality working

### **Should Have**
- Good test coverage
- Clean code structure
- Proper error handling
- Good documentation
- Performance optimizations
- Democratic engagement features working

### **Could Have**
- Advanced features
- Complex integrations
- Performance enhancements
- User experience improvements
- Additional civic engagement features

---

## 💡 Pro Tips

### **Choices Platform Specific**
- Always test the complete user journey
- Always test admin functionality
- Always verify civics backend integration
- Always check security and privacy
- Always consider democratic engagement impact

### **Development Best Practices**
- Use auto-fix first, always
- Keep tests running while developing
- Test core functionality before committing
- Document complex democratic engagement logic
- Consider accessibility and inclusivity

---

**Remember:** The Choices platform is about democratic engagement. Every feature should enhance civic participation and make democracy more accessible. Always test the core functionality and never compromise on security or user privacy!

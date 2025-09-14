# Contributing to Choices Platform

**Created:** December 19, 2024  
**Updated:** December 19, 2024  
**Status:** ✅ **COMPREHENSIVE CONTRIBUTION GUIDELINES**

## 🤝 **Welcome Contributors!**

Thank you for your interest in contributing to the Choices platform! This guide will help you understand our development process, coding standards, and how to make meaningful contributions to our privacy-first polling platform.

## 🚀 **Quick Start**

### **Prerequisites**
- **Node.js** 22.x
- **npm** 10.9.3
- **Git** with GitHub account
- **Supabase account** (for backend development)

### **Development Setup**
```bash
# Clone the repository
git clone https://github.com/choices-project/choices.git
cd choices

# Install dependencies
npm install

# Set up environment
cd web
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

## 📋 **Development Workflow**

### **1. Fork and Clone**
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/choices.git
cd choices
git remote add upstream https://github.com/choices-project/choices.git
```

### **2. Create Feature Branch**
```bash
# Create a new branch for your feature
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### **3. Development Process**
```bash
# Make your changes
# Run tests
npm run test
npm run test:e2e

# Run linting
npm run lint
npm run type-check

# Commit with conventional commits
git add .
git commit -m "feat: add new polling feature"
```

### **4. Pre-commit Hooks**
Our pre-commit hooks will automatically run:
- **Security scanning** - Prevents secrets from being committed
- **Code quality checks** - ESLint and TypeScript validation
- **Test execution** - Ensures tests pass before commit

### **5. Push and Create PR**
```bash
# Push your branch
git push origin feature/your-feature-name

# Create a pull request on GitHub
# Ensure all CI checks pass
```

## 🏗️ **Project Structure**

### **Monorepo Organization**
```
choices/
├── web/                           # Next.js frontend application
│   ├── app/                      # App Router pages and API routes
│   ├── components/               # React components
│   ├── features/                 # Feature-based organization
│   │   ├── auth/                 # Authentication system
│   │   ├── civics/               # Civics data integration
│   │   ├── polls/                # Polling system
│   │   └── webauthn/             # WebAuthn implementation
│   ├── shared/                   # Shared utilities and components
│   ├── hooks/                    # React hooks
│   └── utils/                    # Helper functions
├── docs/                         # Comprehensive documentation
├── scripts/                      # Build and deployment scripts
├── tests/                        # Test configuration and utilities
└── supabase/                     # Database migrations and config
```

### **Feature-Based Development**
- **Features are self-contained** - Each feature has its own directory
- **Shared code in `shared/`** - Common utilities and components
- **Clear separation** - Features don't directly import from each other
- **Consistent structure** - Each feature follows the same organization pattern

## 🔧 **Development Standards**

### **Code Quality**
- **TypeScript** - Full type safety, no `any` types
- **ESLint** - Strict linting rules with zero warnings
- **Prettier** - Consistent code formatting
- **Conventional Commits** - Standardized commit messages

### **Testing Requirements**
- **Unit Tests** - Jest for component and utility testing
- **E2E Tests** - Playwright for full user journey testing
- **Test Coverage** - Maintain high test coverage
- **Test Quality** - Meaningful tests, not just coverage

### **Security Standards**
- **No Secrets in Code** - Use environment variables
- **Input Validation** - Validate and sanitize all inputs
- **Secure Defaults** - Implement secure-by-default configurations
- **Security Reviews** - Security-focused code reviews

## 🧪 **Testing Guidelines**

### **Running Tests**
```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test with UI
npm run test:e2e:ui

# Test coverage
npm run test:coverage
```

### **Writing Tests**
- **Test Behavior** - Test what the code does, not how it does it
- **Meaningful Assertions** - Avoid trivial tests
- **Edge Cases** - Test boundary conditions and error cases
- **Mock External Dependencies** - Isolate units under test

### **Test Organization**
- **Unit Tests** - `__tests__/` directories or `.test.ts` files
- **E2E Tests** - `tests/e2e/` directory
- **Test Utilities** - `tests/` directory for shared test utilities

## 🔒 **Security Guidelines**

### **Security-Sensitive Changes**
- **Discuss First** - Security changes require team discussion
- **No PII in Issues/PRs** - Never include personal information
- **Security Reviews** - All security changes require security review
- **Documentation** - Document security implications

### **Neutrality Safeguards**
- **Poll Selection** - Requires two independent proposers + public comment
- **Reproducible Code** - All tally code must be reproducible
- **Transparency** - Publish methods and hashes in releases
- **Community Health** - Add CHAOSS metrics dashboards

### **Pre-commit Security**
Our pre-commit hooks automatically check for:
- **JWT tokens** - Prevents accidental token commits
- **API keys** - Blocks hardcoded API keys
- **Database URLs** - Prevents credential exposure
- **Supabase keys** - Blocks Supabase key commits
- **Sensitive files** - Prevents .env, .key, .db file commits

## 📝 **Documentation Standards**

### **Code Documentation**
- **JSDoc Comments** - Document public APIs
- **README Files** - Feature-specific documentation
- **Type Definitions** - Comprehensive TypeScript types
- **Examples** - Provide usage examples

### **Commit Messages**
Use conventional commit format:
```
feat: add new polling feature
fix: resolve authentication issue
docs: update API documentation
style: format code with prettier
refactor: reorganize component structure
test: add unit tests for auth module
chore: update dependencies
```

### **Pull Request Description**
Include:
- **What** - Description of changes
- **Why** - Reason for changes
- **How** - Implementation approach
- **Testing** - How changes were tested
- **Breaking Changes** - Any breaking changes

## 🚀 **Deployment Process**

### **CI/CD Pipeline**
- **Automated Testing** - All tests must pass
- **Security Scanning** - gitleaks, CodeQL, OSV scanner
- **Code Quality** - ESLint, TypeScript, build validation
- **Deployment** - Automatic deployment on PR merge

### **Branch Protection**
- **Required PRs** - No direct pushes to main
- **Status Checks** - All CI checks must pass
- **Reviews** - Code review required
- **Linear History** - Clean commit history

## 🎯 **Contribution Areas**

### **High Priority**
- **Bug Fixes** - Critical issues and regressions
- **Security Improvements** - Security enhancements
- **Performance** - Performance optimizations
- **Documentation** - Improving documentation

### **Medium Priority**
- **New Features** - Feature additions
- **UI/UX Improvements** - User experience enhancements
- **Testing** - Test coverage improvements
- **Code Quality** - Refactoring and cleanup

### **Low Priority**
- **Nice-to-have Features** - Non-critical features
- **Cosmetic Changes** - UI polish
- **Experimental Features** - Proof of concepts

## 🤝 **Community Guidelines**

### **Code of Conduct**
- **Be Respectful** - Treat everyone with respect
- **Be Inclusive** - Welcome contributors from all backgrounds
- **Be Constructive** - Provide helpful feedback
- **Be Patient** - Understand that everyone is learning

### **Communication**
- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and ideas
- **Pull Requests** - Code contributions
- **Security Issues** - Use security@choices-platform.org

## 📊 **Review Process**

### **Pull Request Review**
- **Automated Checks** - CI/CD pipeline validation
- **Code Review** - Human review of code changes
- **Security Review** - Security-focused review for sensitive changes
- **Testing** - Verification that tests pass and coverage is maintained

### **Review Criteria**
- **Functionality** - Does the code work as intended?
- **Quality** - Is the code well-written and maintainable?
- **Security** - Are there any security implications?
- **Testing** - Are there adequate tests?
- **Documentation** - Is the code properly documented?

## 🎉 **Recognition**

### **Contributor Recognition**
- **Contributors List** - GitHub contributors page
- **Release Notes** - Recognition in release notes
- **Community Highlights** - Featured contributions
- **Long-term Contributors** - Special recognition for sustained contributions

## 📚 **Resources**

### **Documentation**
- **[Project README](../../README.md)** - Project overview
- **[System Architecture](SYSTEM_ARCHITECTURE_OVERVIEW.md)** - Technical architecture
- **[Security Policy](SECURITY.md)** - Security guidelines
- **[Testing Guide](../testing/COMPREHENSIVE_TESTING_GUIDE.md)** - Testing procedures

### **Development Tools**
- **[Developer Cheat Sheet](../development/DEVELOPER_CHEAT_SHEET.md)** - Useful commands
- **[Onboarding Guide](../development/ONBOARDING.md)** - Setup instructions
- **[API Documentation](../API.md)** - API reference

## 🆘 **Getting Help**

### **Support Channels**
- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions and community discussion
- **Security Issues** - security@choices-platform.org
- **Documentation** - Check existing documentation first

### **Common Issues**
- **Build Errors** - Check Node.js version and dependencies
- **Test Failures** - Ensure all tests pass locally
- **Linting Errors** - Run `npm run lint:fix` to auto-fix
- **Type Errors** - Check TypeScript configuration

---

**Thank you for contributing to Choices Platform!** 🎉

**Last Updated:** December 19, 2024  
**Contributing Guide Version:** 2.0  
**Questions?** Open a GitHub issue or discussion

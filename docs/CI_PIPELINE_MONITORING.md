# CI Pipeline Monitoring System

## Overview

This document describes the comprehensive CI pipeline monitoring system that automatically catches issues before they reach production. The system includes pre-push validation, Git hooks, real-time monitoring, and automated checks.

## 🎯 Goals

- **Catch Issues Early**: Prevent broken builds from reaching GitHub
- **Automated Validation**: Run all CI checks locally before pushing
- **Real-time Monitoring**: Track GitHub Actions and Vercel deployment status
- **Consistent Quality**: Ensure code quality standards are maintained
- **Developer Experience**: Provide clear feedback and guidance

## 📁 File Structure

```
scripts/ci/
├── pre-push-validation.sh    # Comprehensive pre-push checks
├── ci-monitor.js            # Real-time CI monitoring
├── git-hooks.sh             # Git hooks setup script
├── run-checks.sh            # Manual CI validation
└── ci-config.json          # CI configuration settings
```

## 🚀 Quick Start

### 1. Setup Git Hooks (One-time)

```bash
# Run from project root
bash scripts/ci/git-hooks.sh
```

This installs:
- **Pre-push hook**: Runs CI validation before pushing
- **Pre-commit hook**: Basic checks before committing
- **Commit-msg hook**: Validates commit message format
- **Post-merge hook**: Handles dependency updates

### 2. Manual CI Validation

```bash
# Run comprehensive checks manually
bash scripts/ci/run-checks.sh

# Or run pre-push validation directly
bash scripts/ci/pre-push-validation.sh
```

### 3. Real-time Monitoring

```bash
# Start continuous monitoring
node scripts/ci/ci-monitor.js

# Check once and exit
node scripts/ci/ci-monitor.js --once

# Only check local environment
node scripts/ci/ci-monitor.js --local-only
```

## 🔍 Pre-push Validation

The pre-push validation script runs the same checks that GitHub Actions will run:

### Checks Performed

1. **Prerequisites**
   - Node.js and npm availability
   - Git installation
   - Project structure validation

2. **Dependencies**
   - `npm ci` for clean install
   - Dependency resolution

3. **Code Quality**
   - ESLint validation
   - TypeScript type checking
   - Code formatting

4. **Build Testing**
   - Production build test
   - Bundle size analysis
   - Static generation

5. **Common Issues**
   - `useSearchParams` without Suspense boundaries
   - `console.log` statements in production code
   - TODO/FIXME comments
   - Security vulnerabilities

6. **Git Status**
   - Working directory cleanliness
   - Branch validation
   - Commit message format

### Example Output

```
🔍 Starting pre-push CI validation...
==================================
ℹ️  Checking prerequisites...
✅ All prerequisites found
ℹ️  Installing dependencies...
✅ Dependencies installed
ℹ️  Running ESLint...
✅ ESLint passed
ℹ️  Running TypeScript type check...
✅ TypeScript type check passed
ℹ️  Testing production build...
✅ Production build successful
ℹ️  Checking for common issues...
⚠️  Found 9 TODO comments
ℹ️  Checking bundle size...
✅ Bundle size is 87.7kB - acceptable
ℹ️  Checking git status...
✅ Working directory is clean
✅ On feature branch: feature/ranked-choice-voting

==================================
✅ Pre-push validation completed successfully!
ℹ️  Ready to push to GitHub
```

## 📊 Real-time Monitoring

The CI monitor provides real-time status of:

### GitHub Actions
- Workflow run status
- Branch and commit information
- Build results
- Test outcomes

### Vercel Deployments
- Deployment status
- Preview URLs
- Build logs
- Performance metrics

### Local Environment
- Dependencies status
- Build readiness
- Configuration validation

### Example Monitor Output

```
🔍 CI Pipeline Monitor
=====================
📅 2025-01-17 14:30:25

✅ GitHub Actions: success
   Workflow: CI/CD Pipeline
   Branch: feature/ranked-choice-voting
   Commit: feat: enhance poll creation workflow...
   URL: https://github.com/choices-project/choices/actions/runs/123

✅ Vercel Deployment: ready
   URL: https://choices-platform.vercel.app
   Branch: feature/ranked-choice-voting
   Status: ready

✅ Local Environment: success
   Local environment ready

✅ HEALTHY: All systems operational

Press Ctrl+C to stop monitoring
```

## 🔧 Configuration

### CI Configuration (`scripts/ci/ci-config.json`)

```json
{
  "checks": {
    "linting": true,
    "typeChecking": true,
    "buildTest": true,
    "securityAudit": true,
    "bundleSize": true
  },
  "thresholds": {
    "maxBundleSizeKB": 200,
    "maxWarnings": 10,
    "maxTodos": 5
  },
  "notifications": {
    "slack": false,
    "email": false,
    "github": true
  },
  "environments": {
    "development": {
      "strictChecks": false,
      "allowWarnings": true
    },
    "production": {
      "strictChecks": true,
      "allowWarnings": false
    }
  }
}
```

### Environment Variables

```bash
# For GitHub Actions monitoring
export GITHUB_TOKEN="your_github_personal_access_token"

# For Vercel deployment monitoring
export VERCEL_TOKEN="your_vercel_api_token"
```

## 🎯 Git Hooks

### Pre-push Hook
- Runs before `git push`
- Executes full CI validation
- Prevents pushing if checks fail
- Can be bypassed with `--no-verify`

### Pre-commit Hook
- Runs before `git commit`
- Basic linting and formatting
- TODO/FIXME detection
- Commit message suggestions

### Commit-msg Hook
- Validates commit message format
- Enforces conventional commits
- Provides format guidance
- Can be bypassed with `--no-verify`

### Post-merge Hook
- Runs after `git merge`
- Updates dependencies if needed
- Environment file validation
- Configuration checks

## 🚨 Error Handling

### Common Issues and Solutions

#### 1. Build Failures
```
❌ Production build failed
```
**Solution**: Fix TypeScript errors, missing dependencies, or build configuration issues.

#### 2. Linting Errors
```
❌ ESLint failed
```
**Solution**: Run `npm run lint:fix` or manually fix linting issues.

#### 3. Bundle Size Warnings
```
⚠️  Bundle size is 250kB - consider optimization
```
**Solution**: Analyze bundle with `npm run analyze` and optimize imports.

#### 4. Security Vulnerabilities
```
⚠️  Security vulnerabilities found
```
**Solution**: Run `npm audit fix` or review and address vulnerabilities.

#### 5. useSearchParams Issues
```
⚠️  Found useSearchParams usage - ensure Suspense boundaries are in place
```
**Solution**: Wrap components using `useSearchParams` in `<Suspense>` boundaries.

## 📈 Best Practices

### 1. Always Run Pre-push Validation
```bash
# Before pushing any changes
bash scripts/ci/pre-push-validation.sh
```

### 2. Use Conventional Commits
```bash
# Good commit messages
git commit -m "feat: add poll creation workflow"
git commit -m "fix(auth): resolve login redirect issue"
git commit -m "docs: update API documentation"
```

### 3. Monitor CI Status
```bash
# Check CI status before important changes
node scripts/ci/ci-monitor.js --once
```

### 4. Address Warnings Promptly
- Fix TODO comments before they accumulate
- Remove console.log statements from production code
- Keep bundle size under thresholds

### 5. Use Feature Branches
```bash
# Create feature branch for new work
git checkout -b feature/new-feature
# Work on feature
git add .
git commit -m "feat: implement new feature"
git push origin feature/new-feature
```

## 🔄 Integration with GitHub Actions

The local CI validation mirrors GitHub Actions workflow:

### GitHub Actions Workflow
```yaml
name: CI/CD Pipeline
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run build
```

### Local Validation
```bash
# Same checks as GitHub Actions
npm ci
npm run lint
npm run type-check
npm run build
```

## 🎯 Monitoring Workflow

### For Developers
1. **Before Committing**: Run pre-commit checks
2. **Before Pushing**: Run pre-push validation
3. **During Development**: Monitor CI status
4. **After Merging**: Check deployment status

### For CI/CD Pipeline
1. **GitHub Actions**: Automated validation on push/PR
2. **Vercel**: Automatic deployment on merge
3. **Monitoring**: Real-time status tracking
4. **Notifications**: Status updates and alerts

## 🚀 Advanced Usage

### Custom Validation Rules
Edit `scripts/ci/ci-config.json` to customize:
- Bundle size thresholds
- Warning limits
- Check configurations
- Environment settings

### Continuous Monitoring
```bash
# Start background monitoring
nohup node scripts/ci/ci-monitor.js > ci-monitor.log 2>&1 &

# Check logs
tail -f ci-monitor.log
```

### Integration with IDEs
Configure your IDE to run validation:
- **VS Code**: Add to tasks.json
- **WebStorm**: Configure external tools
- **Vim/Neovim**: Add to autocommands

## 📚 Troubleshooting

### Common Problems

#### 1. Hooks Not Running
```bash
# Check if hooks are executable
ls -la .git/hooks/

# Reinstall hooks
bash scripts/ci/git-hooks.sh
```

#### 2. Permission Denied
```bash
# Fix script permissions
chmod +x scripts/ci/*.sh
chmod +x scripts/ci/*.js
```

#### 3. Dependencies Missing
```bash
# Reinstall dependencies
cd web
rm -rf node_modules package-lock.json
npm install
```

#### 4. Build Cache Issues
```bash
# Clear build cache
cd web
rm -rf .next
npm run build
```

## 🎉 Success Metrics

The CI monitoring system is successful when:

- ✅ **Zero Build Failures**: All pushes pass CI validation
- ✅ **Fast Feedback**: Issues caught within minutes
- ✅ **Developer Confidence**: Team trusts the validation process
- ✅ **Quality Improvement**: Code quality metrics improve over time
- ✅ **Deployment Reliability**: Production deployments are stable

## 📞 Support

For issues with the CI monitoring system:

1. **Check Documentation**: Review this guide
2. **Run Diagnostics**: Use `bash scripts/ci/run-checks.sh`
3. **Review Logs**: Check CI monitor output
4. **Manual Validation**: Run individual checks
5. **Reset Hooks**: Reinstall with `bash scripts/ci/git-hooks.sh`

---

**Remember**: The goal is to catch issues early and often, not to block development. Use `--no-verify` sparingly and always address the underlying issues.

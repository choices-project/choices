# CI/CD Monitoring & Pull Request Management

## 🎯 **Automated Monitoring System**

### **Current Issue**
- **Problem**: Need to automatically wait for and monitor CI/CD pipeline results
- **Risk**: Pushing changes without ensuring they pass all checks
- **Solution**: Implement automated monitoring and blocking mechanisms

## 🔄 **Monitoring Workflow**

### **1. Pre-Push Validation**
```bash
# Before pushing any branch, run local checks
npm run test          # Frontend tests
npm run lint          # Code linting
npm run type-check    # TypeScript validation
go test ./...         # Backend tests
```

### **2. Automated CI/CD Monitoring**
```bash
# Monitor GitHub Actions status
gh run list --limit 10 --json status,conclusion,url

# Monitor specific workflow
gh run watch $(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')

# Check PR status
gh pr status
gh pr checks
```

### **3. Pull Request Management**
```bash
# Create PR with proper checks
gh pr create --title "feat: user authentication system" --body "Implements user authentication with WebAuthn integration"

# Monitor PR checks
gh pr checks

# Wait for all checks to pass
gh pr checks --watch
```

## 🤖 **Automated Monitoring Scripts**

### **1. PR Status Monitor**
```bash
#!/bin/bash
# monitor-pr.sh - Monitor pull request status

PR_NUMBER=$1
REPO="choices-project/choices"

echo "🔍 Monitoring PR #$PR_NUMBER..."

while true; do
    STATUS=$(gh pr checks $PR_NUMBER --json status,conclusion --jq '.[0].status')
    CONCLUSION=$(gh pr checks $PR_NUMBER --json status,conclusion --jq '.[0].conclusion')
    
    echo "$(date): Status: $STATUS, Conclusion: $CONCLUSION"
    
    if [ "$STATUS" = "completed" ]; then
        if [ "$CONCLUSION" = "success" ]; then
            echo "✅ All checks passed!"
            break
        else
            echo "❌ Checks failed! Please review:"
            gh pr checks $PR_NUMBER
            exit 1
        fi
    fi
    
    sleep 30  # Check every 30 seconds
done
```

### **2. CI/CD Pipeline Monitor**
```bash
#!/bin/bash
# monitor-ci.sh - Monitor CI/CD pipeline

WORKFLOW_ID=$1

echo "🔍 Monitoring workflow $WORKFLOW_ID..."

gh run watch $WORKFLOW_ID

if [ $? -eq 0 ]; then
    echo "✅ Pipeline completed successfully!"
else
    echo "❌ Pipeline failed! Check logs:"
    gh run view $WORKFLOW_ID
    exit 1
fi
```

### **3. Automated PR Creation with Monitoring**
```bash
#!/bin/bash
# create-pr-with-monitoring.sh

BRANCH_NAME=$1
TITLE=$2
BODY=$3

echo "🚀 Creating PR for branch: $BRANCH_NAME"

# Push branch
git push origin $BRANCH_NAME

# Create PR
PR_NUMBER=$(gh pr create --title "$TITLE" --body "$BODY" --json number --jq '.number')

echo "📋 Created PR #$PR_NUMBER"

# Monitor PR checks
./monitor-pr.sh $PR_NUMBER

if [ $? -eq 0 ]; then
    echo "✅ PR ready for review!"
    echo "🔗 PR URL: https://github.com/choices-project/choices/pull/$PR_NUMBER"
else
    echo "❌ PR checks failed! Please fix issues before merging."
    exit 1
fi
```

## 📋 **AI Assistant Monitoring Protocol**

### **Before Every Push**
1. **Run Local Tests**: Ensure all tests pass locally
2. **Check Linting**: Verify code style compliance
3. **Type Check**: Ensure TypeScript compilation
4. **Security Scan**: Run security checks

### **After Every Push**
1. **Monitor CI/CD**: Watch pipeline status
2. **Check PR Status**: Verify all checks pass
3. **Address Failures**: Fix any issues immediately
4. **Wait for Approval**: Don't merge until approved

### **Automated Blocking**
```bash
# Add to .git/hooks/pre-push
#!/bin/bash

echo "🧪 Running pre-push checks..."

# Run tests
npm run test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed! Please fix before pushing."
    exit 1
fi

# Run linting
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Linting failed! Please fix before pushing."
    exit 1
fi

# Run type check
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ Type check failed! Please fix before pushing."
    exit 1
fi

echo "✅ Pre-push checks passed!"
```

## 🔧 **GitHub Actions Configuration**

### **1. Enhanced CI Workflow**
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop, feature/* ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linting
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Security scan
        run: npm audit
      
      - name: Build check
        run: npm run build

  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Go
        uses: actions/setup-go@v3
        with:
          go-version: '1.21'
      
      - name: Run backend tests
        run: |
          cd server/ia && go test ./...
          cd ../po && go test ./...

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run security scan
        run: |
          # Check for secrets
          git secrets --scan
          
          # Check for vulnerabilities
          npm audit
```

### **2. PR Status Check**
```yaml
# .github/workflows/pr-check.yml
name: PR Status Check

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Check PR title format
        run: |
          if ! echo "${{ github.event.pull_request.title }}" | grep -E "^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+"; then
            echo "❌ PR title must follow conventional commit format"
            exit 1
          fi
      
      - name: Check PR description
        run: |
          if [ ${#{{ github.event.pull_request.body }}]} -lt 50 ]; then
            echo "❌ PR description must be at least 50 characters"
            exit 1
          fi
```

## 🚨 **Failure Handling Protocol**

### **When CI/CD Fails**
1. **Immediate Investigation**: Check logs and identify root cause
2. **Local Reproduction**: Reproduce issue locally
3. **Fix Implementation**: Address the root cause, not symptoms
4. **Re-test**: Verify fix works locally
5. **Re-push**: Push fix and monitor again
6. **Document**: Record what went wrong and how it was fixed

### **Common Failure Patterns**
- **Test Failures**: Fix failing tests, don't disable them
- **Linting Errors**: Fix code style issues
- **Type Errors**: Address TypeScript compilation issues
- **Security Issues**: Address vulnerabilities immediately
- **Build Failures**: Fix compilation or dependency issues

## 📊 **Monitoring Dashboard**

### **Status Tracking**
```bash
# Check overall project status
gh repo view --json name,description,defaultBranchRef

# Check recent workflow runs
gh run list --limit 10

# Check open PRs
gh pr list --state open

# Check PR checks
gh pr checks
```

### **Automated Notifications**
```bash
# Set up webhook for PR status changes
gh webhook create --events pull_request --url https://your-webhook-url.com

# Monitor specific events
gh api repos/:owner/:repo/hooks
```

## 🎯 **Implementation Plan**

### **Phase 1: Setup Monitoring**
1. **Install GitHub CLI**: Ensure `gh` is available
2. **Create Monitoring Scripts**: Implement automated monitoring
3. **Configure Pre-push Hooks**: Add local validation
4. **Test Monitoring**: Verify scripts work correctly

### **Phase 2: Enhanced CI/CD**
1. **Update GitHub Actions**: Add comprehensive checks
2. **Add Security Scanning**: Implement security checks
3. **Configure Notifications**: Set up failure alerts
4. **Test Pipeline**: Verify all checks work

### **Phase 3: Automated Workflow**
1. **Integrate Monitoring**: Use monitoring in development workflow
2. **Add Blocking**: Prevent merges on failures
3. **Document Process**: Create team guidelines
4. **Train Team**: Ensure everyone follows process

## 📝 **AI Assistant Guidelines**

### **For Every Change**
1. **Always run local checks** before pushing
2. **Monitor CI/CD status** after pushing
3. **Wait for all checks to pass** before proceeding
4. **Address failures immediately** when they occur
5. **Document any issues** and their resolutions

### **Failure Response**
1. **Don't ignore failures** - address them immediately
2. **Find root cause** - don't just apply quick fixes
3. **Test fixes locally** before re-pushing
4. **Monitor re-runs** to ensure fixes work
5. **Learn from failures** to prevent recurrence

---

**Created**: January 2025
**Status**: Ready for implementation
**Next Review**: After first implementation

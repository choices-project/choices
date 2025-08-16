# Setup Guide: CI/CD Monitoring System

## 🎯 **Overview**

This guide sets up automated monitoring for CI/CD pipelines and pull requests to ensure all checks pass before proceeding with development.

## 📋 **Prerequisites**

### **1. GitHub CLI (Recommended)**
```bash
# macOS
brew install gh

# Ubuntu/Debian
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Windows
winget install GitHub.cli
```

### **2. GitHub Authentication**
```bash
# Login to GitHub
gh auth login

# Or use token authentication
export GITHUB_TOKEN=your_github_token
```

### **3. Alternative: GitHub Token Only**
If you don't want to install GitHub CLI, you can use just a GitHub token:
```bash
# Create a GitHub Personal Access Token
# 1. Go to GitHub Settings > Developer settings > Personal access tokens
# 2. Generate new token with 'repo' scope
# 3. Set the token:
export GITHUB_TOKEN=your_github_token
```

## 🚀 **Installation**

### **1. Make Scripts Executable**
```bash
chmod +x scripts/monitor-pr.sh
chmod +x scripts/monitor-pr-fallback.sh
chmod +x scripts/create-pr-with-monitoring.sh
chmod +x .git/hooks/pre-push
```

### **2. Test Installation**
```bash
# Test GitHub CLI
gh --version

# Test fallback script
./scripts/monitor-pr-fallback.sh --help
```

## 🔧 **Usage**

### **1. Monitor Existing PR**
```bash
# With GitHub CLI
./scripts/monitor-pr.sh 123

# Without GitHub CLI (fallback)
./scripts/monitor-pr-fallback.sh 123
```

### **2. Create PR with Monitoring**
```bash
# Create PR and monitor automatically
./scripts/create-pr-with-monitoring.sh feature/user-auth "feat: add user authentication" "Implements user authentication with WebAuthn"
```

### **3. Manual PR Creation with Monitoring**
```bash
# 1. Create PR manually on GitHub
# 2. Get the PR number
# 3. Monitor the PR
./scripts/monitor-pr.sh <PR_NUMBER>
```

## 🔄 **Automated Workflow**

### **Before Every Push**
The pre-push hook will automatically run:
- Frontend tests and linting
- Backend tests and vetting
- Type checking
- Security scans

### **After Every Push**
1. **Monitor CI/CD**: Watch pipeline status
2. **Check PR Status**: Verify all checks pass
3. **Address Failures**: Fix any issues immediately
4. **Wait for Approval**: Don't merge until approved

## 📊 **Monitoring Dashboard**

### **Check Project Status**
```bash
# With GitHub CLI
gh repo view
gh run list --limit 10
gh pr list --state open

# Without GitHub CLI
curl -s "https://api.github.com/repos/choices-project/choices" | jq '.name, .description'
```

### **Monitor Recent Activity**
```bash
# Check recent workflow runs
gh run list --limit 5

# Check open PRs
gh pr list --state open --limit 5
```

## 🚨 **Failure Handling**

### **When CI/CD Fails**
1. **Check Logs**: Review the failure details
2. **Reproduce Locally**: Test the issue locally
3. **Fix Root Cause**: Address the underlying problem
4. **Re-test**: Verify the fix works
5. **Re-push**: Push the fix and monitor again

### **Common Issues**
- **Test Failures**: Fix failing tests, don't disable them
- **Linting Errors**: Fix code style issues
- **Type Errors**: Address TypeScript compilation issues
- **Security Issues**: Address vulnerabilities immediately
- **Build Failures**: Fix compilation or dependency issues

## 🔧 **Configuration**

### **Environment Variables**
```bash
# GitHub token for API access
export GITHUB_TOKEN=your_github_token

# Repository name
export GITHUB_REPO=choices-project/choices

# Monitoring settings
export PR_MONITOR_TIMEOUT=1800  # 30 minutes
export PR_MONITOR_INTERVAL=30   # 30 seconds
```

### **Custom Settings**
You can modify the monitoring scripts to adjust:
- Timeout duration
- Check interval
- Repository name
- Error handling behavior

## 📝 **AI Assistant Integration**

### **For AI Assistants**
1. **Always use monitoring scripts** when creating PRs
2. **Wait for all checks to pass** before proceeding
3. **Address failures immediately** when they occur
4. **Document any issues** and their resolutions
5. **Use fallback scripts** if GitHub CLI is not available

### **Monitoring Protocol**
```bash
# Before pushing changes
git push origin feature/branch-name

# Create PR with monitoring
./scripts/create-pr-with-monitoring.sh feature/branch-name "feat: description" "Detailed description"

# Or monitor existing PR
./scripts/monitor-pr.sh <PR_NUMBER>
```

## 🎯 **Success Metrics**

### **Quality Metrics**
- **Zero Failed Pushes**: All pushes pass pre-push checks
- **Fast CI/CD**: Pipeline completes within 10 minutes
- **High Success Rate**: >95% of PRs pass all checks
- **Quick Fixes**: Issues resolved within 24 hours

### **Process Metrics**
- **Automated Monitoring**: All PRs monitored automatically
- **Immediate Feedback**: Failures caught and addressed quickly
- **Documentation**: All issues and fixes documented
- **Team Adoption**: All team members use monitoring

## 🚀 **Next Steps**

### **Phase 1: Basic Setup**
1. Install GitHub CLI or set up GitHub token
2. Test monitoring scripts
3. Configure pre-push hooks
4. Create first monitored PR

### **Phase 2: Enhanced Monitoring**
1. Set up GitHub Actions workflows
2. Add security scanning
3. Configure notifications
4. Implement automated blocking

### **Phase 3: Full Automation**
1. Integrate with development workflow
2. Add automated PR creation
3. Implement rollback mechanisms
4. Create monitoring dashboard

---

**Created**: January 2025
**Status**: Ready for implementation
**Next Review**: After first use

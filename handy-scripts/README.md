# 🛠️ Handy Scripts - Your Daily Development Tools

This folder contains the most frequently used scripts for your development workflow. These are the scripts you'll use most often for pushing code, monitoring CI, and maintaining code quality.

## 📋 Quick Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `push-and-monitor.sh` | Push code and automatically monitor CI | `./push-and-monitor.sh origin <branch>` |
| `monitor-ci.sh` | Monitor CI status in real-time | `./monitor-ci.sh` |
| `pre-push-validation.sh` | Run all CI checks locally before pushing | `./pre-push-validation.sh` |
| `cleanup-code.js` | Analyze and fix code quality issues | `node cleanup-code.js [--fix]` |

---

## 🚀 **push-and-monitor.sh** - Push & Monitor CI

**What it does:** Pushes your code and automatically starts monitoring the CI pipeline.

**Usage:**
```bash
./push-and-monitor.sh origin feature/enhanced-feedback-system
./push-and-monitor.sh origin main
```

**Features:**
- ✅ Runs pre-push validation first
- ✅ Pushes to GitHub
- ✅ Automatically starts CI monitoring
- ✅ Shows real-time progress updates
- ✅ Provides detailed error analysis if CI fails

**Example Output:**
```
🚀 Pushing with automatic CI monitoring...
✅ Pre-push validation passed!
✅ Push successful!
🔍 Starting CI monitoring...
📊 Workflow: CI
🔄 Status: In Progress
⏱️  Elapsed: 45s
```

---

## 📊 **monitor-ci.sh** - Real-time CI Monitoring

**What it does:** Monitors GitHub Actions CI runs in real-time with detailed status updates.

**Usage:**
```bash
./monitor-ci.sh
```

**Features:**
- 🔄 Checks CI status every 10 seconds
- 📊 Shows job-level progress
- ❌ Detailed error analysis for failures
- 💡 Provides fix suggestions
- ⏰ Auto-timeout after 5 minutes
- 🎨 Color-coded status indicators

**Example Output:**
```
🔍 CI Monitor Starting...
📊 Workflow: CI
🔄 Status: In Progress
📋 Job Details:
  ✅ Go lint IA
  ✅ Go build IA
  🔄 Web build
⏱️  Elapsed: 120s
```

---

## ✅ **pre-push-validation.sh** - Local CI Checks

**What it does:** Runs all the same checks that the CI pipeline will run, locally.

**Usage:**
```bash
./pre-push-validation.sh
```

**Checks performed:**
- ✅ Prerequisites (Node.js, npm, git)
- ✅ Dependencies installation
- ✅ ESLint validation
- ✅ TypeScript type checking
- ✅ Production build test
- ✅ Bundle size analysis
- ✅ Security vulnerability check
- ✅ Git status verification

**Example Output:**
```
🔍 Starting pre-push CI validation...
✅ All prerequisites found
✅ Dependencies installed
✅ ESLint passed
✅ TypeScript type check passed
✅ Production build successful
✅ Pre-push validation completed successfully!
```

---

## 🧹 **cleanup-code.js** - Code Quality Management

**What it does:** Analyzes and optionally fixes code quality issues like unused imports, variables, and console statements.

**Usage:**
```bash
# Analyze only (no changes)
node cleanup-code.js

# Analyze and fix issues automatically
node cleanup-code.js --fix
```

**What it finds:**
- 📦 Unused imports
- 🔢 Unused variables
- 📝 Console statements
- 🗑️ Dead code

**Example Output:**
```
🔍 Analyzing code quality...
📦 Found 5 unused imports
🔢 Found 12 unused variables
📝 Found 8 console statements
💡 Run with --fix to automatically resolve issues
```

---

## 🎯 **Daily Workflow Examples**

### **Typical Development Session:**
```bash
# 1. Make your changes
# 2. Test locally
./pre-push-validation.sh

# 3. Push and monitor CI
./push-and-monitor.sh origin feature/your-feature

# 4. If you need to monitor manually later
./monitor-ci.sh
```

### **Quick Code Cleanup:**
```bash
# Check what needs cleaning
node cleanup-code.js

# Fix issues automatically
node cleanup-code.js --fix

# Verify fixes
./pre-push-validation.sh
```

### **Emergency CI Check:**
```bash
# Just monitor current CI status
./monitor-ci.sh
```

---

## 🔧 **Troubleshooting**

### **CI Monitoring Not Working:**
- Check if you're on the right branch
- Verify GitHub repository access
- Ensure you have internet connection

### **Pre-push Validation Fails:**
- Run `npm install` in the `web/` directory
- Check for TypeScript errors: `npm run type-check`
- Check for linting errors: `npm run lint`

### **Cleanup Script Issues:**
- Make sure you're in the project root
- Check that Node.js is installed
- Verify file permissions: `chmod +x *.sh`

---

## 📚 **Related Documentation**

- **CI/CD Pipeline:** `.github/workflows/ci.yml`
- **Code Quality:** `docs/BEST_PRACTICES.md`
- **Agent Guidance:** `docs/AGENT_GUIDANCE.md`
- **Project Status:** `CURRENT_STATUS_AND_ROADMAP.md`

---

## 🎉 **Pro Tips**

1. **Always run pre-push validation** before pushing to catch issues early
2. **Use push-and-monitor** for the best development experience
3. **Run cleanup regularly** to maintain code quality
4. **Monitor CI actively** to catch and fix issues quickly

**Happy coding! 🚀**

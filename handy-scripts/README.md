# 🛠️ Handy Scripts - Your Daily Development Tools

This folder contains the most frequently used scripts for your development workflow. These are the scripts you'll use most often for pushing code, monitoring CI, and maintaining code quality.

## 📋 Quick Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `ai-new-task.sh` | Provide context for new AI agents | `./ai-new-task.sh "task description"` |
| `push-and-monitor.sh` | Push code and automatically monitor CI | `./push-and-monitor.sh origin <branch>` |
| `monitor-ci.sh` | Monitor CI status in real-time | `./monitor-ci.sh` |
| `safe-run.sh` | Run any script with automatic backup branch | `./safe-run.sh <script> [args]` |
| `safe-cleanup.sh` | Safe code cleanup with backup branch | `./safe-cleanup.sh [--fix]` |
| `safe-validation.sh` | Safe pre-push validation with backup | `./safe-validation.sh` |
| `pre-push-validation.sh` | Run all CI checks locally before pushing | `./pre-push-validation.sh` |
| `cleanup-code.js` | Analyze and fix code quality issues | `node cleanup-code.js [--fix]` |

---

## 🤖 **AI Context & Instructions**

### **ai-new-task.sh** - New Agent Task Instructions
**What it does:** Provides comprehensive context and guidelines for new AI agents working on tasks.

**Usage:**
```bash
./ai-new-task.sh "implement user feedback system"
./ai-new-task.sh "fix TypeScript errors in auth module"
./ai-new-task.sh "add new admin dashboard feature"
```

**What it provides:**
- ✅ Core principles and working style expectations
- 🚫 Red flags and what to avoid
- 🏗️ Project context and technology stack
- 📚 Documentation requirements
- 🔧 Version control requirements
- 🧪 Testing requirements
- 💡 Effective approach patterns
- 🎯 Success metrics
- 🔧 Available tools and commands
- 📝 Language to use and avoid

**Perfect for:**
- Starting new chat sessions with AI agents
- Ensuring consistent working style
- Setting proper expectations
- Providing project context
- Establishing best practices

---

## 🛡️ **Safety Features - Automatic Backup Branches**

**All potentially destructive operations now have safety wrappers that automatically create backup branches:**

### **safe-run.sh** - Universal Safety Wrapper
**What it does:** Runs any script with automatic backup branch creation and recovery instructions.

**Usage:**
```bash
./safe-run.sh cleanup-code.js --fix
./safe-run.sh pre-push-validation.sh
./safe-run.sh monitor-ci.sh
```

**Safety Features:**
- ✅ Creates backup branch before running
- ✅ Checks for uncommitted changes
- ✅ Provides recovery instructions
- ✅ Auto-cleanup of old backup branches (keeps 5 most recent)
- ✅ Supports both .sh and .js scripts

### **safe-cleanup.sh** - Safe Code Cleanup
**What it does:** Runs code cleanup with automatic backup branch creation.

**Usage:**
```bash
# Analyze only (safe)
./safe-cleanup.sh

# Analyze and fix (with confirmation)
./safe-cleanup.sh --fix
```

**Features:**
- ✅ Creates backup branch before cleanup
- ✅ Warns before applying automatic fixes
- ✅ Provides recovery instructions
- ✅ Safe fallback if something goes wrong

### **safe-validation.sh** - Safe Pre-push Validation
**What it does:** Runs comprehensive validation with automatic backup branch creation.

**Usage:**
```bash
./safe-validation.sh
```

**Features:**
- ✅ Creates backup branch before validation
- ✅ Runs all CI checks locally
- ✅ Safe environment for testing
- ✅ Recovery instructions provided

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

### **Typical Development Session (Safe):**
```bash
# 1. Make your changes
# 2. Test locally with backup
./safe-validation.sh

# 3. Push and monitor CI
./push-and-monitor.sh origin feature/your-feature

# 4. If you need to monitor manually later
./monitor-ci.sh
```

### **Safe Code Cleanup:**
```bash
# Check what needs cleaning (with backup)
./safe-cleanup.sh

# Fix issues automatically (with backup and confirmation)
./safe-cleanup.sh --fix

# Verify fixes (with backup)
./safe-validation.sh
```

### **Traditional Development Session:**
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

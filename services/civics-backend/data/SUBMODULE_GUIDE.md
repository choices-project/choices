# 🔧 Git Submodule Guide for OpenStates People Data

## 📋 **What is a Git Submodule?**

A git submodule is a way to include one git repository inside another git repository. This allows us to:
- **Track the exact version** of OpenStates People data we're using
- **Update to newer versions** when available
- **Maintain proper attribution** and licensing
- **Avoid embedding git repositories** (which causes problems)

## 🚀 **Working with the OpenStates People Submodule**

### **Initial Setup (Already Done)**
```bash
# The submodule is already set up, but if you need to initialize it:
git submodule init
git submodule update
```

### **Updating to Latest OpenStates People Data**
```bash
# Navigate to the submodule directory
cd services/civics-backend/data/openstates-people

# Pull the latest changes from OpenStates People
git pull origin main

# Go back to the main repository
cd ../../..

# Commit the submodule update
git add services/civics-backend/data/openstates-people
git commit -m "Update OpenStates People data to latest version"
```

### **Cloning the Repository with Submodules**
```bash
# When someone clones this repository, they need to initialize submodules:
git clone <your-repo-url>
cd civics-backend
git submodule init
git submodule update

# Or clone with submodules in one command:
git clone --recursive <your-repo-url>
```

### **Checking Submodule Status**
```bash
# See the current status of all submodules
git submodule status

# See what version of OpenStates People we're using
cd services/civics-backend/data/openstates-people
git log --oneline -5
```

## 🏛️ **Being Good Git Citizens**

### **What We Do Right:**
- ✅ **Proper attribution** - We credit OpenStates People in our documentation
- ✅ **Respect licensing** - We follow their MIT license requirements
- ✅ **Read-only usage** - We don't modify their data, only enhance it
- ✅ **Proper submodule** - We use git submodules correctly
- ✅ **Documentation** - We document our usage and attribution

### **What We Don't Do:**
- ❌ **Modify their data** - We don't change the original YAML files
- ❌ **Remove attribution** - We always credit the source
- ❌ **Violate license** - We follow their MIT license terms
- ❌ **Embed repositories** - We use proper submodules instead

## 📊 **Benefits of This Approach**

### **For Us:**
- **Clean git history** - No embedded repository issues
- **Easy updates** - Can update to latest OpenStates data
- **Proper versioning** - Track exactly which version we're using
- **Deployment friendly** - Submodules work well with deployment systems

### **For OpenStates People:**
- **Proper attribution** - We give them credit for their work
- **Respectful usage** - We follow their terms and community guidelines
- **Community support** - We contribute to their mission of transparency
- **No burden** - We don't create issues for their repository

## 🎯 **Best Practices**

1. **Always attribute** - Give credit to OpenStates People
2. **Respect licensing** - Follow their MIT license terms
3. **Don't modify** - Use their data as-is, enhance with our own processing
4. **Update responsibly** - Test updates before deploying
5. **Document usage** - Keep attribution and documentation current

## 📚 **Resources**

- **OpenStates People**: [https://github.com/openstates/people](https://github.com/openstates/people)
- **OpenStates Organization**: [https://openstates.org/](https://openstates.org/)
- **Git Submodules**: [https://git-scm.com/book/en/v2/Git-Tools-Submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
- **Attribution Guide**: [OPENSTATES_ATTRIBUTION.md](OPENSTATES_ATTRIBUTION.md)

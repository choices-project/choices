# 🚀 Agent Quick Reference Guide

## 🎯 **Before You Start Any Task**

### **Essential Reading (5 minutes)**
1. **📚 Documentation System**: [`DOCUMENTATION_SYSTEM.md`](DOCUMENTATION_SYSTEM.md)
2. **👋 Onboarding**: [`AGENT_ONBOARDING.md`](AGENT_ONBOARDING.md)
3. **🎯 Best Practices**: [`DEVELOPMENT_BEST_PRACTICES.md`](DEVELOPMENT_BEST_PRACTICES.md)

### **Current Status Check (2 minutes)**
- **🚀 Deployment Status**: [`DEPLOYMENT_SUCCESS_SUMMARY.md`](DEPLOYMENT_SUCCESS_SUMMARY.md)
- **🏗️ Architecture**: [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md)

## 🔍 **Quick Navigation by Task Type**

### **🆕 New Feature Development**
```
1. Check existing research: docs/
2. Review technical specs: specs/
3. Understand security: SECURITY_STANDARDS.md
4. Check current status: DEPLOYMENT_SUCCESS_SUMMARY.md
```

### **🐛 Bug Fixes & Issues**
```
1. Check recent fixes: IA_TOKENS_ARCHITECTURE_RESTORED.md
2. Review implementation: CURRENT_IMPLEMENTATION_ANALYSIS.md
3. Check deployment: DATABASE_SETUP_GUIDE.md
```

### **🔒 Security & Compliance**
```
1. Security standards: SECURITY_STANDARDS.md
2. Privacy implementation: docs/PRIVACY_ENCRYPTION.md
3. Threat model: docs/threat_model.md
4. Verification tiers: docs/verification_tiers.md
```

### **🚀 Deployment & Infrastructure**
```
1. Database setup: DATABASE_SETUP_GUIDE.md
2. Current status: DEPLOYMENT_SUCCESS_SUMMARY.md
3. Security policies: SECURITY_STANDARDS.md
```

## 📋 **Documentation Update Rules**

### **When Making Changes**
- [ ] **Update relevant documentation** before or immediately after changes
- [ ] **Add change notes** to appropriate documents
- [ ] **Update status documents** like `DEPLOYMENT_SUCCESS_SUMMARY.md`
- [ ] **Cross-reference** related documents

### **When Adding Features**
- [ ] **Create research document** in `docs/` with `_RESEARCH.md` suffix
- [ ] **Create implementation document** in `docs/` with `_IMPLEMENTATION.md` suffix
- [ ] **Update README.md** with feature overview
- [ ] **Update PROJECT_SUMMARY.md** if architecture changes

## 🎯 **Critical Reminders**

### **Architectural Integrity** ⚠️
- **Never remove components** without understanding their purpose
- **Always investigate root causes** before applying fixes
- **Maintain IA/PO architecture** - it's critical for security
- **Follow research-first approach** from `DEVELOPMENT_BEST_PRACTICES.md`

### **Security First** 🔒
- **All user data must be isolated** - users can never see other users' data
- **Only raw poll totals** are displayed - no individual vote data
- **RLS policies must be active** on all tables
- **Admin access is owner-only** - hardcoded user ID

### **Documentation Quality** 📚
- **Keep documentation updated** as you make changes
- **Use clear titles** that indicate content and purpose
- **Add cross-references** to related documents
- **Update status indicators** (✅ Complete, 🔄 In Progress, ⚠️ Needs Attention)

## 🔗 **Quick Links**

### **Core Documents**
- [Documentation System](DOCUMENTATION_SYSTEM.md)
- [Agent Onboarding](AGENT_ONBOARDING.md)
- [Development Best Practices](DEVELOPMENT_BEST_PRACTICES.md)
- [Project Summary](PROJECT_SUMMARY.md)

### **Current Status**
- [Deployment Status](DEPLOYMENT_SUCCESS_SUMMARY.md)
- [Implementation Analysis](CURRENT_IMPLEMENTATION_ANALYSIS.md)
- [Architecture Restoration](IA_TOKENS_ARCHITECTURE_RESTORED.md)

### **Feature Development**
- [Automated Polls Roadmap](docs/AUTOMATED_POLLS_ROADMAP.md)
- [Trending Topics Research](docs/AUTOMATED_TRENDING_POLLS_RESEARCH.md)
- [Feature Flags](docs/feature-flags.md)

### **Security & Compliance**
- [Security Standards](SECURITY_STANDARDS.md)
- [Privacy Implementation](docs/PRIVACY_ENCRYPTION.md)
- [Database Setup](DATABASE_SETUP_GUIDE.md)

## 🚨 **Common Pitfalls to Avoid**

### **❌ Don't Do This**
- Remove architectural components without understanding their purpose
- Apply quick fixes without investigating root causes
- Skip the research phase when implementing features
- Ignore security implications of changes
- Forget to update documentation

### **✅ Do This Instead**
- Research thoroughly before implementing
- Understand component relationships and dependencies
- Fix actual problems, not symptoms
- Consider security implications of all changes
- Keep documentation current and accurate

## 📊 **Success Checklist**

### **Before Starting**
- [ ] Read relevant documentation
- [ ] Understand current project state
- [ ] Check for existing related work
- [ ] Review security implications

### **During Development**
- [ ] Follow best practices methodology
- [ ] Keep documentation updated
- [ ] Test thoroughly
- [ ] Consider architectural impact

### **After Completion**
- [ ] Update all relevant documentation
- [ ] Add to status documents
- [ ] Cross-reference related documents
- [ ] Verify security is maintained

---

**This quick reference ensures you stay on context and maintain project quality while working efficiently.**

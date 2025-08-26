# Script Cleanup Plan

**Status: CLEANUP REQUIRED**  
**Last Updated: August 26, 2025**

## 🧹 **Current State: Script Bloat**

We have **significant script redundancy** that needs consolidation before deployment.

## 📊 **Current Script Inventory**

### **Essential Scripts (Keep)**
- ✅ `deploy-schema-migrations.js` - Main migration deployment script
- ✅ `check-schema-status.js` - Database schema validation
- ✅ `README.md` - Script documentation

### **Redundant Migration Scripts (Archive)**
- ❌ `deploy-migration-001.js` - Superseded by deploy-schema-migrations.js
- ❌ `deploy-migration-002.js` - Superseded by deploy-schema-migrations.js
- ❌ `deploy-migration-003.js` - Superseded by deploy-schema-migrations.js
- ❌ `deploy-migration-004.js` - Superseded by deploy-schema-migrations.js
- ❌ `deploy-migration-005.js` - Superseded by deploy-schema-migrations.js
- ❌ `deploy-migration-006.js` - Superseded by deploy-schema-migrations.js

### **Outdated Utility Scripts (Archive)**
- ❌ `deploy-schema.js` - Superseded by deploy-schema-migrations.js
- ❌ `fix-auth-issues.js` - Completed work
- ❌ `fix-linting-warnings.js` - Completed work
- ❌ `complete-user-cleanup.js` - Completed work
- ❌ `remove-test-user.js` - Completed work
- ❌ `remove-test-user.sql` - Completed work

### **Directory Structure (Keep)**
- ✅ `migrations/` - Migration SQL files
- ✅ `database/` - Database utilities
- ✅ `security/` - Security scripts
- ✅ `performance/` - Performance scripts
- ✅ `quality/` - Quality assurance scripts
- ✅ `essential/` - Essential utilities
- ✅ `email-templates/` - Email templates

## 🗂️ **Proposed Script Structure**

### **Production Scripts (Keep)**
```
scripts/
├── deploy-schema-migrations.js    # Main migration deployment
├── check-schema-status.js         # Schema validation
├── README.md                      # Script documentation
├── migrations/                    # Migration SQL files
├── database/                      # Database utilities
├── security/                      # Security scripts
├── performance/                   # Performance scripts
├── quality/                       # Quality assurance
├── essential/                     # Essential utilities
└── email-templates/               # Email templates
```

### **Archive Structure**
```
scripts/archive/
├── redundant-migrations/          # Old individual migration scripts
├── completed-work/                # Completed utility scripts
└── outdated-utilities/            # Outdated utility scripts
```

## 🧹 **Cleanup Actions**

### **Phase 1: Archive Redundant Scripts**
1. **Move to archive/redundant-migrations/**
   - `deploy-migration-001.js`
   - `deploy-migration-002.js`
   - `deploy-migration-003.js`
   - `deploy-migration-004.js`
   - `deploy-migration-005.js`
   - `deploy-migration-006.js`

2. **Move to archive/completed-work/**
   - `fix-auth-issues.js`
   - `fix-linting-warnings.js`
   - `complete-user-cleanup.js`
   - `remove-test-user.js`
   - `remove-test-user.sql`

3. **Move to archive/outdated-utilities/**
   - `deploy-schema.js`

### **Phase 2: Update Documentation**
1. **Update scripts/README.md** - Reflect current script structure
2. **Update deployment documentation** - Reference correct scripts
3. **Create script usage guide** - Clear instructions for remaining scripts

### **Phase 3: Validate Remaining Scripts**
1. **Test deploy-schema-migrations.js** - Ensure it works correctly
2. **Test check-schema-status.js** - Validate schema checking
3. **Update script documentation** - Ensure accuracy

## ⏱️ **Cleanup Timeline**

### **Immediate (Before Deployment)**
1. **Archive redundant scripts** - Move to archive folders
2. **Update script documentation** - Ensure accuracy
3. **Validate remaining scripts** - Test functionality

### **Post-Deployment**
1. **Final script review** - Ensure all scripts are current
2. **Archive organization** - Organize archived scripts
3. **Documentation update** - Final documentation review

## 🎯 **Success Criteria**

### **Script Quality**
- **Reduced from 15+ to 3 core scripts**
- **No redundant functionality**
- **All scripts current and functional**
- **Clear organization and structure**

### **Maintenance**
- **Easy to find scripts**
- **Reduced maintenance overhead**
- **Clear usage instructions**
- **Version control for changes**

## 📋 **Cleanup Checklist**

### **Phase 1: Archive**
- [ ] Create archive directory structure
- [ ] Move redundant migration scripts
- [ ] Move completed work scripts
- [ ] Move outdated utility scripts

### **Phase 2: Update Documentation**
- [ ] Update scripts/README.md
- [ ] Update deployment documentation
- [ ] Create script usage guide

### **Phase 3: Validate**
- [ ] Test deploy-schema-migrations.js
- [ ] Test check-schema-status.js
- [ ] Update script documentation

## 🎉 **Expected Outcome**

After cleanup, we'll have:
- **3 core scripts** instead of 15+
- **Clear, organized structure** for easy navigation
- **Current, functional scripts** for all stakeholders
- **Reduced maintenance overhead** for scripts
- **Professional script organization** ready for production

---

**Last Updated: August 26, 2025**  
**Status: CLEANUP REQUIRED**  
**Next Action: Execute cleanup plan**


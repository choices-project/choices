# Database Directory

**Status:** ✅ Clean and Current  
**Last Updated:** October 2, 2025

---

## 📁 **Current Structure**

### **✅ Current Files (Safe to Use)**
- `optimization/ADD_MISSING_INDEXES.sql` - Performance indexes for current features
- `phase2/CREATE_MISSING_TABLES.sql` - Tables for candidate cards functionality
- `security/COMPREHENSIVE_RLS_ENABLEMENT.sql` - Row Level Security policies
- `security/MINIMAL_RLS_ENABLEMENT.sql` - Basic RLS setup
- `security/10_civics_rls_enable.sql` - Civics-specific RLS

### **❌ Removed Files (Dangerous)**
- All outdated analysis scripts
- All residual migration files
- All potentially dangerous setup scripts
- All archived and cleanup directories

---

## 🎯 **Usage Guidelines**

### **For Current Features**
- Use `optimization/ADD_MISSING_INDEXES.sql` for performance
- Use `phase2/CREATE_MISSING_TABLES.sql` for candidate cards
- Use `security/COMPREHENSIVE_RLS_ENABLEMENT.sql` for RLS

### **For Future Features**
- Create new files as needed
- Follow naming convention: `feature-name-description.sql`
- Document purpose and usage
- Test thoroughly before committing

---

## ⚠️ **Important Notes**

1. **No Residual Scripts**: All dangerous, outdated scripts have been removed
2. **Current Focus**: Only files needed for currently enabled features remain
3. **Future Preparation**: Schema preparation files are minimal and documented
4. **Safety First**: All remaining files are safe and current

---

## 🚀 **Next Steps**

1. **Test Current Files**: Ensure all remaining files work correctly
2. **Document Usage**: Add usage examples for each file
3. **Future Planning**: Create new files only when needed for new features
4. **Maintain Clean**: Keep this directory clean and current

**Remember: This directory is now clean and safe. All dangerous files have been removed.**
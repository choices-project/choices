# 🛠️ Essential Scripts - Choices Platform

**Core Development and Maintenance Scripts**

---

## 📋 Overview

This directory contains the essential scripts for the Choices platform - scripts that are regularly used for development, maintenance, and deployment.

**Last Updated**: October 27, 2025  
**Status**: Production Ready  
**Purpose**: Essential development and maintenance tools

---

## 🚀 Essential Scripts

### **📚 Documentation Management**
- **`maintain-documentation.ts`** - Comprehensive documentation maintenance
- **`update-documentation.ts`** - Automated documentation updates
- **`update-timestamps.js`** - Update documentation timestamps

### **🗄️ Database Management**
- **`update-database-types.js`** - Update Supabase database types
- **`deploy-database-functions.js`** - Deploy database functions

### **👥 User Management**
- **`assign-admin-roles.js`** - Assign admin roles to users
- **`setup-test-users.js`** - Create test users for development

### **🧪 Testing & Quality**
- **`e2e-dependency-tracker.js`** - Track E2E test dependencies
- **`system-audit-tracker.js`** - System audit and tracking

### **🔧 Development Tools**
- **`precommit.sh`** - Pre-commit validation script
- **`prune-docs.sh`** - Clean up documentation

---

## 🎯 Usage

### **Documentation Maintenance**
```bash
# Maintain all documentation
npx tsx scripts/essential/maintain-documentation.ts

# Update documentation
npx tsx scripts/essential/update-documentation.ts

# Update timestamps
node scripts/essential/update-timestamps.js
```

### **Database Management**
```bash
# Update database types
node scripts/essential/update-database-types.js

# Deploy database functions
node scripts/essential/deploy-database-functions.js
```

### **User Management**
```bash
# Assign admin roles
node scripts/essential/assign-admin-roles.js

# Setup test users
node scripts/essential/setup-test-users.js
```

### **Testing & Quality**
```bash
# Track E2E dependencies
node scripts/essential/e2e-dependency-tracker.js

# System audit
node scripts/essential/system-audit-tracker.js
```

### **Development Tools**
```bash
# Pre-commit validation
./scripts/essential/precommit.sh

# Prune documentation
./scripts/essential/prune-docs.sh
```

---

## 🔧 Script Details

### **Documentation Scripts**
- **Maintain Documentation**: Comprehensive health checks and maintenance
- **Update Documentation**: Automated updates with link validation
- **Update Timestamps**: Keep documentation dates current

### **Database Scripts**
- **Update Types**: Keep TypeScript types in sync with database
- **Deploy Functions**: Deploy database functions to Supabase

### **User Management Scripts**
- **Assign Admin Roles**: Manage user permissions
- **Setup Test Users**: Create development test accounts

### **Testing Scripts**
- **E2E Dependency Tracker**: Monitor test dependencies
- **System Audit Tracker**: Track system health and performance

### **Development Scripts**
- **Pre-commit**: Validate code before commits
- **Prune Docs**: Clean up outdated documentation

---

## 🎯 When to Use

### **Regular Maintenance**
- **Daily**: Update database types
- **Weekly**: Maintain documentation
- **Before Commits**: Run pre-commit validation
- **After Changes**: Update timestamps

### **Development Workflow**
- **Setup**: Create test users
- **Testing**: Track dependencies and audit system
- **Deployment**: Deploy database functions
- **Maintenance**: Prune documentation

---

## 🚨 Important Notes

### **Prerequisites**
- **Node.js**: Required for all scripts
- **TypeScript**: Required for .ts scripts
- **Supabase CLI**: Required for database scripts
- **Git**: Required for pre-commit script

### **Environment Variables**
- **Supabase**: Database connection and API keys
- **GitHub**: For automated updates
- **Vercel**: For deployment scripts

### **Permissions**
- **Database**: Service role key for database operations
- **Git**: Write permissions for automated commits
- **File System**: Write permissions for documentation updates

---

## 📊 Success Metrics

### **Documentation Scripts**
- ✅ All documentation updated
- ✅ Links validated and working
- ✅ Timestamps current
- ✅ Content quality maintained

### **Database Scripts**
- ✅ Types synchronized
- ✅ Functions deployed successfully
- ✅ No breaking changes
- ✅ Performance maintained

### **User Management Scripts**
- ✅ Admin roles assigned correctly
- ✅ Test users created successfully
- ✅ Permissions validated
- ✅ Security maintained

### **Testing Scripts**
- ✅ Dependencies tracked
- ✅ System health monitored
- ✅ Performance metrics collected
- ✅ Issues detected early

---

**Scripts Version**: 1.0.0  
**Last Updated**: October 27, 2025  
**Status**: ✅ Production Ready

---

*These essential scripts provide the core functionality needed for Choices platform development and maintenance.*

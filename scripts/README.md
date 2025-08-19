# 🛠️ Scripts Directory - Usage Guide

**Created**: 2025-01-27  
**Last Updated**: 2025-01-27 (Updated with script organization)  
**Purpose**: Centralized script management and usage guide

## 📁 **Directory Structure**

```
scripts/
├── essential/           # Core project scripts
├── database/           # Database and Supabase scripts
├── security/           # Security and admin scripts
├── testing/            # Testing and validation scripts
├── ci/                 # CI/CD and monitoring scripts
├── cleanup/            # Cleanup and maintenance scripts
├── archive/            # Archived/outdated scripts
├── email-templates/    # Email template configurations
└── README.md           # This file
```

## 🎯 **Essential Scripts** (`essential/`)

### **Documentation & Project Management**
- **`remind-documentation-update.js`** - Documentation update reminders
  ```bash
  # Show reminder
  node scripts/essential/remind-documentation-update.js
  
  # Check documentation health
  node scripts/essential/remind-documentation-update.js --check
  ```

- **`assess-project-status.js`** - Comprehensive project assessment
  ```bash
  node scripts/essential/assess-project-status.js
  ```

## 🗄️ **Database Scripts** (`database/`)

### **Health & Monitoring**
- **`check-supabase-health.js`** - Database health check
  ```bash
  node scripts/database/check-supabase-health.js
  ```

- **`check_supabase_auth.js`** - Auth verification
  ```bash
  node scripts/database/check_supabase_auth.js
  ```

- **`verify_supabase_config.js`** - Config verification
  ```bash
  node scripts/database/verify_supabase_config.js
  ```

### **Optimization & Fixes**
- **`fix-supabase-issues.js`** - Comprehensive Supabase fixes
  ```bash
  node scripts/database/fix-supabase-issues.js
  ```

- **`optimize-supabase-usage.js`** - Query optimization
  ```bash
  node scripts/database/optimize-supabase-usage.js
  ```

- **`fix-supabase-warnings.js`** - Warning resolution
  ```bash
  node scripts/database/fix-supabase-warnings.js
  ```

### **Database Deployment**
- **`deploy-poll-narrative-database.js`** - Poll narrative database setup
- **`deploy-media-bias-database.js`** - Media bias database setup
- **`deploy-breaking-news-database.js`** - Breaking news database setup
- **`deploy-automated-polls-database.js`** - Automated polls database setup

### **Utilities**
- **`get-ia-tokens-columns.js`** - IA tokens column inspection

## 🔒 **Security Scripts** (`security/`)

### **Setup & Configuration**
- **`security-database-setup.js`** - Security database setup
  ```bash
  node scripts/security/security-database-setup.js
  ```

- **`deploy-ia-tokens-and-security.js`** - IA tokens and security deployment
  ```bash
  node scripts/security/deploy-ia-tokens-and-security.js
  ```

- **`setup-admin-config.js`** - Admin configuration setup
  ```bash
  node scripts/security/setup-admin-config.js
  ```

### **Admin Management**
- **`set-admin-user.js`** - Set admin user
  ```bash
  node scripts/security/set-admin-user.js
  ```

- **`check-admin-status.js`** - Check admin status
  ```bash
  node scripts/security/check-admin-status.js
  ```

- **`remove-ia-user.js`** - Remove IA user
  ```bash
  node scripts/security/remove-ia-user.js
  ```

### **Validation**
- **`verify-privacy-system.js`** - Privacy system verification
  ```bash
  node scripts/security/verify-privacy-system.js
  ```

- **`validate-security.js`** - Security validation
  ```bash
  node scripts/security/validate-security.js
  ```

## 🧪 **Testing Scripts** (`testing/`)

### **End-to-End Testing**
- **`test-complete-flow.js`** - Complete flow testing
  ```bash
  node scripts/testing/test-complete-flow.js
  ```

- **`test-auth-flow.js`** - Authentication flow testing
  ```bash
  node scripts/testing/test-auth-flow.js
  ```

- **`test-environment-and-database.js`** - Environment and database testing
  ```bash
  node scripts/testing/test-environment-and-database.js
  ```

### **Feature Testing**
- **`test-breaking-news-backend.js`** - Breaking news backend testing
  ```bash
  node scripts/testing/test-breaking-news-backend.js
  ```

- **`analyze-feedback-submission.js`** - Feedback submission analysis
  ```bash
  node scripts/testing/analyze-feedback-submission.js
  ```

## 🚀 **CI/CD Scripts** (`ci/`)

### **Monitoring & Deployment**
- **`setup-ci-monitoring.sh`** - CI monitoring setup
  ```bash
  ./scripts/ci/setup-ci-monitoring.sh
  ```

- **`monitor-ci.sh`** - CI monitoring
  ```bash
  ./scripts/ci/monitor-ci.sh
  ```

- **`push-and-monitor.sh`** - Push and monitor deployment
  ```bash
  ./scripts/ci/push-and-monitor.sh
  ```

## 🧹 **Cleanup Scripts** (`cleanup/`)

### **Data Management**
- **`clear-database.js`** - Clear database (development)
  ```bash
  node scripts/cleanup/clear-database.js
  ```

- **`cleanup-test-users.js`** - Clean up test users
  ```bash
  node scripts/cleanup/cleanup-test-users.js
  ```

- **`check-duplicate-users.js`** - Check for duplicate users
  ```bash
  node scripts/cleanup/check-duplicate-users.js
  ```

## 📧 **Email Templates** (`email-templates/`)

Email template configurations and settings.

## 📚 **Archive** (`archive/`)

Contains outdated, redundant, or one-time use scripts that have been superseded by newer versions.

## 🎯 **Common Workflows**

### **Daily Development**
```bash
# 1. Check project status
node scripts/essential/assess-project-status.js

# 2. Verify database health
node scripts/database/check-supabase-health.js

# 3. Run tests
node scripts/testing/test-complete-flow.js
```

### **Before Deployment**
```bash
# 1. Validate security
node scripts/security/validate-security.js

# 2. Check admin status
node scripts/security/check-admin-status.js

# 3. Monitor CI
./scripts/ci/monitor-ci.sh
```

### **After Changes**
```bash
# 1. Update documentation
node scripts/essential/remind-documentation-update.js

# 2. Check for duplicates
node scripts/cleanup/check-duplicate-users.js

# 3. Assess project status
node scripts/essential/assess-project-status.js
```

## 🔧 **Script Development Guidelines**

### **✅ Best Practices**
- Use descriptive names
- Include proper error handling
- Add usage documentation
- Follow consistent formatting
- Include logging for debugging

### **📝 Script Template**
```javascript
#!/usr/bin/env node

/**
 * Script Name
 * 
 * Description of what this script does
 * 
 * Usage: node scripts/category/script-name.js [options]
 */

const fs = require('fs');
const path = require('path');

async function main() {
  try {
    // Script logic here
    console.log('✅ Script completed successfully');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
```

## 🚨 **Important Notes**

### **Environment Variables**
Most scripts require proper environment variables to be set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Other project-specific variables

### **Permissions**
Some scripts require specific permissions or admin access:
- Database modification scripts
- Security configuration scripts
- Admin user management scripts

### **Backup**
Always backup data before running destructive scripts:
- Database clearing scripts
- User removal scripts
- Schema modification scripts

## 📊 **Script Health Monitoring**

### **Regular Checks**
- Run `node scripts/essential/assess-project-status.js` weekly
- Check `node scripts/database/check-supabase-health.js` daily
- Monitor `node scripts/security/validate-security.js` before deployments

### **Maintenance**
- Review archived scripts quarterly
- Update script documentation when features change
- Test scripts after major updates

---

**Status**: 📚 **Essential Reference**  
**Created**: 2025-01-27  
**Last Updated**: 2025-01-27 (Updated with script organization)

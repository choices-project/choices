# Scripts Directory

**Status: PRODUCTION READY**  
**Last Updated: 2025-09-02**

## 🎯 **Overview**

This directory contains essential scripts for managing the Choices platform deployment, database operations, and system maintenance.

## 📁 **Current Script Structure**

### **Core Production Scripts**
- `deploy-schema-migrations.js` - Main migration deployment script
- `check-schema-status.js` - Database schema validation
- `README.md` - This documentation

### **Directory Structure**
- `migrations/` - Migration SQL files
- `database/` - Database utilities
- `security/` - Security scripts
- `performance/` - Performance scripts
- `quality/` - Quality assurance scripts
- `essential/` - Essential utilities
- `email-templates/` - Email templates
- `archive/` - Archived scripts (historical)

## 🚀 **Core Scripts**

### **deploy-schema-migrations.js**
**Purpose**: Deploy database schema migrations to production

**Usage**:
```bash
# Deploy all migrations
node scripts/deploy-schema-migrations.js

# Deploy specific migration
node scripts/deploy-schema-migrations.js --migration=008

# Dry run (no changes)
node scripts/deploy-schema-migrations.js --dry-run
```

**Features**:
- Automated migration deployment
- Migration validation
- Rollback support
- Dry run capability
- Error handling and logging

### **check-schema-status.js**
**Purpose**: Validate database schema and connection status

**Usage**:
```bash
# Check schema status
node scripts/check-schema-status.js
```

**Features**:
- Database connection validation
- Schema verification
- Table accessibility check
- RLS policy validation
- Performance metrics

## 🗄️ **Database Operations**

### **Migration Management**
All database migrations are stored in the `migrations/` directory and deployed using the main migration script.

**Migration Files**:
- `001-identity-unification.sql` - User identity management
- `002-webauthn-enhancement.sql` - Biometric authentication
- `003-dpop-token-binding.sql` - Security token binding
- `004-device-flow-hardening.sql` - Device authentication
- `005-performance-optimization.sql` - Performance improvements
- `006-fix-user-profiles-table.sql` - User profile fixes
- `007-create-site-messages-table.sql` - Admin messaging
- `008-enhanced-onboarding.sql` - Onboarding system

### **Database Utilities**
The `database/` directory contains utilities for:
- Database backup and restore
- Data validation
- Performance optimization
- Schema analysis

## 🔒 **Security Scripts**

The `security/` directory contains scripts for:
- Security audits
- Vulnerability scanning
- Access control management
- Security monitoring

## ⚡ **Performance Scripts**

The `performance/` directory contains scripts for:
- Performance monitoring
- Load testing
- Optimization analysis
- Benchmarking

## 🎯 **Quality Assurance**

The `quality/` directory contains scripts for:
- Code quality checks
- Testing automation
- Quality metrics
- Standards compliance

## 📧 **Email Templates**

The `email-templates/` directory contains:
- Authentication emails
- Notification templates
- Marketing communications
- System alerts

## 📚 **Archive**

The `archive/` directory contains historical scripts organized by category:

### **redundant-migrations/**
- Old individual migration scripts (001-006)
- Superseded by unified migration system

### **completed-work/**
- Completed utility scripts
- Resolved issues and fixes
- Historical maintenance scripts

### **outdated-utilities/**
- Superseded utility scripts
- Old deployment methods
- Deprecated functionality

## 🛠️ **Usage Guidelines**

### **Before Running Scripts**
1. **Environment Setup**: Ensure all environment variables are configured
2. **Database Access**: Verify database connection and permissions
3. **Backup**: Create database backup before major operations
4. **Testing**: Test scripts in development environment first

### **Script Execution**
1. **Production Safety**: Always use `--dry-run` for testing
2. **Error Handling**: Monitor script output for errors
3. **Logging**: Check logs for detailed execution information
4. **Validation**: Verify results after script execution

### **Best Practices**
- **Version Control**: All scripts are version controlled
- **Documentation**: Scripts include inline documentation
- **Error Handling**: Comprehensive error handling and logging
- **Security**: Scripts follow security best practices

## 🔧 **Development**

### **Adding New Scripts**
1. **Purpose**: Clearly define script purpose and functionality
2. **Documentation**: Include comprehensive documentation
3. **Testing**: Test thoroughly before deployment
4. **Integration**: Integrate with existing script ecosystem

### **Script Standards**
- **Error Handling**: Comprehensive error handling
- **Logging**: Detailed logging for debugging
- **Validation**: Input validation and verification
- **Security**: Security-conscious implementation

## 📊 **Monitoring**

### **Script Execution**
- **Success Metrics**: Track successful executions
- **Error Rates**: Monitor error frequencies
- **Performance**: Track execution times
- **Dependencies**: Monitor script dependencies

### **System Health**
- **Database Status**: Monitor database health
- **Migration Status**: Track migration deployments
- **Security Status**: Monitor security compliance
- **Performance Status**: Track system performance

## 🎯 **Troubleshooting**

### **Common Issues**
1. **Database Connection**: Verify connection settings
2. **Permissions**: Check database permissions
3. **Environment Variables**: Validate configuration
4. **Dependencies**: Check script dependencies

### **Debugging**
1. **Logs**: Check script execution logs
2. **Dry Run**: Use dry run mode for testing
3. **Validation**: Run validation scripts
4. **Documentation**: Review script documentation

## 📚 **Additional Resources**

### **Documentation**
- [Production Ready Status](../docs/PRODUCTION_READY_STATUS.md)
- [Deployment Guide](../docs/DEPLOYMENT_GUIDE.md)
- [Database Security & Schema](../docs/DATABASE_SECURITY_AND_SCHEMA.md)

### **Support**
- **Script Issues**: Check script documentation
- **Database Issues**: Review database documentation
- **Deployment Issues**: Consult deployment guide
- **Security Issues**: Review security documentation

---

**Last Updated: 2025-09-02**  
**Status: PRODUCTION READY**  
**Next Review: After deployment**

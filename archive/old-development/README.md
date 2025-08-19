# Development Artifacts

This directory contains development artifacts and tools that are not needed for production deployment.

## 📁 **Directory Structure**

### **coordination/**
Multi-agent coordination system files for development workflow management:
- Agent communication protocols
- Task status tracking
- Conflict resolution procedures
- Dependency mapping

### **reports/**
Development progress reports and status updates:
- Task completion reports
- Progress tracking files
- Status update logs

### **status/**
JSON status files for development coordination:
- Task status tracking
- File locks
- Integration points
- Conflict logs

### **scripts/**
Development and testing scripts:
- `setup_database.sh` - Database initialization
- `populate_sample_data.sh` - Sample data generation
- `quick_polls.sh` - Quick poll creation
- `test_system.sh` - System testing
- `monitor-pr.sh` - PR monitoring
- `check-conflicts.sh` - Conflict detection
- `update-status.sh` - Status updates
- `validate-dependencies.sh` - Dependency validation

### **database/**
Database schemas and migration files:
- SQL schema files
- Migration scripts
- Database documentation

### **integration-points/**
Integration documentation and specifications:
- API integration guides
- Service communication protocols

## 🛠️ **Development Tools**

### **Test Files**
- `test-*.js` - Various test scripts
- `simple-*.js` - Simple test utilities
- `check-*.js` - Validation scripts

### **Setup Scripts**
- `setup-supabase.sh` - Supabase setup
- `deploy.sh` - Deployment scripts
- `test-deployment.sh` - Deployment testing
- `verify-deployment.sh` - Deployment verification
- `test-production.sh` - Production testing

### **Templates**
- `env.production.template` - Environment variable template

### **Documentation**
- `find-supabase-credentials.md` - Credential finding guide
- `TESTING_SUITE.md` - Testing documentation

## 🚫 **Not Tracked in Git**

This entire directory is excluded from Git tracking via `.gitignore` to keep the repository clean and focused on production code.

## 📝 **Usage**

These files are for development reference and local use only. They should not be deployed to production environments.

---

*For production deployment, see the main `PROJECT_SUMMARY.md` file.*

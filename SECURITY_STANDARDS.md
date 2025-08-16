# Security Standards & AI Guidelines

## 🚨 **CRITICAL SECURITY ALERT**

**NEVER share passwords, API keys, or confidential information in:**
- Git commits
- Public repositories
- Chat messages
- Documentation
- Code comments
- Issue reports
- Pull requests

## 🔐 **Credential Management Standards**

### **Environment Variables Only**
All sensitive data must be stored in environment variables:

```bash
# ✅ CORRECT - Use environment variables
DATABASE_URL="postgresql://postgres:password@host:5432/db"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# ❌ NEVER - Hardcode in files
const apiKey = "[YOUR-API-KEY]"
```

### **File Structure**
```
project/
├── .env.local              # Local development (gitignored)
├── .env.production         # Production (gitignored)
├── env.production.template # Template with placeholders
├── .gitignore              # Must include .env*
└── SECURITY_STANDARDS.md   # This file
```

### **Gitignore Requirements**
```gitignore
# Environment files
.env
.env.local
.env.production
.env.staging
.env.*.local

# Credentials
*.key
*.pem
*.p12
*.pfx
secrets/
credentials/

# Database files
*.db
*.sqlite
*.sqlite3

# Logs (may contain sensitive data)
*.log
logs/
```

## 🤖 **AI Assistant Guidelines**

### **For AI Assistants Working on This Project**

1. **NEVER include real credentials in:**
   - Code examples
   - Documentation
   - Configuration files
   - Test data
   - Comments

2. **ALWAYS use placeholders:**
   ```bash
   # ✅ Use placeholders
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@host:5432/db"
   SUPABASE_ANON_KEY="[YOUR-SUPABASE-ANON-KEY]"
   
   # ❌ Never use real values
   DATABASE_URL="postgresql://postgres:MyRealPassword123@host:5432/db"
   ```

3. **When creating setup scripts:**
   - Prompt users to input credentials interactively
   - Never hardcode example credentials
   - Use secure input methods (hidden passwords)

4. **When documenting:**
   - Use `[YOUR-CREDENTIAL]` format
   - Provide clear instructions for obtaining credentials
   - Never include actual API keys or passwords

5. **When testing:**
   - Use mock/example data
   - Never commit test credentials
   - Use environment variables for all tests

### **AI Response Standards**

When an AI assistant encounters credentials in messages:

1. **Immediately warn the user** about security risks
2. **Suggest credential rotation** if credentials were exposed
3. **Provide secure alternatives** for sharing information
4. **Never include credentials** in responses or code examples

## 🔄 **Credential Rotation Protocol**

### **When Credentials Are Exposed**

1. **Immediate Actions:**
   - Rotate all exposed credentials immediately
   - Revoke old credentials
   - Generate new credentials
   - Update environment variables

2. **Notification:**
   - Notify team members
   - Update documentation
   - Review access logs

3. **Prevention:**
   - Review how credentials were exposed
   - Update security procedures
   - Implement additional safeguards

### **Regular Rotation Schedule**

- **API Keys**: Every 90 days
- **Database Passwords**: Every 180 days
- **Service Account Keys**: Every 90 days
- **SSL Certificates**: Before expiration

## 📋 **Development Workflow**

### **Before Committing Code**

1. **Check for credentials:**
   ```bash
   # Search for potential credentials
   grep -r "eyJ" . --exclude-dir=node_modules
   grep -r "password" . --exclude-dir=node_modules --exclude-dir=.git
   grep -r "secret" . --exclude-dir=node_modules
   ```

2. **Verify .gitignore:**
   - Ensure all .env files are ignored
   - Check for credential files
   - Verify no secrets in committed files

3. **Use pre-commit hooks:**
   ```bash
   # Example pre-commit hook
   #!/bin/bash
   if grep -r "eyJ" . --exclude-dir=node_modules; then
     echo "ERROR: Potential JWT tokens found in code"
     exit 1
   fi
   ```

### **Code Review Checklist**

- [ ] No hardcoded credentials
- [ ] All sensitive data in environment variables
- [ ] No credentials in comments
- [ ] No credentials in test data
- [ ] Proper .gitignore configuration
- [ ] Secure credential handling

## 🛡️ **Security Best Practices**

### **Environment Variable Management**

```bash
# ✅ Good practices
export DATABASE_URL="postgresql://user:pass@host:5432/db"
source .env.local

# ❌ Bad practices
echo "password123" > config.txt
git add config.txt
```

### **Template Files**

Always use template files with placeholders:

```bash
# env.production.template
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@host:5432/db"
SUPABASE_ANON_KEY="[YOUR-SUPABASE-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SUPABASE-SERVICE-ROLE-KEY]"
```

### **Documentation Standards**

```markdown
# ✅ Good documentation
To set up the database:
1. Copy `env.production.template` to `.env.local`
2. Replace `[YOUR-PASSWORD]` with your actual password
3. Replace `[YOUR-SUPABASE-ANON-KEY]` with your actual key

# ❌ Bad documentation
To set up the database:
1. Set DATABASE_URL="postgresql://postgres:MyPassword123@host:5432/db"
2. Set SUPABASE_ANON_KEY="[YOUR-SUPABASE-ANON-KEY]"
```

## 🚨 **Emergency Response**

### **If Credentials Are Exposed**

1. **Immediate Actions (within 1 hour):**
   - Rotate all exposed credentials
   - Revoke old credentials
   - Update all environment variables
   - Check for unauthorized access

2. **Investigation (within 24 hours):**
   - Review access logs
   - Identify exposure source
   - Update security procedures
   - Notify stakeholders

3. **Prevention (within 1 week):**
   - Implement additional safeguards
   - Update documentation
   - Train team members
   - Review security policies

## 📞 **Security Contacts**

- **Project Maintainer**: [Contact Information]
- **Security Team**: [Contact Information]
- **Emergency Contact**: [Contact Information]

## 🔍 **Security Tools**

### **Pre-commit Hooks**
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for potential credentials
if grep -r "eyJ" . --exclude-dir=node_modules --exclude-dir=.git; then
  echo "ERROR: Potential JWT tokens found"
  exit 1
fi

if grep -r "password.*=" . --exclude-dir=node_modules --exclude-dir=.git --exclude=SECURITY_STANDARDS.md; then
  echo "ERROR: Potential hardcoded passwords found"
  exit 1
fi
```

### **Automated Scanning**
```bash
# Regular security scans
npm audit
snyk test
grep -r "eyJ" . --exclude-dir=node_modules
```

## 📚 **Resources**

- [OWASP Security Guidelines](https://owasp.org/)
- [GitHub Security Best Practices](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure)
- [Supabase Security Documentation](https://supabase.com/docs/guides/security)

---

**Remember: Security is everyone's responsibility. When in doubt, ask before committing sensitive information.**

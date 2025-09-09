# Secure Example Patterns for Documentation
*Last Updated: 2025-09-09*

**Created:** January 8, 2025  
**Purpose:** Standardized patterns for including examples in documentation without triggering security checks

## 🎯 **OVERVIEW**

This document defines safe patterns for including environment variables, passwords, and credentials in documentation without triggering our pre-commit security hooks.

## 🔒 **SAFE EXAMPLE PATTERNS**

### **Environment Variables**
Use these patterns in documentation to show examples without triggering security checks:

```bash
# ✅ SAFE PATTERNS
JWT_ISSUER=your_jwt_issuer_here
JWT_AUDIENCE=example_audience
REFRESH_TOKEN_COOKIE=placeholder_cookie_name
NEXT_PUBLIC_MAINTENANCE=example_maintenance_mode
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_anon_key_here
```

### **Passwords**
Use these patterns for password examples:

```bash
# ✅ SAFE PATTERNS
password=your_password_here
password=example_password
password=placeholder_password
password=replace_with_your_password
admin_password=your_admin_password
user_password=example_user_password
```

### **API Keys and Secrets**
Use these patterns for API key examples:

```bash
# ✅ SAFE PATTERNS
API_KEY=your_api_key_here
SECRET_KEY=example_secret_key
PRIVATE_KEY=placeholder_private_key
ACCESS_TOKEN=your_access_token_here
BEARER_TOKEN=example_bearer_token
```

### **Database URLs**
Use these patterns for database connection examples:

```bash
# ✅ SAFE PATTERNS
DATABASE_URL=postgresql://username:your_password_here@localhost:5432/dbname
DATABASE_URL=postgresql://user:example_password@host:5432/database
DATABASE_URL=postgresql://admin:placeholder_password@server:5432/app
```

## 🚫 **PATTERNS TO AVOID**

### **Will Trigger Security Checks**
```bash
# ❌ UNSAFE PATTERNS (will be flagged by security checks)
JWT_ISSUER=example_real_value
password=example_real_password
API_KEY=sk-1234567890abcdef
SECRET_KEY=real_secret_key_value
DATABASE_URL=postgresql://user:example_password@host:5432/db
```

**Note:** The above examples would trigger security checks and should not be used in documentation.

## 📝 **DOCUMENTATION GUIDELINES**

### **File Naming**
- Use descriptive names that indicate examples:
  - `example.env`
  - `template.env`
  - `sample.env`
  - `docs/` directory files

### **Content Markers**
- Always include context that makes it clear these are examples:
  - "Example configuration:"
  - "Template for your .env.local:"
  - "Replace with your actual values:"
  - "This is an example - do not use in production"

### **Safe Keywords**
Use these keywords in your examples to avoid triggering security checks:
- `your_*_here`
- `example_*`
- `placeholder_*`
- `replace_*`
- `TODO`
- `FIXME`
- `CHANGEME`
- `SET_THIS`
- `CONFIGURE`

## 🔧 **PRE-COMMIT HOOK EXCLUSIONS**

The pre-commit hook automatically excludes patterns containing these safe keywords:
- `example`
- `placeholder`
- `your_`
- `replace_`
- `TODO`
- `FIXME`
- `CHANGEME`
- `SET_THIS`
- `CONFIGURE`
- `test`
- `mock`

**Important:** The hook now checks ALL files including documentation for real credentials. Only the safe keyword patterns above are excluded.

## 💡 **BEST PRACTICES**

1. **Always use placeholder values** in documentation
2. **Include clear instructions** to replace with real values
3. **Use descriptive placeholder names** that indicate what should go there
4. **Test your examples** to ensure they don't trigger security checks
5. **Keep real credentials** in your deployment environment only (never committed)

## 🎯 **EXAMPLE USAGE**

### **In README.md:**
```markdown
## Environment Setup

Set up your environment variables with the following values:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:your_password_here@localhost:5432/dbname

# Authentication
JWT_ISSUER=your_jwt_issuer_here
JWT_AUDIENCE=example_audience

# API Keys
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_anon_key_here
```

**Important:** Replace all placeholder values with your actual credentials.
```

### **In Configuration Guides:**
```markdown
## API Configuration

Set up your API credentials in your environment:

```bash
# Replace these with your actual values
API_KEY=your_api_key_here
SECRET_KEY=example_secret_key
ACCESS_TOKEN=your_access_token_here
```

**Security Note:** Never commit real credentials to version control.
```

---

**Remember:** The goal is to provide helpful examples while maintaining security. When in doubt, use placeholder values and clear instructions for users to replace them with their actual credentials.

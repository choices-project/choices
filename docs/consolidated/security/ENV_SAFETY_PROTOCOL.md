# 🚨 Environment File Safety Protocol

**CRITICAL: This protocol must be followed to prevent data loss and security breaches.**

## 🚨 **NEVER OVERWRITE .env.local**

### **Absolute Rules:**
1. **NEVER** use scripts to overwrite existing `.env.local` files
2. **NEVER** use `cat >` or `echo >` on `.env.local` files
3. **ALWAYS** check if file exists and has real values first
4. **ALWAYS** require explicit user confirmation for sensitive file changes

### **Safe Operations:**
- ✅ Create `.env.local` if it doesn't exist
- ✅ Update `.env.local` with placeholder values only
- ✅ Read `.env.local` for configuration
- ✅ Validate `.env.local` contents

### **Forbidden Operations:**
- ❌ Overwrite existing `.env.local` with real values
- ❌ Use `cat >` or `echo >` on `.env.local`
- ❌ Modify `.env.local` without user confirmation
- ❌ Remove `.env.local` without backup

## 🔒 **Safety Check Implementation**

### **Before Any .env.local Operation:**
```javascript
function checkEnvFile() {
  const envPath = path.join(__dirname, '../web/.env.local');
  
  if (!fs.existsSync(envPath)) {
    return { exists: false, hasRealValues: false };
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const hasRealValues = !content.includes('your_') && !content.includes('here');
  
  if (hasRealValues) {
    console.log('🚨 CRITICAL: .env.local contains real values!');
    console.log('🚨 DO NOT OVERWRITE THIS FILE!');
    return { exists: true, hasRealValues: true };
  }
  
  return { exists: true, hasRealValues: false };
}
```

### **Safe File Creation:**
```javascript
if (!envStatus.exists) {
  // Only create if file doesn't exist
  const template = `# Template values only
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
`;
  fs.writeFileSync(envPath, template);
}
```

## 📝 **Manual Update Process**

### **When .env.local Contains Real Values:**
1. **STOP** any automated process
2. **NOTIFY** user that manual intervention is required
3. **PROVIDE** clear instructions for manual update
4. **VERIFY** user has completed the update

### **Manual Update Instructions:**
```bash
# 1. Open .env.local in your editor
nano web/.env.local
# or
code web/.env.local

# 2. Update placeholder values with real values
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=blahblehberg

# 3. Save the file
```

## 🛡️ **Recovery Procedures**

### **If .env.local is Accidentally Overwritten:**
1. **IMMEDIATELY** stop all operations
2. **NOTIFY** user of the incident
3. **PROVIDE** recovery instructions
4. **ESTABLISH** new safety protocols

### **Recovery Steps:**
1. Get Supabase credentials from dashboard
2. Recreate `.env.local` with real values
3. Test configuration
4. Document the incident
5. Strengthen safety protocols

## 🔍 **Validation Scripts**

### **Pre-Operation Check:**
```bash
node scripts/env-safety-check.js
```

### **Configuration Test:**
```bash
node scripts/get-admin-user-id.js
```

## 📋 **Checklist for All Scripts**

### **Before Modifying .env.local:**
- [ ] Check if file exists
- [ ] Check if file has real values
- [ ] Require user confirmation if real values exist
- [ ] Only create/update with placeholders
- [ ] Provide clear manual update instructions

### **After Modifying .env.local:**
- [ ] Verify file was not overwritten
- [ ] Test configuration works
- [ ] Document any changes
- [ ] Update safety protocols if needed

## �� **Emergency Contacts**

If this protocol is violated:
1. **IMMEDIATELY** stop all operations
2. **NOTIFY** user of the security incident
3. **PROVIDE** recovery assistance
4. **DOCUMENT** the incident
5. **STRENGTHEN** protocols to prevent recurrence

---

**This protocol is MANDATORY and must be followed by all agents and scripts.**

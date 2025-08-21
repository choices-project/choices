# 🔒 Security Overview

**Last Updated**: 2025-01-27 19:15 UTC  
**Status**: ✅ **Production Ready**

## 🎯 **Security Philosophy**

Choices implements a **privacy-first, security-by-design** approach with multiple layers of protection to ensure user data privacy and system integrity.

## 🔐 **Core Security Model: IA/PO Architecture**

### **IA (Identity Authority)**
- **Purpose**: Issues blinded tokens for voting
- **Security**: Validates user verification and policy compliance
- **Tokens**: Signs blinded tokens bound to specific polls and tier limits
- **Privacy**: Uses VOPRF for unlinkable issuance
- **Table**: `ia_tokens` with proper RLS policies

### **PO (Poll Orchestrator)**
- **Purpose**: Manages poll voting and verification
- **Security**: Verifies token signatures and prevents double-spending
- **Voting**: Associates ballots with tags, allows revotes
- **Audit**: Provides Merkle tree receipts for inclusion verification
- **Privacy**: Vote privacy protection implemented

### **Critical Security Properties**
- **User Data Isolation**: Users can never see other users' data
- **Vote Privacy**: Only aggregated poll results are displayed
- **Admin Access**: Owner-only admin functions
- **Audit Logging**: Comprehensive security audit trails

## 🛡️ **Security Layers**

### **1. Authentication & Authorization**
- **Supabase Auth**: Primary authentication system
- **WebAuthn**: Biometric and hardware-based authentication
- **Tiered Verification**: T0-T3 user verification system
- **Session Management**: Secure session handling with automatic expiration
- **Multi-Factor Authentication**: Enhanced security for sensitive operations

### **2. Database Security**
- **Row Level Security (RLS)**: All tables protected by RLS policies
- **User Data Isolation**: Users can only access their own data
- **Admin Access Control**: Owner-only admin functions
- **Audit Logging**: Comprehensive logging of all database operations
- **Encrypted Storage**: Sensitive data encrypted at rest

### **3. Privacy Protection**
- **Differential Privacy**: Laplace and Gaussian mechanisms with privacy budget management
- **Zero-Knowledge Proofs**: Age verification, vote validation, and range proofs
- **Data Encryption**: AES-256 end-to-end encryption for sensitive data
- **Privacy Budgets**: User-controlled data sharing limits
- **Local Storage Encryption**: Client-side data encryption with secure key management

### **4. Vote Privacy**
- **Individual Vote Protection**: No individual vote data is ever displayed
- **Aggregated Results Only**: Only raw poll totals are shown
- **Blinded Tokens**: VOPRF-based unlinkable token issuance
- **Merkle Tree Receipts**: Cryptographic proof of vote inclusion
- **Double-Spend Prevention**: Token uniqueness verification

## 🔍 **Security Policies**

### **User Data Protection**
```sql
-- Users can ONLY see their own profile data
CREATE POLICY "Users can view own profile" ON ia_users
    FOR SELECT USING (auth.uid()::text = stable_id);

-- Users can ONLY see their own tokens
CREATE POLICY "Users can view own tokens" ON ia_tokens
    FOR SELECT USING (auth.uid()::uuid = user_id);

-- NO ONE can view individual votes (privacy protection)
-- No SELECT policy on po_votes = no one can view individual votes
```

### **Admin Access Control**
```sql
-- Owner-only function to check if current user is owner
-- admin_user_id configured via environment variable for security
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(current_setting('app.admin_user_id', true), '') = auth.uid()::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Poll Results Protection**
```sql
-- Function to get aggregated poll results (no individual votes)
CREATE OR REPLACE FUNCTION get_poll_results(poll_id_param UUID)
RETURNS TABLE (
    poll_id UUID,
    total_votes BIGINT,
    option_counts JSONB
) AS $$
BEGIN
    -- Only return aggregated results, never individual votes
    RETURN QUERY
    SELECT 
        v.poll_id,
        COUNT(*) as total_votes,
        jsonb_object_agg(v.option, COUNT(*)) as option_counts
    FROM po_votes v
    WHERE v.poll_id = poll_id_param
    GROUP BY v.poll_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🔧 **Security Implementation**

### **Database Tables & Security**
- ✅ `ia_users` - User profiles with RLS
- ✅ `ia_tokens` - Blinded tokens for IA/PO system
- ✅ `po_polls` - Polls with public read, authenticated create
- ✅ `po_votes` - Votes with privacy protection (no individual viewing)
- ✅ `feedback` - User feedback with RLS
- ✅ `trending_topics` - Automated polls with RLS
- ✅ `generated_polls` - AI-generated polls with RLS

### **Security Scripts & Tools**
- `scripts/check_supabase_auth.js` - Auth validation
- `scripts/deploy-ia-tokens-and-security.js` - Security deployment
- `scripts/test-auth-flow.js` - Authentication testing
- `scripts/assess-project-status.js` - Security status check

## 🚨 **Security Standards**

### **Code Security**
- Pre-commit hooks for credential detection
- Automated security scanning
- Regular dependency updates
- Code review requirements
- No hardcoded credentials

### **Data Protection**
- Environment variable management
- Encrypted data transmission
- Privacy-first design principles
- Regular security audits
- Vulnerability scanning

### **Access Control**
- Role-based permissions
- Multi-factor authentication
- Session management
- Audit logging
- Principle of least privilege

## 📊 **Security Monitoring**

### **Audit Logging**
- All user actions logged
- Security events tracked
- Database operations monitored
- Access attempts recorded
- Error logging and alerting

### **Performance Monitoring**
- Real-time error tracking
- Security incident detection
- Performance analytics
- System health monitoring
- Automated alerting

## 🔄 **Security Maintenance**

### **Regular Tasks**
- Security policy reviews
- Dependency vulnerability scans
- Access control audits
- Performance monitoring
- User feedback analysis

### **Incident Response**
- Security incident procedures
- Data breach protocols
- User notification processes
- Recovery procedures
- Post-incident analysis

## 📋 **Security Checklist**

### **Before Deployment**
- [ ] All RLS policies active
- [ ] User data isolation verified
- [ ] Admin access restricted
- [ ] Audit logging enabled
- [ ] Security tests passing

### **Ongoing Monitoring**
- [ ] Regular security scans
- [ ] Access control reviews
- [ ] Performance monitoring
- [ ] User feedback analysis
- [ ] Security policy updates

## 🎯 **Security Best Practices**

### **For Developers**
- Never remove security components without understanding their purpose
- Always investigate root causes before applying fixes
- Maintain architectural integrity above all else
- Follow security-first development practices
- Keep security documentation updated

### **For Users**
- Use strong authentication methods
- Enable multi-factor authentication
- Report security concerns immediately
- Follow privacy best practices
- Keep software updated

---

**This security model ensures comprehensive protection of user data and system integrity while maintaining the highest standards of privacy and security.**

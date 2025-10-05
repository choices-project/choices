# RLS (Row Level Security) Implementation for Civics 2.0

**Created:** December 19, 2024  
**Updated:** December 19, 2024

## Overview

This document outlines the comprehensive Row Level Security (RLS) implementation for the Civics 2.0 database. RLS ensures that data access is properly controlled at the database level, providing an additional layer of security beyond application-level controls.

## Security Model

### Access Levels

1. **Public Read Access** - All representative data is publicly readable
2. **Service Role Full Access** - Backend services can read/write all data
3. **Authenticated User Access** - Logged-in users can read data
4. **Admin-Only Access** - Sensitive metadata tables restricted to service role

### Tables and Security Policies

#### Core Data Tables (Public Read)
- `representatives_core` - Main representative data
- `representative_contacts` - Contact information
- `representative_social_media` - Social media handles
- `representative_photos` - Photo URLs
- `representative_activity` - Recent activity
- `representative_committees` - Committee memberships
- `representative_bills` - Sponsored bills
- `representative_speeches` - Floor speeches
- `representative_accountability` - Accountability tracking

#### Crosswalk Tables (Public Read)
- `id_crosswalk` - Canonical ID mappings

#### Metadata Tables (Service Role Only)
- `data_quality_metrics` - Data quality scores
- `ingestion_logs` - Ingestion process logs
- `api_usage_tracking` - API usage statistics
- `audit_log` - Security audit trail

## RLS Policies

### Public Read Policies
```sql
-- All representative data is publicly readable
CREATE POLICY "Public can read representatives" ON representatives_core
    FOR SELECT USING (true);
```

### Service Role Policies
```sql
-- Service role has full access to all tables
CREATE POLICY "Service role full access" ON representatives_core
    FOR ALL USING (auth.role() = 'service_role');
```

### Authenticated User Policies
```sql
-- Authenticated users can read data
CREATE POLICY "Authenticated users can read" ON representatives_core
    FOR SELECT USING (auth.role() = 'authenticated');
```

## Security Features

### 1. Data Classification
- **Public Data**: Representative information, contact details, social media
- **Sensitive Data**: Ingestion logs, API usage, audit trails
- **Restricted Data**: Internal process data

### 2. Access Control Matrix

| Table | Public Read | Authenticated Read | Service Role |
|-------|-------------|-------------------|--------------|
| representatives_core | ✅ | ✅ | ✅ Full |
| representative_contacts | ✅ | ✅ | ✅ Full |
| representative_social_media | ✅ | ✅ | ✅ Full |
| representative_photos | ✅ | ✅ | ✅ Full |
| representative_activity | ✅ | ✅ | ✅ Full |
| representative_committees | ✅ | ✅ | ✅ Full |
| representative_bills | ✅ | ✅ | ✅ Full |
| representative_speeches | ✅ | ✅ | ✅ Full |
| representative_accountability | ✅ | ✅ | ✅ Full |
| id_crosswalk | ✅ | ✅ | ✅ Full |
| data_quality_metrics | ✅ | ✅ | ✅ Full |
| ingestion_logs | ❌ | ❌ | ✅ Full |
| api_usage_tracking | ❌ | ❌ | ✅ Full |
| audit_log | ❌ | ❌ | ✅ Full |

### 3. Performance Optimizations
- Indexes created for RLS performance
- Optimized queries for public access
- Efficient crosswalk lookups

## Implementation Steps

### 1. Enable RLS
```sql
ALTER TABLE representatives_core ENABLE ROW LEVEL SECURITY;
```

### 2. Create Policies
```sql
-- Public read access
CREATE POLICY "Public can read representatives" ON representatives_core
    FOR SELECT USING (true);
```

### 3. Create Indexes
```sql
-- Performance indexes
CREATE INDEX idx_representatives_core_state ON representatives_core(state);
CREATE INDEX idx_id_crosswalk_canonical_id ON id_crosswalk(canonical_id);
```

### 4. Verify Implementation
```sql
-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

## Security Considerations

### 1. Data Exposure
- **Public data** is intentionally public (representative information)
- **Sensitive data** is restricted to service role only
- **No PII** is exposed in public tables

### 2. API Security
- Service role authentication required for write operations
- Public read access for representative data
- Rate limiting at application level

### 3. Audit Trail
- All sensitive operations logged
- Audit log table with RLS protection
- Service role access only

## Monitoring

### 1. RLS Status Check
```sql
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### 2. Policy Verification
```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 3. Access Testing
```sql
-- Test public access
SELECT COUNT(*) FROM representatives_core;

-- Test service role access
SET ROLE service_role;
SELECT COUNT(*) FROM ingestion_logs;
```

## Best Practices

### 1. Principle of Least Privilege
- Public users can only read public data
- Service role has full access only when needed
- Sensitive operations require authentication

### 2. Defense in Depth
- RLS at database level
- Authentication at application level
- Rate limiting at API level

### 3. Monitoring and Auditing
- Regular RLS policy reviews
- Access pattern monitoring
- Security audit logging

## Troubleshooting

### Common Issues

1. **RLS Blocking Queries**
   - Check if user has appropriate role
   - Verify policy conditions
   - Test with service role

2. **Performance Issues**
   - Ensure indexes are created
   - Optimize policy conditions
   - Monitor query performance

3. **Policy Conflicts**
   - Review policy order
   - Check for overlapping conditions
   - Test with different user roles

## Next Steps

1. **Deploy RLS Policies** - Run the SQL script in Supabase
2. **Test Access Patterns** - Verify public and service role access
3. **Monitor Performance** - Check for any performance impacts
4. **Security Audit** - Regular review of access patterns
5. **Documentation Update** - Keep security docs current

## Files Created

- `implement-rls-policies.sql` - Complete RLS implementation
- `RLS-SECURITY-IMPLEMENTATION.md` - This documentation

## Security Contact

For security-related questions or issues, contact the development team.

---

**Note:** This RLS implementation provides comprehensive security while maintaining the public nature of representative data. All sensitive operations are properly protected, and the system follows security best practices.

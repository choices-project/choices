# Database Schema Implementation Plan

**Created:** August 25, 2025  
**Updated:** August 25, 2025  
**Status:** Phase 1.4 - Database Schema Hardening (IN PROGRESS - MIGRATIONS READY)

## Overview

This document outlines the implementation plan for integrating the schema review recommendations with our current authentication system. The goal is to transform our MVP schema into an enterprise-ready, secure, and scalable database architecture.

## Integration with Current System

### Current Authentication System Status
- ✅ **Phase 1.1**: Enhanced Error Handling & UX (COMPLETED)
- ✅ **Phase 1.2**: Production Hardening (COMPLETED)
- 🔄 **Phase 1.3**: Advanced Security Features (IN PROGRESS)
- 🔄 **Phase 1.4**: Database Schema Hardening (MIGRATIONS READY)

### Schema Review Recommendations Alignment
The schema review recommendations perfectly align with our authentication system goals:

1. **WebAuthn Enhancement** → Matches our biometric-first strategy
2. **Device Flow Hardening** → Enhances our backup authentication method
3. **DPoP Token Binding** → Part of our Phase 1.3 security features
4. **Identity Unification** → Critical for scaling to millions of users
5. **Privacy & Retention** → Essential for compliance and user trust

## Implementation Strategy

### Phase 1.4: Database Schema Hardening (7 Weeks)

#### Week 1: Identity Unification (CRITICAL) ✅ READY
**Goal**: Create single source of truth for user identity

**Tasks**:
- [x] Create canonical `users` view/table
- [x] Add `user_id UUID` to all child tables
- [x] Backfill user relationships
- [x] Add foreign key constraints
- [x] Update application code to use new user references
- [x] Migration script: `scripts/migrations/001-identity-unification.sql`

**SQL Implementation**:
```sql
-- Create canonical users view
CREATE OR REPLACE VIEW users AS
SELECT id, email, created_at FROM auth.users;

-- Add user_id to child tables
ALTER TABLE user_profiles ADD COLUMN user_id UUID;
ALTER TABLE webauthn_credentials ADD COLUMN user_id UUID;
ALTER TABLE device_flows ADD COLUMN user_id UUID;
ALTER TABLE votes ADD COLUMN user_id UUID;
ALTER TABLE polls ADD COLUMN created_by UUID;

-- Backfill relationships
UPDATE user_profiles SET user_id = auth.users.id WHERE user_id IS NULL;
UPDATE webauthn_credentials SET user_id = auth.users.id WHERE user_id IS NULL;
-- ... (repeat for all tables)

-- Add constraints
ALTER TABLE user_profiles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_user 
  FOREIGN KEY (user_id) REFERENCES auth.users(id);
```

**Code Changes**:
- Update all user lookups to use `auth.users.id`
- Modify authentication flows to use canonical user ID
- Update RLS policies to use `auth.uid()`

#### Week 2: WebAuthn Storage Enhancement (HIGH) ✅ READY
**Goal**: Enhance WebAuthn credential storage with binary IDs and metadata

**Tasks**:
- [x] Rename `biometric_credentials` to `webauthn_credentials`
- [x] Convert credential IDs to binary storage
- [x] Add AAGUID, COSE keys, and transport metadata
- [x] Enhance sign count tracking
- [x] Update WebAuthn library integration
- [x] Migration script: `scripts/migrations/002-webauthn-enhancement.sql`

**SQL Implementation**:
```sql
-- Rename and enhance table
ALTER TABLE biometric_credentials RENAME TO webauthn_credentials;

ALTER TABLE webauthn_credentials
  ALTER COLUMN credential_id TYPE BYTEA USING decode(credential_id, 'hex'),
  ADD COLUMN aaguid UUID,
  ADD COLUMN cose_public_key BYTEA,
  ADD COLUMN transports TEXT[] DEFAULT '{}',
  ADD COLUMN backup_eligible BOOLEAN DEFAULT FALSE,
  ADD COLUMN backup_state BOOLEAN DEFAULT FALSE,
  ADD COLUMN last_uv_result BOOLEAN,
  ALTER COLUMN sign_count TYPE BIGINT;

-- Add indexes
CREATE UNIQUE INDEX uq_webauthn_user_cred ON webauthn_credentials (user_id, credential_id);
CREATE INDEX idx_webauthn_aaguid ON webauthn_credentials (aaguid);
CREATE INDEX idx_webauthn_user_active ON webauthn_credentials (user_id) WHERE revoked_at IS NULL;
```

**Code Changes**:
- Update `web/lib/webauthn.ts` to handle binary credential IDs
- Add AAGUID and metadata extraction
- Implement sign count regression detection
- Add credential cloning detection

#### Week 3: Device Flow Hardening (HIGH) ✅ READY
**Goal**: Enhance device flow security with hashing and telemetry

**Tasks**:
- [x] Add hashing for device and user codes
- [x] Implement telemetry tracking
- [x] Add polling interval management
- [x] Enhance rate limiting integration
- [x] Add TTL indexing for automatic cleanup
- [x] Migration script: `scripts/migrations/004-device-flow-hardening.sql`

**SQL Implementation**:
```sql
-- Add hashing and telemetry
ALTER TABLE device_flows
  ADD COLUMN device_code_hash BYTEA,
  ADD COLUMN user_code_hash BYTEA,
  ADD COLUMN interval_seconds INT DEFAULT 5,
  ADD COLUMN last_polled_at TIMESTAMPTZ,
  ADD COLUMN poll_count INT DEFAULT 0,
  ADD COLUMN retention_expires_at TIMESTAMPTZ;

-- Add indexes
CREATE INDEX idx_device_flows_expires ON device_flows (expires_at);
CREATE INDEX idx_device_flows_user_code_hash ON device_flows (user_code_hash);
CREATE INDEX idx_device_flows_retention ON device_flows (retention_expires_at);
```

**Code Changes**:
- Update `web/lib/device-flow.ts` to use hashed codes
- Add telemetry tracking in polling endpoints
- Implement automatic cleanup jobs
- Enhance rate limiting with telemetry data

#### Week 4: Token/Session Safety (HIGH) ✅ READY
**Goal**: Implement secure token storage with DPoP binding

**Tasks**:
- [x] Hash all tokens before storage
- [x] Implement DPoP binding
- [x] Add token rotation lineage
- [x] Add revocation support
- [x] Update session management
- [x] Migration script: `scripts/migrations/003-dpop-token-binding.sql`

**SQL Implementation**:
```sql
-- DPoP binding and token security
ALTER TABLE ia_tokens
  ADD COLUMN dpop_jkt TEXT,
  ADD COLUMN rotated_from UUID,
  ADD COLUMN revoked_at TIMESTAMPTZ,
  ADD COLUMN token_hash TEXT; -- Store hashed tokens

-- Add indexes
CREATE INDEX idx_tokens_user_expires ON ia_tokens (user_stable_id, expires_at);
CREATE INDEX idx_tokens_jkt ON ia_tokens (dpop_jkt);
CREATE INDEX idx_tokens_revoked ON ia_tokens (revoked_at) WHERE revoked_at IS NOT NULL;

-- Session safety
ALTER TABLE user_sessions
  ALTER COLUMN session_token TYPE TEXT, -- store hash, not raw
  ADD COLUMN dpop_jkt TEXT,
  ADD COLUMN last_rotated_at TIMESTAMPTZ,
  ADD COLUMN ip_hash TEXT,
  ADD COLUMN ua_hash TEXT;
```

**Code Changes**:
- Update token creation to hash before storage
- Implement DPoP JKT generation and validation
- Add token rotation tracking
- Update session management with privacy protection

#### Week 5: RLS Correctness (MEDIUM)
**Goal**: Standardize row-level security policies

**Tasks**:
- [ ] Standardize on `auth.uid()` principal
- [ ] Ensure proper row ownership
- [ ] Add public aggregation policies
- [ ] Test RLS with different roles
- [ ] Document RLS policies

**SQL Implementation**:
```sql
-- Standardize RLS policies
CREATE POLICY votes_read_own ON votes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY votes_write_own ON votes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY votes_read_aggregate ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls p
      WHERE p.id = votes.poll_id
        AND (p.status='closed' OR p.privacy_level='public')
    )
  ) WITH CHECK (false);

-- Similar policies for other tables
```

**Code Changes**:
- Update all queries to respect RLS policies
- Add service role handling for admin operations
- Test RLS with different user roles
- Document RLS policy matrix

#### Week 6: Privacy & Retention (MEDIUM)
**Goal**: Implement privacy protection and data retention

**Tasks**:
- [ ] Hash IP addresses and user agents
- [ ] Add retention windows
- [ ] Implement purge jobs
- [ ] Add compliance tracking
- [ ] Test privacy measures

**SQL Implementation**:
```sql
-- Hash sensitive data
ALTER TABLE user_sessions
  ADD COLUMN ip_hash TEXT,
  ADD COLUMN ua_hash TEXT;

-- Add retention windows
ALTER TABLE device_flows 
  ADD COLUMN retention_expires_at TIMESTAMPTZ;

-- Create purge jobs
CREATE OR REPLACE FUNCTION purge_expired_data() RETURNS void AS $$
BEGIN
  DELETE FROM device_flows WHERE expires_at < NOW() - INTERVAL '24 hours';
  DELETE FROM user_sessions WHERE last_rotated_at < NOW() - INTERVAL '30 days';
  DELETE FROM auth_analytics WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule purge job
SELECT cron.schedule('purge-expired-data', '0 2 * * *', 'SELECT purge_expired_data();');
```

**Code Changes**:
- Update logging to hash sensitive data
- Implement retention window tracking
- Add compliance reporting
- Test privacy protection measures

#### Week 7: Type Hygiene (MEDIUM)
**Goal**: Improve type safety and consistency

**Tasks**:
- [ ] Create ENUMs for recurring values
- [ ] Add updated_at triggers
- [ ] Fix naming inconsistencies
- [ ] Add constraint validation
- [ ] Document type system

**SQL Implementation**:
```sql
-- Create ENUMs
CREATE TYPE voting_method_enum AS ENUM ('single','approval','ranked','quadratic','range');
CREATE TYPE privacy_level_enum AS ENUM ('public','private','high-privacy');
CREATE TYPE poll_status_enum AS ENUM ('draft','active','closed','archived');

-- Apply ENUMs
ALTER TABLE polls
  ALTER COLUMN voting_method TYPE voting_method_enum USING voting_method::voting_method_enum,
  ALTER COLUMN privacy_level TYPE privacy_level_enum USING privacy_level::privacy_level_enum,
  ALTER COLUMN status TYPE poll_status_enum USING status::poll_status_enum;

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_polls_updated BEFORE UPDATE ON polls
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Add constraints
ALTER TABLE polls ADD CONSTRAINT poll_time_valid CHECK (start_time < end_time);
ALTER TABLE votes ADD CONSTRAINT uq_vote_one_per_user UNIQUE (poll_id, user_id);
```

**Code Changes**:
- Update TypeScript types to match ENUMs
- Add constraint validation in application code
- Update forms to use ENUM values
- Add type safety checks

## Migration Strategy

### Safe Migration Approach

#### Phase 1: Preparation (Week 0)
- [ ] Create migration scripts
- [ ] Set up rollback procedures
- [ ] Create validation tests
- [ ] Set up monitoring
- [ ] Create backup strategy

#### Phase 2: Dual-write (Weeks 1-7)
- [ ] Write to both old and new schemas
- [ ] Validate data integrity
- [ ] Monitor performance impact
- [ ] Test rollback procedures
- [ ] Document any issues

#### Phase 3: Cutover (Week 8)
- [ ] Switch to new schema exclusively
- [ ] Monitor system health
- [ ] Validate all functionality
- [ ] Update application code
- [ ] Remove legacy code

#### Phase 4: Cleanup (Week 9)
- [ ] Remove legacy tables
- [ ] Clean up old constraints
- [ ] Update documentation
- [ ] Archive migration scripts
- [ ] Update monitoring

### Rollback Plan
- **Immediate Rollback**: Revert to old schema within 30 minutes
- **Data Preservation**: All data preserved during migration
- **Backward Compatibility**: Maintain compatibility for one release cycle
- **Automated Rollback**: Scripts for each migration phase

## Integration with Current Authentication System

### Enhanced Rate Limiting Integration
```typescript
// Enhanced rate limiting with schema improvements
const rateLimitResult = await rateLimiters.biometric.check(request)

// Store hashed IP and device info
const ipHash = await hashIP(rateLimitResult.reputation?.ip)
const deviceHash = await hashDeviceInfo(rateLimitResult.deviceInfo)

// Log with privacy protection
await logAuthEvent('BIOMETRIC_AUTH_SUCCESS', {
  userId: user.id,
  ipHash,
  deviceHash,
  performance: { duration: 1500 },
  security: { riskScore: 0.1 }
})
```

### WebAuthn Enhancement Integration
```typescript
// Enhanced WebAuthn with binary storage
const result = await registerBiometric(userId, username, {
  aaguid: credential.aaguid,
  cosePublicKey: credential.publicKey,
  transports: credential.transports,
  backupEligible: credential.backupEligible,
  backupState: credential.backupState
})
```

### DPoP Integration
```typescript
// DPoP token binding
const dpopJkt = await generateDPoPJKT(request)
const token = await createSecureToken(userId, {
  dpopJkt,
  rotatedFrom: previousToken?.id,
  expiresAt: new Date(Date.now() + 3600000) // 1 hour
})
```

## Testing Strategy

### Schema Migration Testing
- [ ] **Data Integrity**: Verify all data preserved during migration
- [ ] **Performance**: Ensure no performance regression
- [ ] **Security**: Validate RLS policies work correctly
- [ ] **Rollback**: Test rollback procedures

### Security Testing
- [ ] **Token Security**: Verify tokens are properly hashed
- [ ] **DPoP Validation**: Test DPoP binding and replay protection
- [ ] **Privacy**: Verify sensitive data is properly hashed
- [ ] **RLS**: Test row-level security policies

### Performance Testing
- [ ] **Load Testing**: Verify system handles expected load
- [ ] **Index Performance**: Ensure indexes improve query performance
- [ ] **Migration Performance**: Test migration speed and impact
- [ ] **Rollback Performance**: Verify rollback procedures are fast

## Success Metrics

### Security Metrics
- **Token Security**: 100% of tokens stored as hashes
- **DPoP Coverage**: 100% of tokens DPoP-bound
- **Privacy Protection**: 100% of sensitive data hashed
- **RLS Coverage**: 100% of user data protected by RLS

### Performance Metrics
- **Migration Time**: < 1 hour for full schema migration
- **Performance Impact**: < 5% performance regression
- **Rollback Time**: < 30 minutes for emergency rollback
- **Data Integrity**: 100% data preservation

### Compliance Metrics
- **Retention Compliance**: 100% automatic data purging
- **Privacy Compliance**: 100% sensitive data protection
- **Audit Compliance**: Complete audit trail coverage
- **Access Control**: 100% proper access controls

## Risk Mitigation

### Technical Risks
- **Data Loss**: Mitigated by dual-write and rollback procedures
- **Performance Impact**: Mitigated by gradual migration and monitoring
- **Security Vulnerabilities**: Mitigated by comprehensive testing
- **Compatibility Issues**: Mitigated by backward compatibility period

### Business Risks
- **Service Disruption**: Mitigated by careful planning and rollback procedures
- **User Experience Impact**: Mitigated by transparent communication
- **Compliance Violations**: Mitigated by privacy-first approach
- **Scalability Issues**: Mitigated by performance testing

## Deployment Instructions

### Migration Deployment
All migration scripts are ready for deployment. Use the automated deployment script:

```bash
# Deploy all migrations
node scripts/deploy-schema-migrations.js

# Dry run to preview changes
node scripts/deploy-schema-migrations.js --dry-run

# Deploy specific migration
node scripts/deploy-schema-migrations.js --migration=001
```

### Migration Files Created
- ✅ `scripts/migrations/001-identity-unification.sql`
- ✅ `scripts/migrations/002-webauthn-enhancement.sql`
- ✅ `scripts/migrations/003-dpop-token-binding.sql`
- ✅ `scripts/migrations/004-device-flow-hardening.sql`
- ✅ `scripts/deploy-schema-migrations.js`

### Pre-deployment Checklist
- [ ] Backup database
- [ ] Test migrations in development environment
- [ ] Review migration scripts
- [ ] Schedule maintenance window
- [ ] Notify team of deployment

### Post-deployment Verification
- [ ] Verify all tables have correct structure
- [ ] Test DPoP token binding functionality
- [ ] Verify WebAuthn credential storage
- [ ] Test device flow authentication
- [ ] Check RLS policies are working correctly
- [ ] Monitor application performance

## Next Steps

### Immediate Actions (This Week)
1. **Review and approve** migration scripts
2. **Test migrations** in development environment
3. **Schedule deployment** to production
4. **Set up monitoring** for migration process
5. **Update application code** to use new schema features

### Week 1 Preparation
1. **Identity Unification** implementation
2. **Backup strategy** verification
3. **Rollback procedures** testing
4. **Performance baseline** establishment
5. **Team training** on new schema

### Long-term Planning
1. **Phase 2**: Anti-bot & verification features
2. **Phase 3**: Scale & optimization
3. **Continuous improvement**: Based on metrics and feedback
4. **Compliance evolution**: As regulations change

---

**Last Updated:** August 25, 2025  
**Next Review:** September 1, 2025

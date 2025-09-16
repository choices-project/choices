# Database Schema Documentation

> **Complete database schema for the Choices platform**

## 📋 Overview

This directory contains the complete database schema implementation for Phase 1 of the Choices platform. The schema supports poll lifecycle management, vote processing, WebAuthn authentication, and comprehensive results analysis.

## 🗂️ File Structure

```
database/
├── schema.sql                    # Complete schema with all tables and policies
├── views/
│   └── results_views.sql         # Three results views (live, baseline, drift)
├── policies/
│   └── rls_policies.sql          # Row Level Security policies
├── migrations/
│   ├── 001_initial_schema.sql    # Initial schema migration
│   └── 002_baseline_system.sql   # Baseline system features migration
└── README.md                     # This documentation
```

## 🏗️ Database Schema

### Core Tables

#### `polls`
- **Purpose**: Stores user-created polls with voting options and lifecycle controls
- **Key Features**:
  - Support for 6 voting methods (single, multiple, ranked, approval, range, quadratic)
  - Privacy levels (public, private, invite-only)
  - Lifecycle controls (baseline_at, allow_post_close, locked_at)
  - JSONB options for flexible poll configuration

#### `votes`
- **Purpose**: Stores user votes with verification and voting method support
- **Key Features**:
  - One vote per user per poll constraint
  - Flexible vote_data JSONB for different voting methods
  - Verification system with tokens
  - Support for all voting methods

#### `webauthn_credentials`
- **Purpose**: Stores WebAuthn passkey credentials for passwordless authentication
- **Key Features**:
  - Binary credential storage (BYTEA)
  - Counter for replay attack prevention
  - Transport support (USB, NFC, BLE, internal)
  - User-friendly credential naming

#### `user_profiles`
- **Purpose**: Extended user profile information
- **Key Features**:
  - Trust tier system (T0-T3)
  - Username and email management
  - Avatar and bio support

#### `error_logs`
- **Purpose**: System error logging for monitoring and debugging
- **Key Features**:
  - Severity levels (low, medium, high, critical)
  - Context storage in JSONB
  - User association for debugging

#### `feedback`
- **Purpose**: User feedback and feature requests
- **Key Features**:
  - Type classification (bug, feature, general)
  - Sentiment analysis (positive, negative, neutral)
  - Priority and status tracking
  - Screenshot support

## 🔐 Security Features

### Row Level Security (RLS)
All tables have RLS enabled with comprehensive policies:

- **Poll Access**: Users can view public polls and their own polls
- **Vote Management**: Users can only vote on active, unlocked polls
- **Lifecycle Enforcement**: Votes are restricted based on poll status and timing
- **Credential Security**: Users can only manage their own WebAuthn credentials

### Lifecycle Controls
- **baseline_at**: Timestamp when baseline results were captured
- **allow_post_close**: Whether voting is allowed after poll closes
- **locked_at**: Timestamp when poll was locked (no more changes)

## 📊 Results Views

### `poll_results_live_view`
- Current live results for all polls
- Vote counts and percentages for up to 10 choices
- Real-time calculation of results

### `poll_results_baseline_view`
- Results as they were at the baseline timestamp
- Historical snapshot for comparison
- Only shows polls with baseline_at set

### `poll_results_drift_view`
- Comparison between live and baseline results
- Vote count and percentage differences
- Drift analysis for detecting manipulation

## 🚀 Migration Strategy

### Migration 001: Initial Schema
1. Creates all core tables
2. Sets up basic indexes
3. Enables RLS on all tables
4. Creates basic policies
5. Sets up triggers for updated_at

### Migration 002: Baseline System
1. Adds lifecycle control indexes
2. Creates results views
3. Implements advanced RLS policies with lifecycle restrictions
4. Adds performance optimizations

## 📈 Performance Optimizations

### Indexes
- **Polls**: created_by, status, category, privacy_level, created_at, end_time, baseline_at, locked_at
- **Votes**: poll_id, user_id, created_at, is_verified, voting_method
- **WebAuthn**: user_id, credential_id, is_active, last_used_at
- **User Profiles**: user_id, username, email, trust_tier
- **Error Logs**: user_id, severity, created_at
- **Feedback**: user_id, type, status, priority, created_at

### Query Optimization
- Views use efficient JOINs and aggregations
- RLS policies are optimized for performance
- Indexes support common query patterns

## 🔧 Usage Examples

### Creating a Poll
```sql
INSERT INTO polls (title, description, options, voting_method, created_by)
VALUES (
  'Sample Poll',
  'This is a sample poll',
  '["Option 1", "Option 2", "Option 3"]'::jsonb,
  'single',
  auth.uid()
);
```

### Voting on a Poll
```sql
INSERT INTO votes (poll_id, user_id, choice, voting_method)
VALUES (
  'poll-uuid-here',
  auth.uid(),
  0,
  'single'
);
```

### Viewing Live Results
```sql
SELECT * FROM poll_results_live_view WHERE poll_id = 'poll-uuid-here';
```

### Setting Baseline
```sql
UPDATE polls 
SET baseline_at = NOW() 
WHERE id = 'poll-uuid-here' AND created_by = auth.uid();
```

## 🛡️ Security Considerations

1. **RLS Enforcement**: All data access is controlled by RLS policies
2. **Lifecycle Protection**: Votes are restricted by poll status and timing
3. **User Isolation**: Users can only access their own data
4. **Admin Preparation**: Policies are prepared for future admin functionality
5. **Verification System**: Votes can be verified with tokens

## 📋 Deployment Checklist

- [ ] Run migration 001_initial_schema.sql
- [ ] Run migration 002_baseline_system.sql
- [ ] Verify all tables are created
- [ ] Verify RLS policies are active
- [ ] Test results views
- [ ] Verify indexes are created
- [ ] Test poll lifecycle functionality

## 🔄 Maintenance

### Regular Tasks
- Monitor error_logs for system issues
- Review feedback for user concerns
- Analyze poll results for anomalies
- Update indexes based on query patterns

### Performance Monitoring
- Monitor query performance on results views
- Check index usage statistics
- Review RLS policy performance
- Monitor database growth

---

**Created**: September 15, 2025  
**Last Updated**: September 15, 2025  
**Status**: ✅ **Production Ready**  
**Phase**: 1 - Database & Schema (Agent A)

# Database Schema Enhancements

**Created:** January 4, 2025  
**Purpose:** Document recommended database schema changes for enhanced functionality  
**Status:** RECOMMENDED FOR FUTURE IMPLEMENTATION

## **Overview**

During our comprehensive audit, we identified several database schema enhancements that would improve functionality while maintaining backward compatibility. These changes are **optional** and can be implemented incrementally.

## **1. Enhanced Profile Schema Alignment**

### **Current Schema Status**
The current `user_profiles` table has basic fields but is missing several fields that the enhanced profile system expects:

**Current Fields:**
- `id`, `user_id`, `username`, `email`, `bio`, `avatar_url`
- `trust_tier`, `is_admin`, `is_active`
- `created_at`, `updated_at`
- Location fields: `geo_lat`, `geo_lon`, `geo_coarse_hash`, etc.

**Missing Fields for Enhanced Profile:**
- `display_name` - User's preferred display name
- `preferences` - User preferences JSONB
- `privacy_settings` - Privacy configuration JSONB

### **Required Schema Enhancements**

```sql
-- Add missing core profile fields to match enhanced profile system
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "profile_visibility": "public",
  "show_email": false,
  "show_activity": true,
  "allow_messages": true,
  "share_demographics": false,
  "allow_analytics": true
}';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_trust_tier ON user_profiles(trust_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);
```

### **Optional Extended Profile Fields**

```sql
-- Add extended profile fields for enhanced functionality
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS primary_concerns TEXT[],
ADD COLUMN IF NOT EXISTS community_focus TEXT[],
ADD COLUMN IF NOT EXISTS participation_style TEXT DEFAULT 'observer',
ADD COLUMN IF NOT EXISTS demographics JSONB DEFAULT '{}';
```

### **Benefits**
- **Enhanced User Profiles:** More detailed user preferences and demographics
- **Privacy Controls:** Granular privacy settings for user data
- **Community Features:** Better community focus and participation tracking
- **Analytics:** Improved user behavior insights

## **2. Current Implementation Status**

### **Profile Actions Compatibility**
The current profile actions in `/lib/actions/profile-actions.ts` expect these fields:
- ✅ `username`, `email`, `bio`, `avatar_url` - **EXIST**
- ✅ `trust_tier`, `is_admin`, `is_active` - **EXIST**  
- ❌ `display_name` - **MISSING** (causes issues in profile display)
- ❌ `preferences` - **MISSING** (used for user preferences)
- ❌ `privacy_settings` - **MISSING** (used for privacy controls)

### **Immediate Impact**
Without these fields, the enhanced profile system will:
- Show `undefined` for display names
- Not be able to store user preferences
- Not be able to manage privacy settings
- Cause runtime errors in profile components

### **Quick Fix for Current Implementation**
To make the current profile actions work with the existing schema:

```sql
-- Minimum required fields for current implementation
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{}';
```

## **3. Future Schema Considerations**

### **Performance Optimizations**
```sql
-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_trust_tier ON user_profiles(trust_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
```

### **Audit Trail Enhancements**
```sql
-- Add audit trail columns to critical tables
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS last_updated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_reason TEXT;

ALTER TABLE polls 
ADD COLUMN IF NOT EXISTS last_modified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS modification_reason TEXT;
```

## **4. Implementation Strategy**

### **Phase 1: Critical Schema Alignment (REQUIRED)**
1. **Add Missing Core Fields** - `display_name`, `preferences`, `privacy_settings`
2. **Test Profile Actions** - Ensure enhanced profile system works
3. **Verify No Regressions** - All audited features still work

### **Phase 2: Performance & Indexes (Recommended)**
1. **Add Performance Indexes** - For better query performance
2. **Test Performance Impact** - Monitor query performance
3. **Optimize as Needed** - Based on actual usage patterns

### **Phase 3: Extended Features (Future)**
1. **Extended Profile Fields** - Demographics, concerns, community focus
2. **Audit Trail** - Add audit trail columns
3. **Advanced Analytics** - Add analytics-specific tables

## **5. Backward Compatibility**

✅ **All changes use `ADD COLUMN IF NOT EXISTS`** - Safe for existing data  
✅ **Default values provided** - No data migration required  
✅ **Optional columns** - Existing functionality unaffected  
✅ **Incremental implementation** - Can be added one at a time  

## **6. Testing Requirements**

Before implementing any schema changes:

1. **Backup database** - Always backup before schema changes
2. **Test in development** - Verify all audited features still work
3. **Run full test suite** - Ensure no regressions
4. **Monitor performance** - Check query performance impact

## **7. Current Status**

- ✅ **Core functionality working** - PWA, WebAuthn, Feedback, Auth, Polls
- ✅ **Schema enhancements applied** - All required fields added to user_profiles
- ✅ **Enhanced profile system ready** - display_name, preferences, privacy_settings available
- ✅ **Performance indexes created** - Optimized for common query patterns
- ✅ **Extended features available** - Demographics, concerns, community focus ready
- 📋 **Documentation updated** - Complete database schema reflects new fields

---

## **8. Ready-to-Execute SQL Commands**

### **Critical Schema Alignment (Execute First)**
```sql
-- Add missing core fields for enhanced profile system
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "profile_visibility": "public",
  "show_email": false,
  "show_activity": true,
  "allow_messages": true,
  "share_demographics": false,
  "allow_analytics": true
}';

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_trust_tier ON user_profiles(trust_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);
```

### **Optional Extended Features (Execute Later)**
```sql
-- Add extended profile fields for enhanced functionality
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS primary_concerns TEXT[],
ADD COLUMN IF NOT EXISTS community_focus TEXT[],
ADD COLUMN IF NOT EXISTS participation_style TEXT DEFAULT 'observer',
ADD COLUMN IF NOT EXISTS demographics JSONB DEFAULT '{}';
```

---

**Note:** ✅ **SCHEMA ENHANCEMENTS SUCCESSFULLY APPLIED** - All required fields have been added to the user_profiles table. The enhanced profile system is now ready to use the new fields. The complete database schema documentation has been updated to reflect these changes.

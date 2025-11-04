# API Endpoint Differences Explained

**Created**: January 29, 2025  
**For**: New developers understanding the codebase

## `/api/civic-actions` vs `/api/civics/actions`

These are **two different endpoints serving different purposes**, though the naming is confusing:

### `/api/civic-actions` (Public Community Actions)

**Purpose**: Public-facing civic engagement platform  
**Audience**: Anyone (public read access)  
**Use Case**: Community petitions, public campaigns, surveys, events

**Key Characteristics**:
- ✅ **Public actions** - Actions visible to everyone (`is_public: true`)
- ✅ **Community-driven** - Signature counts, target signatures
- ✅ **Categories & Urgency** - Organized by category and urgency level
- ✅ **No user filter** - Returns all public actions, not user-specific

**Data Model**:
```typescript
{
  action_type: 'petition' | 'campaign' | 'survey' | 'event'
  signature_count: number
  target_signatures: number
  is_public: boolean
  category: string
  urgency_level: 'low' | 'medium' | 'high' | 'critical'
}
```

**Example Use Case**: "Sign this petition for climate action" - anyone can see and sign it

### `/api/civics/actions` (Personal Action Tracking)

**Purpose**: User-specific civic action management  
**Audience**: Authenticated users only  
**Use Case**: Personal to-do list for civic engagement

**Key Characteristics**:
- ✅ **User-specific** - Each user sees only their own actions (`user_id` filtered)
- ✅ **Action tracking** - Track personal civic engagement tasks
- ✅ **Status management** - active, completed, cancelled, postponed
- ✅ **Private by default** - Actions belong to the user who created them

**Data Model**:
```typescript
{
  type: 'contact' | 'petition' | 'event' | 'donation' | 'volunteer'
  status: 'active' | 'completed' | 'cancelled' | 'postponed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  target_representative_id?: number
  due_date?: string
}
```

**Example Use Case**: "I need to contact my representative about healthcare" - personal reminder/tracker

### Summary Comparison

| Feature | `/api/civic-actions` | `/api/civics/actions` |
|---------|---------------------|---------------------|
| **Visibility** | Public (community-wide) | Private (user-specific) |
| **Auth Required** | No (read), Yes (write) | Yes (read & write) |
| **Purpose** | Public campaigns/petitions | Personal action tracking |
| **Data Focus** | Signatures, public engagement | Status, completion, personal goals |
| **Action Types** | petition, campaign, survey, event | contact, petition, event, donation, volunteer |

### Recommendation

**These are NOT redundant** - they serve different purposes:
- `/api/civic-actions` = **Public platform** for community organizing
- `/api/civics/actions` = **Personal tracker** for individual users

However, the naming is confusing. Consider:
- Renaming `/api/civic-actions` → `/api/civic-campaigns` or `/api/public-actions`
- Or renaming `/api/civics/actions` → `/api/civics/my-actions` or `/api/user-actions`

---

## `/api/chaos/run-drill` (Chaos Engineering)

**What is Chaos Engineering?**

Chaos engineering is a testing methodology where you **intentionally inject failures** into your system to test how it handles unexpected problems. The idea is: "If something is going to break, we want it to break when we're watching, not when real users are affected."

**Common Chaos Experiments**:
- Kill a database connection
- Introduce network latency
- Simulate high CPU usage
- Randomly fail API requests
- Drain resources (memory, disk space)

**Why It's Useful**:
1. **Find hidden bugs** before they affect users
2. **Test error handling** and fallback mechanisms
3. **Verify monitoring** actually catches problems
4. **Build confidence** that your system is resilient
5. **Improve recovery procedures**

**Current Status**:
⚠️ **DISABLED** - The endpoint currently returns `503 Service Unavailable` with message:
```
"Chaos testing temporarily disabled - missing dependencies"
```

**What It Would Do (If Enabled)**:
The endpoint would run various "drills" like:
- Simulate database connection failures
- Test rate limiting under load
- Verify error handling paths
- Check monitoring/alerting systems

**Security Note**:
⚠️ **This should be ADMIN-ONLY** and should NEVER be enabled in production without proper safeguards. Chaos engineering should:
- Only run in staging/test environments
- Require admin authentication
- Have kill switches to stop experiments
- Not affect real user data

**Files**:
- `/app/api/chaos/run-drill/route.ts` - Currently just a stub returning 503

**Future Implementation** (if needed):
If you want to enable chaos engineering:
1. Add proper admin authentication
2. Only enable in staging/dev environments
3. Implement specific drill scenarios
4. Add monitoring and automatic rollback
5. Document safety procedures

---

## Quick Reference

### Civic Actions Endpoints
- **Public Campaigns**: `GET/POST /api/civic-actions`
- **Personal Tracking**: `GET/POST /api/civics/actions`

### Chaos Engineering
- **Endpoint**: `POST /api/chaos/run-drill`
- **Status**: Disabled (stub)
- **Purpose**: Test system resilience
- **Access**: Should be admin-only when enabled

---

**Questions?** Check:
- `/docs/API_DOCUMENTATION_CIVICS.md` - Full API docs
- `/web/CIVICS_COMPREHENSIVE_AUDIT.md` - Latest audit results



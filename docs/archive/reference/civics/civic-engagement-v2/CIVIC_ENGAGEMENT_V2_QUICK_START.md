# Civic Engagement V2 - Quick Start Guide

> **Archived (Jan 2026):** This quick start targets the deprecated Civic Engagement V2 prototype. Refer to `docs/FEATURE_STATUS.md#civic_engagement_v2` and current civic-actions documentation for the active flow.

**Feature:** Civic Engagement V2  
**Status:** Ready for Use  
**Date:** January 2025

---

## Quick Setup

### 1. Enable the Feature

Edit `web/lib/core/feature-flags.ts`:

```typescript
export const FEATURE_FLAGS = {
  // ...
  CIVIC_ENGAGEMENT_V2: true, // Enable the feature
} as const;
```

### 2. Run Database Migration

```bash
cd supabase
supabase db push
```

Or apply the migration manually:
```bash
psql $DATABASE_URL -f supabase/migrations/2025-01-22_001_enhance_civic_actions_v2.sql
```

### 3. Verify Installation

Check that the migration was successful:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'civic_actions' 
AND column_name IN ('urgency_level', 'is_public', 'target_representatives', 'metadata');
```

You should see all 4 new columns.

---

## Basic Usage

### Creating a Civic Action

```typescript
import { CreateCivicActionForm } from '@/features/civics/components/civic-actions';

function MyPage() {
  return (
    <CreateCivicActionForm
      onSuccess={(actionId) => {
        router.push(`/civic-actions/${actionId}`);
      }}
    />
  );
}
```

### Displaying Actions

```typescript
import { CivicActionList } from '@/features/civics/components/civic-actions';

function ActionsPage() {
  return (
    <CivicActionList
      filters={{ status: 'active', action_type: 'petition' }}
      onSign={async (actionId) => {
        const response = await fetch(`/api/civic-actions/${actionId}/sign`, {
          method: 'POST',
        });
        if (response.ok) {
          // Handle success
        }
      }}
    />
  );
}
```

### API Usage

```typescript
// Create an action
const response = await fetch('/api/civic-actions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Support Climate Action',
    description: 'Urgent petition for climate legislation',
    action_type: 'petition',
    urgency_level: 'high',
    required_signatures: 1000,
    is_public: true,
  }),
});

const { data: action } = await response.json();

// Sign the action
await fetch(`/api/civic-actions/${action.id}/sign`, {
  method: 'POST',
});
```

---

## Common Patterns

### Filtering Actions

```typescript
// Get active petitions
const response = await fetch(
  '/api/civic-actions?status=active&action_type=petition&limit=20'
);

// Get high urgency actions
const response = await fetch(
  '/api/civic-actions?urgency_level=high&status=active'
);

// Get actions for a specific representative
const response = await fetch(
  '/api/civic-actions?target_representative_id=123&status=active'
);
```

### Creating Actions Programmatically

```typescript
import { createSophisticatedCivicAction } from '@/lib/utils/sophisticated-civic-engagement';

const action = await createSophisticatedCivicAction(
  {
    title: 'Climate Action Petition',
    description: 'Urgent petition for climate action',
    actionType: 'petition',
    category: 'environment',
    urgencyLevel: 'high',
    targetRepresentatives: [1, 2, 3],
    targetSignatures: 1000,
    isPublic: true,
  },
  userId
);
```

### Integration with Feeds

```typescript
import { createCivicActionFeedItem } from '@/lib/utils/civic-actions-integration';

// After creating an action, add it to feeds
await createCivicActionFeedItem(actionId, userId);
```

### Linking to Representatives

```typescript
import { linkCivicActionToRepresentatives } from '@/lib/utils/civic-actions-integration';

// Link action to representatives
await linkCivicActionToRepresentatives(actionId, [1, 2, 3]);
```

---

## Component Examples

### CivicActionCard

```typescript
import { CivicActionCard } from '@/features/civics/components/civic-actions';

<CivicActionCard
  action={action}
  onSign={async (actionId) => {
    await fetch(`/api/civic-actions/${actionId}/sign`, { method: 'POST' });
  }}
  signed={signedActions.has(action.id)}
  showSignButton={true}
/>
```

### Custom Filtering

```typescript
const [filters, setFilters] = useState({
  status: 'active',
  urgency_level: 'high',
});

<CivicActionList
  filters={filters}
  onSign={handleSign}
/>
```

---

## Analytics Tracking

Analytics events are automatically tracked. To track custom events:

```typescript
import { trackCivicActionEvent } from '@/features/civics/analytics/civicActionsAnalyticsEvents';
import { useAnalyticsActions } from '@/lib/stores';

const { trackEvent } = useAnalyticsActions();

trackCivicActionEvent(trackEvent, {
  type: 'civic_action_viewed',
  data: {
    actionId: action.id,
    actionType: action.action_type,
    signatureCount: action.current_signatures,
    progressPercentage: 50,
  },
});
```

---

## Troubleshooting

### Feature Not Working

1. **Check feature flag:**
   ```typescript
   import { isFeatureEnabled } from '@/lib/core/feature-flags';
   console.log(isFeatureEnabled('CIVIC_ENGAGEMENT_V2')); // Should be true
   ```

2. **Check migration:**
   ```sql
   SELECT * FROM information_schema.columns 
   WHERE table_name = 'civic_actions' 
   AND column_name = 'urgency_level';
   ```

3. **Check API response:**
   ```bash
   curl http://localhost:3000/api/civic-actions
   # Should not return 403 if feature is enabled
   ```

### Common Errors

**403 Forbidden:**
- Feature flag is disabled
- Solution: Enable `CIVIC_ENGAGEMENT_V2` in feature flags

**404 Not Found:**
- Action doesn't exist or is private
- Solution: Check action ID and privacy settings

**400 Validation Error:**
- Invalid input data
- Solution: Check validation error message for specific field

**429 Too Many Requests:**
- Rate limit exceeded
- Solution: Wait before retrying

---

## Next Steps

1. **Create your first action** using the form component
2. **Test signing** a petition
3. **Explore filtering** options
4. **Integrate with feeds** for user engagement
5. **Link to representatives** for targeted actions

---

## Resources

- **API Documentation:** `docs/API/civic-actions.md`
- **Implementation Details:** `docs/CIVIC_ENGAGEMENT_V2_IMPLEMENTATION.md`
- **Test Plan:** `docs/CIVIC_ENGAGEMENT_V2_TEST_PLAN.md`

---

**Last Updated:** January 2025


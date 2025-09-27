# Automated Polls - Disabled Files Inventory

**Created:** 2024-12-19  
**Status:** All files disabled for future implementation

## 📁 Disabled API Routes

### Generated Polls
```
app/api/admin/generated-polls/
├── route.ts.disabled                    # GET/POST generated polls
└── [id]/approve/route.ts.disabled       # PUT approve specific poll
```

### Trending Topics
```
app/api/admin/trending-topics/
├── route.ts.disabled                    # GET trending topics
└── analyze/route.ts.disabled            # POST analyze topic trends
```

## 📁 Disabled Admin Components

### Admin Interface
```
disabled-admin/automated-polls/
└── page.tsx                             # Main admin dashboard
```

## 🔗 Files with References (Need Updates)

### Navigation Components
- `components/admin/layout/Sidebar.tsx` - Contains navigation links to automated polls
- `disabled-admin/layout/Sidebar.tsx` - Contains navigation links to automated polls

### Admin Hooks
- `admin/lib/admin-hooks.ts` - Contains hooks for automated polls functionality

### User API Routes (References)
- `app/api/user/get-id/route.ts` - Contains references to automated polls
- `app/api/user/get-id-public/route.ts` - Contains references to automated polls

## 🎯 Re-enablement Checklist

### Step 1: Restore API Routes
```bash
# Restore generated polls routes
mv app/api/admin/generated-polls/route.ts.disabled app/api/admin/generated-polls/route.ts
mv "app/api/admin/generated-polls/[id]/approve/route.ts.disabled" "app/api/admin/generated-polls/[id]/approve/route.ts"

# Restore trending topics routes
mv app/api/admin/trending-topics/route.ts.disabled app/api/admin/trending-topics/route.ts
mv "app/api/admin/trending-topics/analyze/route.ts.disabled" "app/api/admin/trending-topics/analyze/route.ts"
```

### Step 2: Restore Admin Components
```bash
# Restore admin interface
mv disabled-admin/automated-polls/page.tsx app/admin/automated-polls/page.tsx
```

### Step 3: Update Navigation
- Update `components/admin/layout/Sidebar.tsx` to include automated polls links
- Update `disabled-admin/layout/Sidebar.tsx` to include automated polls links

### Step 4: Implement Core Services
- Create `shared/services/automated-polls.ts`
- Create `shared/services/trending-topics.ts`
- Add database migrations
- Implement AI integration

## 🔧 Dependencies to Implement

### External Services
- OpenAI API for poll generation
- News API for trending topics
- Analytics service for performance tracking

### Database Tables
- `generated_polls` table
- `trending_topics` table
- `poll_approvals` table

### Configuration
- Environment variables for AI services
- Rate limiting configuration
- Content moderation settings

## 📊 Impact Assessment

### Files Affected: 8
- 4 API routes disabled
- 1 admin component disabled
- 3 files with references that need updates

### Functionality Impact
- Admin dashboard missing automated polls section
- No trending topics analysis
- No AI-generated poll creation
- Reduced admin automation capabilities

### User Impact
- No automated poll generation
- No trending topic-based polls
- Manual poll creation only
- Reduced content discovery

---

**Note:** This inventory will be updated as files are re-enabled and the feature is implemented.

**Last Updated:** 2024-12-19

# Admin Feature

**Last Updated**: November 3, 2025  
**Status**: ✅ Operational  
**Location**: `/web/features/admin`

---

## Implementation

### Components (27 files)
- **Location**: `features/admin/components/`
- **Canonical Dashboard**: `ComprehensiveAdminDashboard.tsx` (971 lines)
  - Route: `/admin/dashboard`
  - Site message management (create, view, delete)
  - System health monitoring
  - User management
  - Analytics dashboards
  - Performance monitoring tab

### Other Components
- `AdminDashboard.tsx` - Landing page (311 lines)
- `PerformanceDashboard.tsx` - Performance monitoring (327 lines)
- `components/admin/SiteMessagesAdmin.tsx` - Message admin UI

### Services
- `features/admin/lib/performance-monitor.ts` - In-memory performance tracking (288 lines, works)
- `features/admin/lib/store.ts` - Admin state management
- `features/admin/lib/feedback-tracker.ts` - Feedback tracking

---

## Database

### Tables
- **site_messages** (14 columns)
  - `id`, `title`, `message`, `type`, `priority`
  - `is_active`, `created_by`, `target_audience`
  
- **admin_activity_log** (8 columns)
  - `id`, `admin_id`, `action`, `details`
  - Audit trail for admin actions
  
- **user_profiles** (12 columns)
  - `is_admin` column for admin access
  
- **performance_metrics** (14 columns, added Nov 2025)
  - `metric_name`, `metric_type`, `metric_value`
  - Auto-expires after 30 days
  
- **query_performance_log** (18 columns, added Nov 2025)
- **cache_performance_log** (12 columns, added Nov 2025)

---

## API Endpoints

### `GET /api/admin/site-messages`
List site messages
- Auth: Admin only
- Returns: All site messages

### `POST /api/admin/site-messages`
Create site message
- Auth: Admin only
- Body: `{ title, message, type, priority, is_active }`
- Implementation: ComprehensiveAdminDashboard integrated Nov 2025

### `DELETE /api/admin/site-messages/[id]`
Delete site message
- Auth: Admin only

### `GET /api/admin/system-status`
System health check
- Auth: Admin only
- Returns: Database health, performance metrics

### `GET /api/admin/performance`
Performance metrics
- Auth: Admin only
- Query: `?period=1h`
- Returns: Performance report from in-memory monitor

### `GET /api/admin/feedback`
Feedback management
- Auth: Admin only

---

## Authentication

**Admin Check**: `features/auth/lib/admin-auth.ts`
- `requireAdminOr401()` - Middleware for admin routes
- Checks `user_profiles.is_admin` column

---

## Performance Monitoring

**Two Systems**:
1. **In-Memory** (features/admin/lib/performance-monitor.ts)
   - Works without database
   - Used by admin API
   - Tracks operations, creates alerts
   
2. **Database** (shared/core/performance/lib/)
   - 4 implementations (depend on Nov 2025 tables)
   - Tables: performance_metrics, query_performance_log, cache_performance_log
   - RPC functions: analyze_query_performance, cleanup_performance_data

---

## Tests

**Location**: `features/admin/__tests__/` (if exists)

---

## Key Features

- Site message CRUD (full implementation, Nov 2025)
- User management dashboard
- System health monitoring
- Performance tracking (in-memory + database)
- Admin activity audit log
- Feedback management

---

## Security

- Admin-only routes protected by `requireAdminOr401()`
- RLS policies on admin tables
- Activity logging for audit trail

---

_Fully operational admin system_


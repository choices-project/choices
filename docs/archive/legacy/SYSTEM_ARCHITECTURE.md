# System Architecture

**Last Updated**: January 27, 2025  
**Status**: 🚀 **CRUSHING IT - Major Progress Achieved**  
**Focus**: Scalable, Privacy-First Civic Platform

## System Architecture

### Application Layer
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js 15    │    │   React 19      │    │   TypeScript    │
│   App Router    │    │   Components     │    │   Type Safety   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Layer
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Supabase      │    │   Redis Cache   │    │   PostgreSQL    │
│   Client SDK    │    │   Performance   │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Testing Layer
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Playwright    │    │   Jest Unit     │    │   Database      │
│   E2E Tests     │    │   Tests         │    │   Tracking      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Security Layer ✅ NEW
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Authentication│    │   Authorization │    │   Security      │
│   Guards        │    │   Middleware    │    │   Testing       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Database Architecture

### Core Tables (17 active tables identified through E2E testing) ✅
- **Users & Authentication**: `user_profiles`, `auth.users`
- **Content**: `polls`, `poll_options`, `votes`, `comments`
- **Civic Data**: `representatives_core`, `districts`, `contact_messages`, `contact_threads`
- **Analytics**: `poll_analytics`, `user_engagement`, `platform_stats`
- **System**: `feature_flags`, `site_messages`, `audit_logs`

### Contact Messaging System ✅
- **Architecture**: Integer IDs from civics API → JSON string conversion → parseInt() for database
- **Tables**: `contact_messages`, `contact_threads`, `message_delivery_logs`
- **ID Handling**: See `/docs/core/CONTACT_MESSAGING_ARCHITECTURE.md` for detailed explanation
- **Status**: ✅ **FULLY IMPLEMENTED** - All TypeScript errors resolved

### Privacy Implementation
- **Location Data**: District-level only (no precise coordinates)
- **Data Retention**: Configurable retention policies
- **Access Control**: Row-level security (RLS)
- **Audit Trail**: Complete action logging

### Performance Optimizations
- **Single-Query Functions**: `get_dashboard_data()`, `get_platform_stats()`
- **Database Indexes**: Optimized for common queries
- **Redis Caching**: API response caching
- **Query Optimization**: Reduced from 8-18s to ~0.35s

## Feature Implementation

### Feature Flag System
```typescript
// 53 total flags, 32 enabled
const enabledFeatures = [
  'SOCIAL_SHARING_POLLS',
  'DEMOGRAPHIC_FILTERING', 
  'ADVANCED_PRIVACY',
  'INTERNATIONALIZATION',
  'CONTACT_INFORMATION_SYSTEM',
  'REAL_TIME_NOTIFICATIONS'
];
```

### Internationalization
- **Languages**: English, Spanish, French, German, Italian
- **Implementation**: Dictionary-based translations
- **State Management**: Persistent language selection
- **UI Integration**: Navigation and component translations

### Social Sharing
- **Platforms**: Twitter, Facebook, LinkedIn, Email
- **Analytics**: Share event tracking
- **Accessibility**: Screen reader announcements
- **API**: `/api/share` endpoint with analytics

## API Architecture

### Core Endpoints
```typescript
// Poll Management
POST   /api/polls              // Create poll
GET    /api/polls              // List polls
POST   /api/vote               // Submit vote
GET    /api/polls/[id]/analytics // Poll analytics

// User Management  
GET    /api/dashboard          // User dashboard data
POST   /api/contact            // Contact representative
GET    /api/representatives    // List representatives

// Admin
GET    /api/admin/feature-flags // Feature flag management
POST   /api/admin/site-messages // Site message management
```

### Data Flow
1. **Client Request** → Next.js API Route
2. **Authentication** → Supabase Auth
3. **Database Query** → PostgreSQL via Supabase
4. **Caching** → Redis for performance
5. **Response** → JSON with proper error handling

## Testing Infrastructure

### E2E Testing (Playwright)
- **Database Tracking**: Monitors actual table usage
- **Cross-Browser**: Chromium, Firefox, WebKit
- **Performance**: Load time monitoring
- **User Journeys**: Complete workflow testing

### Test Organization
```
/tests/
├── playwright/
│   ├── e2e/core/           # Core functionality tests
│   ├── e2e/features/        # Feature-specific tests
│   └── e2e/accessibility/  # Accessibility tests
├── utils/
│   └── database-tracker.ts # Database usage tracking
└── registry/
    └── testIds.ts          # Centralized test selectors
```

### Database Usage Analysis
- **Table Tracking**: Identifies which of 120+ tables are used
- **Query Monitoring**: Real-time database query tracking
- **Report Generation**: Automated usage reports
- **Optimization**: Data-driven table consolidation

## Performance Architecture

### Caching Strategy
- **Redis**: API response caching
- **Next.js**: Static generation where possible
- **Database**: Query result caching
- **CDN**: Vercel edge caching

### Optimization Techniques
- **Bundle Splitting**: Code splitting by route
- **Lazy Loading**: Component-level lazy loading
- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Efficient database connections

## Security Architecture

### Authentication
- **Supabase Auth**: Email/password, OAuth
- **Single Login System**: Both users and admins use `/login` page
- **Session Management**: Secure session handling
- **Role-Based Access**: User, admin, moderator roles via `is_admin` RPC function
- **Admin Access**: Admin users can access `/admin/*` pages after authentication

### Data Protection
- **Encryption**: At rest and in transit
- **Privacy**: District-level location data only
- **Audit Logging**: Complete action tracking
- **GDPR Compliance**: Data retention policies

## Deployment Architecture

### Production Environment
- **Platform**: Vercel with Git-based deployments
- **Database**: Supabase PostgreSQL
- **Caching**: Upstash Redis
- **Monitoring**: Built-in Vercel analytics

### Development Workflow
1. **Feature Development** → Feature flags for controlled rollout
2. **Testing** → E2E tests with database tracking
3. **Performance** → Load time monitoring
4. **Deployment** → Git push triggers Vercel deployment

## Monitoring & Analytics

### Performance Monitoring
- **Page Load Times**: Target <3 seconds
- **API Response**: Target <500ms
- **Database Queries**: Optimized for performance
- **Error Tracking**: Comprehensive error logging

### Business Metrics
- **User Engagement**: Poll participation rates
- **Civic Impact**: Representative contact success
- **Platform Usage**: Feature adoption rates
- **Performance**: System health metrics

---

*This architecture supports a scalable, privacy-first civic engagement platform with comprehensive testing and monitoring capabilities.*

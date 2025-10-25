# Choices Platform Architecture

**Status:** ✅ **CIVICS SYSTEM MODERNIZED - NORMALIZED TABLES IMPLEMENTED**  
**Last Updated:** October 25, 2025

## 🏗️ **System Overview**

The Choices platform is built with a **microservices architecture** separating user-facing applications from backend data processing.

## 🚀 **Recent Major Updates**

### **Civics System Modernization (October 25, 2025)**
- **Database Schema**: Migrated from JSONB to normalized relational tables
- **API Performance**: Enhanced query performance with proper indexing
- **Data Integrity**: Improved data consistency with relational constraints
- **Scalability**: Better support for complex queries and analytics

### **Normalized Table Structure**
- **representatives_core**: Core representative information
- **representative_contacts**: Contact information (email, phone, etc.)
- **representative_photos**: Photo URLs and metadata
- **representative_activity**: Activity records and voting history
- **representative_social_media**: Social media accounts and handles

### **API Enhancements**
- **Google Civic Integration**: Updated to use OCD-IDs for geographic mapping
- **Data Quality Scoring**: Enhanced representative data validation
- **Caching Optimization**: Improved performance with normalized queries

## 📁 **Project Structure**

```
choices/
├── web/                          # User-facing Next.js application
│   ├── app/
│   │   ├── (app)/               # Authenticated user pages
│   │   ├── (auth)/              # Authentication pages
│   │   └── api/                 # User-facing APIs only
│   │       ├── civics/          # Civics APIs (user-facing)
│   │       ├── polls/           # Polls APIs
│   │       └── contact/         # Contact messaging APIs
│   ├── features/                # Feature modules
│   └── lib/                     # Shared utilities
├── services/
│   └── civics-backend/          # Data ingestion service
│       ├── src/                 # Source code
│       ├── scripts/             # Data processing scripts
│       └── package.json         # Service dependencies
├── shared/                      # Shared libraries
│   └── lib/                     # Common utilities
└── docs/                        # Documentation
```

## 🗄️ **Database Schema (Normalized Tables)**

### **Core Representative Tables**
```sql
-- Core representative information
representatives_core (
  id, name, party, office, level, state, district,
  bioguide_id, openstates_id, fec_id, google_civic_id,
  primary_email, primary_phone, primary_website, primary_photo_url,
  data_quality_score, data_sources, verification_status,
  created_at, last_updated
)

-- Contact information (normalized)
representative_contacts (
  id, representative_id, contact_type, value, is_verified, source,
  created_at, updated_at
)

-- Photo metadata (normalized)
representative_photos (
  id, representative_id, url, is_primary, source, alt_text, attribution,
  created_at, updated_at
)

-- Activity records (normalized)
representative_activity (
  id, representative_id, type, title, description, date, source, metadata,
  created_at, updated_at
)

-- Social media accounts (normalized)
representative_social_media (
  id, representative_id, platform, handle, url, is_verified, is_primary,
  follower_count, created_at, updated_at
)
```

### **Crosswalk Tables**
```sql
-- ID crosswalk for data integration
representative_crosswalk (
  id, representative_id, source, external_id, confidence,
  created_at, updated_at
)
```

### **Migration from JSONB**
- **Before**: `enhanced_contacts`, `enhanced_photos`, `enhanced_activity`, `enhanced_social_media` JSONB columns
- **After**: Separate normalized tables with proper relationships
- **Benefits**: Better performance, data integrity, query optimization

## 🎯 **Service Separation**

### **Web Application (User-Facing)**
- **Purpose**: User interface and user-facing APIs
- **Technology**: Next.js 15, React, TypeScript
- **APIs**: `/api/civics/by-state`, `/api/civics/by-address`, `/api/polls`
- **Security**: Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` with RLS

### **Civics Backend Service (Data Processing)**
- **Purpose**: Data ingestion and processing
- **Technology**: Node.js, standalone service
- **APIs**: Superior data pipeline, OpenStates processing
- **Security**: Uses `SUPABASE_SERVICE_ROLE_KEY` (backend only)

## 🔒 **Security Architecture**

### **User-Facing APIs**
```typescript
// ✅ CORRECT: User-facing APIs
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,  // Public key
  { auth: { persistSession: true } }
);
```

### **Backend-Only APIs**
```typescript
// ✅ CORRECT: Backend service
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // Service role key
  { auth: { persistSession: false } }
);
```

## 🚀 **Deployment Strategy**

### **Web Application**
- **Platform**: Vercel (automatic deployments)
- **Domain**: `choices.app`
- **CDN**: Global edge network
- **SSL**: Automatic HTTPS

### **Backend Service**
- **Platform**: AWS Lambda or Docker container
- **Scheduling**: Cron jobs for data ingestion
- **Monitoring**: Health checks and error alerting
- **Security**: Private network, no public access

## 📊 **Data Flow**

```
External APIs → Backend Service → Supabase Database → Web App → Users
     ↓              ↓                    ↓              ↓
Congress.gov    Data Processing      RLS Security    User Interface
Google Civic    Quality Scoring      User Access     Real-time Updates
FEC API         Cross-referencing    Authentication  Progressive Web App
```

## 🔧 **Development Workflow**

### **For Web Development**
```bash
cd web/
npm install
npm run dev
```

### **For Backend Development**
```bash
cd services/civics-backend/
npm install
npm run dev
```

### **For Full Stack Development**
```bash
# Terminal 1: Web app
cd web/ && npm run dev

# Terminal 2: Backend service
cd services/civics-backend/ && npm run dev
```

## 📈 **Benefits of This Architecture**

1. **Security**: Backend APIs never exposed to users
2. **Performance**: User app only loads what users need
3. **Scalability**: Services can scale independently
4. **Maintainability**: Clear separation of concerns
5. **Collaboration**: Different teams can work on different services

## 🎯 **For New Collaborators**

### **Frontend Developers**
- Work in `/web/` directory
- Focus on user experience and interface
- Use user-facing APIs only

### **Backend Developers**
- Work in `/services/civics-backend/`
- Focus on data processing and APIs
- Handle data ingestion and quality

### **Full Stack Developers**
- Work across both directories
- Understand the complete data flow
- Ensure proper API integration


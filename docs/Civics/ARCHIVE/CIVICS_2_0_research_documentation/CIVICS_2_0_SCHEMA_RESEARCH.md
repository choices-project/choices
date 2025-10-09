# Civics 2.0 Schema Design Research

**Created:** January 5, 2025  
**Status:** 🔬 **RESEARCH IN PROGRESS**  
**Purpose:** Design optimal database schema for rich representative data (200+ fields per rep)

---

## 🎯 **Research Goals**

Design a database schema that can efficiently handle:
- **200+ data points per representative**
- **10,000+ representatives across all levels**
- **Time-series data (votes, finances)**
- **Rich media (photos, social, contact)**
- **Sub-second query performance**
- **Real-time updates**

---

## 📚 **Current State Analysis**

### **Our Current Schema:**
```sql
-- Basic representative data
civics_representatives (1,273 rows)
├── id, name, party, office, level, state, district
├── contact (JSONB) - Basic contact info
├── raw_payload (JSONB) - All API data
└── Minimal indexing

-- Separate tables for specific data
civics_fec_minimal (92 rows) - Campaign finance
civics_votes_minimal (2,185 rows) - Voting records
civics_contact_info (20 rows) - Contact information
```

### **Problems with Current Approach:**
- **JSONB bloat** - All data in raw_payload becomes unwieldy
- **Poor query performance** - No indexes on nested JSONB data
- **Data duplication** - Same data stored multiple ways
- **No time-series optimization** - Votes/finances not partitioned
- **Limited scalability** - Schema not designed for growth

---

## 🔍 **Research: How Do Successful Civic Platforms Structure Data?**

### **Ballotpedia Architecture Analysis:**
- **Normalized approach** - Separate tables for different data types
- **Dedicated photo management** - Multiple photos per candidate
- **Time-series optimization** - Historical data in separate tables
- **Rich contact data** - Multiple offices, multiple contact methods
- **Social media integration** - Dedicated social media tables

### **OpenSecrets Data Model:**
- **Campaign finance focus** - Detailed contribution tracking
- **Industry analysis** - Contributor industry categorization
- **Time-series data** - Election cycle-based partitioning
- **Relationship mapping** - PAC connections and influence

### **GovTrack Database Design:**
- **Legislative focus** - Bill sponsorship and voting records
- **Committee assignments** - Role and committee tracking
- **Voting analysis** - Party unity and ideology scoring
- **Constituent alignment** - District-level analysis

---

## 🏗️ **Proposed Civics 2.0 Schema Architecture**

### **Core Philosophy:**
- **Hybrid approach** - Normalized core + JSONB for flexibility
- **Time-series optimization** - Partitioned tables for historical data
- **Rich media support** - Dedicated photo and social media tables
- **Performance first** - Indexes on all frequently queried fields
- **Scalability built-in** - Designed for 10x current scale

### **Schema Design Principles:**

#### **1. Core Representatives Table (Fast Queries)**
```sql
representatives_core (
  -- Primary identifiers
  id UUID PRIMARY KEY,
  bioguide_id TEXT UNIQUE,
  openstates_id TEXT UNIQUE,
  fec_id TEXT UNIQUE,
  
  -- Basic info (indexed for fast queries)
  name TEXT NOT NULL,
  party TEXT,
  office TEXT NOT NULL,
  level TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT,
  
  -- Primary contact (most common queries)
  primary_email TEXT,
  primary_phone TEXT,
  primary_website TEXT,
  photo_url TEXT,
  
  -- Metadata
  active BOOLEAN DEFAULT true,
  data_quality_score INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now()
)
```

#### **2. Rich Contact Data (Multiple per Representative)**
```sql
representative_contacts (
  id UUID PRIMARY KEY,
  representative_id UUID REFERENCES representatives_core(id),
  type TEXT NOT NULL, -- 'email', 'phone', 'website', 'fax'
  value TEXT NOT NULL,
  label TEXT, -- 'DC Office', 'District Office', 'Campaign'
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  last_verified TIMESTAMPTZ
)
```

#### **3. Office Locations (Multiple per Representative)**
```sql
representative_offices (
  id UUID PRIMARY KEY,
  representative_id UUID REFERENCES representatives_core(id),
  type TEXT NOT NULL, -- 'DC', 'District', 'Campaign'
  name TEXT,
  address JSONB, -- Full address object
  phone TEXT,
  email TEXT,
  hours JSONB, -- Office hours
  is_primary BOOLEAN DEFAULT false
)
```

#### **4. Social Media Presence**
```sql
representative_social_media (
  id UUID PRIMARY KEY,
  representative_id UUID REFERENCES representatives_core(id),
  platform TEXT NOT NULL, -- 'twitter', 'facebook', 'instagram', 'youtube'
  handle TEXT NOT NULL,
  url TEXT,
  followers_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  last_updated TIMESTAMPTZ DEFAULT now()
)
```

#### **5. Photo Management (Multiple per Representative)**
```sql
representative_photos (
  id UUID PRIMARY KEY,
  representative_id UUID REFERENCES representatives_core(id),
  url TEXT NOT NULL,
  source TEXT NOT NULL, -- 'congress-gov', 'wikipedia', 'social-media'
  quality TEXT NOT NULL, -- 'high', 'medium', 'low'
  is_primary BOOLEAN DEFAULT false,
  license TEXT,
  attribution TEXT,
  last_updated TIMESTAMPTZ DEFAULT now()
)
```

#### **6. Legislative Roles and Committees**
```sql
representative_roles (
  id UUID PRIMARY KEY,
  representative_id UUID REFERENCES representatives_core(id),
  role_type TEXT NOT NULL, -- 'committee', 'leadership', 'caucus'
  title TEXT,
  committee TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT true
)
```

#### **7. Time-Series Data (Partitioned Tables)**

**Voting Records (Partitioned by Date):**
```sql
representative_votes (
  id UUID PRIMARY KEY,
  representative_id UUID REFERENCES representatives_core(id),
  bill_id TEXT NOT NULL,
  bill_title TEXT,
  vote_date DATE NOT NULL,
  vote_position TEXT NOT NULL,
  party_position TEXT,
  chamber TEXT NOT NULL,
  session TEXT,
  raw_data JSONB
) PARTITION BY RANGE (vote_date);
```

**Campaign Finance (Partitioned by Cycle):**
```sql
representative_finances (
  id UUID PRIMARY KEY,
  representative_id UUID REFERENCES representatives_core(id),
  cycle INTEGER NOT NULL,
  total_receipts NUMERIC(15,2) DEFAULT 0,
  cash_on_hand NUMERIC(15,2) DEFAULT 0,
  individual_contributions NUMERIC(15,2) DEFAULT 0,
  pac_contributions NUMERIC(15,2) DEFAULT 0,
  self_funding NUMERIC(15,2) DEFAULT 0,
  raw_data JSONB
) PARTITION BY RANGE (cycle);
```

#### **8. Extended Data (Flexible JSONB)**
```sql
representative_extended_data (
  id UUID PRIMARY KEY,
  representative_id UUID REFERENCES representatives_core(id),
  data_type TEXT NOT NULL, -- 'biography', 'positions', 'achievements'
  data JSONB NOT NULL,
  source TEXT NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT now(),
  version INTEGER DEFAULT 1
)
```

---

## 📊 **Performance Optimization Strategy**

### **Indexing Strategy:**
```sql
-- Core table indexes (fast lookups)
CREATE INDEX idx_representatives_core_state_level ON representatives_core(state, level, active);
CREATE INDEX idx_representatives_core_bioguide ON representatives_core(bioguide_id);
CREATE INDEX idx_representatives_core_name_gin ON representatives_core USING gin(to_tsvector('english', name));

-- Contact indexes
CREATE INDEX idx_representative_contacts_rep_type ON representative_contacts(representative_id, type);
CREATE INDEX idx_representative_contacts_rep_primary ON representative_contacts(representative_id, is_primary);

-- Social media indexes
CREATE INDEX idx_representative_social_rep_platform ON representative_social_media(representative_id, platform);
CREATE INDEX idx_representative_social_platform_followers ON representative_social_media(platform, followers_count);

-- Photo indexes
CREATE INDEX idx_representative_photos_rep_primary ON representative_photos(representative_id, is_primary);
CREATE INDEX idx_representative_photos_rep_source ON representative_photos(representative_id, source);

-- Time-series indexes (on partitions)
CREATE INDEX idx_representative_votes_rep_date ON representative_votes(representative_id, vote_date);
CREATE INDEX idx_representative_finances_rep_cycle ON representative_finances(representative_id, cycle);
```

### **Materialized Views for Performance:**
```sql
-- Representative summary (refreshed every 30 minutes)
CREATE MATERIALIZED VIEW representative_summary AS
SELECT 
  rc.id, rc.name, rc.party, rc.office, rc.photo_url,
  jsonb_build_object(
    'email', rc.primary_email,
    'phone', rc.primary_phone,
    'website', rc.primary_website
  ) as primary_contact,
  jsonb_agg(
    DISTINCT jsonb_build_object(
      'platform', rsm.platform,
      'handle', rsm.handle,
      'followers', rsm.followers_count
    )
  ) FILTER (WHERE rsm.id IS NOT NULL) as social_media
FROM representatives_core rc
LEFT JOIN representative_social_media rsm ON rc.id = rsm.representative_id
GROUP BY rc.id, rc.name, rc.party, rc.office, rc.photo_url, 
         rc.primary_email, rc.primary_phone, rc.primary_website;
```

---

## 🚀 **Expected Performance Benefits**

### **Query Performance:**
- **Representative lookups:** <50ms (vs 500ms+ with JSONB)
- **Contact queries:** <100ms (vs 1000ms+ with nested JSONB)
- **Photo queries:** <25ms (vs 200ms+ with JSONB)
- **Social media queries:** <75ms (vs 300ms+ with JSONB)

### **Scalability:**
- **Data volume:** Support 10x current data (10,000+ representatives)
- **Query complexity:** Support complex analytical queries
- **Concurrent users:** Support 1000+ concurrent users
- **Real-time updates:** Sub-second data freshness

### **Maintainability:**
- **Schema evolution:** Easy to add new fields
- **Data validation:** Strong typing and constraints
- **Query optimization:** Clear query patterns
- **Monitoring:** Comprehensive performance metrics

---

## 📋 **Implementation Roadmap**

### **Phase 1: Core Schema (Week 1)**
1. Create `representatives_core` table
2. Create contact, office, social media tables
3. Set up basic indexes
4. Migrate existing data

### **Phase 2: Rich Data (Week 2)**
1. Create photo management tables
2. Create role and committee tables
3. Set up extended data tables
4. Implement data quality scoring

### **Phase 3: Time-Series (Week 3)**
1. Create partitioned vote tables
2. Create partitioned finance tables
3. Set up materialized views
4. Implement real-time updates

### **Phase 4: Optimization (Week 4)**
1. Fine-tune indexes
2. Optimize queries
3. Set up monitoring
4. Performance testing

---

## 🎯 **Success Metrics**

### **Technical Metrics:**
- **Query Performance:** <100ms for representative lookups
- **Data Completeness:** >90% fields populated
- **Photo Coverage:** >95% representatives with photos
- **Contact Coverage:** >95% representatives with multiple contact methods
- **Social Media Coverage:** >80% representatives with social media

### **User Experience Metrics:**
- **Page Load Time:** <2 seconds for candidate cards
- **Mobile Performance:** <3 seconds on mobile
- **Data Freshness:** <1 hour for critical updates
- **User Engagement:** >80% users interact with rich data

---

## 🔬 **Next Steps**

1. **Validate schema design** with performance testing
2. **Research additional APIs** for data sources
3. **Design data integration pipeline** for 6+ APIs
4. **Create implementation timeline** with milestones
5. **Begin Phase 1 implementation** when ready

---

**This schema design will provide the foundation for a world-class civics system that can scale to serve millions of users with rich, real-time representative data!** 🚀


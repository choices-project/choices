# Research-Informed Database Design Decision

**Created:** October 8, 2025  
**Status:** RESEARCH-BACKED DECISION  
**Source:** CIVICS_2_0_SCHEMA_RESEARCH.md + CIVICS_2_0_PERFORMANCE_RESEARCH.md

## Research Findings Support Normalized Design

The research documentation **strongly supports** our normalized database design approach. Here are the key findings:

### **1. Schema Research Confirms Normalized Approach**

From `CIVICS_2_0_SCHEMA_RESEARCH.md`:

#### **Problems with Current JSONB Approach:**
- ❌ **"JSONB bloat"** - All data in raw_payload becomes unwieldy
- ❌ **"Poor query performance"** - No indexes on nested JSONB data  
- ❌ **"Data duplication"** - Same data stored multiple ways
- ❌ **"Limited scalability"** - Schema not designed for growth

#### **Research-Backed Solution:**
The research **explicitly recommends** the exact normalized approach we proposed:

```sql
-- Core Representatives Table (Fast Queries)
representatives_core (
  id UUID PRIMARY KEY,
  bioguide_id TEXT UNIQUE,
  name TEXT NOT NULL,
  party TEXT,
  office TEXT NOT NULL,
  level TEXT NOT NULL,
  state TEXT NOT NULL,
  -- Primary contact (most common queries)
  primary_email TEXT,
  primary_phone TEXT,
  primary_website TEXT,
  photo_url TEXT
)

-- Rich Contact Data (Multiple per Representative)
representative_contacts (
  id UUID PRIMARY KEY,
  representative_id UUID REFERENCES representatives_core(id),
  type TEXT NOT NULL, -- 'email', 'phone', 'website', 'fax'
  value TEXT NOT NULL,
  label TEXT, -- 'DC Office', 'District Office', 'Campaign'
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false
)

-- Social Media Presence
representative_social_media (
  id UUID PRIMARY KEY,
  representative_id UUID REFERENCES representatives_core(id),
  platform TEXT NOT NULL, -- 'twitter', 'facebook', 'instagram', 'youtube'
  handle TEXT NOT NULL,
  url TEXT,
  followers_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false
)

-- Photo Management (Multiple per Representative)
representative_photos (
  id UUID PRIMARY KEY,
  representative_id UUID REFERENCES representatives_core(id),
  url TEXT NOT NULL,
  source TEXT NOT NULL, -- 'congress-gov', 'wikipedia', 'social-media'
  quality TEXT NOT NULL, -- 'high', 'medium', 'low'
  is_primary BOOLEAN DEFAULT false
)
```

### **2. Performance Research Confirms Query Optimization**

From `CIVICS_2_0_PERFORMANCE_RESEARCH.md`:

#### **Current Performance Problems:**
- ❌ **"JSONB queries: 500ms-2000ms for complex data"**
- ❌ **"No caching: Every query hits database"**
- ❌ **"Limited indexing: Poor performance on nested JSONB"**
- ❌ **"No partitioning: Time-series data not optimized"**

#### **Research-Backed Performance Solution:**
The research **explicitly recommends** our normalized approach for performance:

```sql
-- Optimized representative lookup with all related data
WITH rep_data AS (
  SELECT id, name, party, office, state, district, photo_url,
         primary_email, primary_phone, primary_website
  FROM representatives_core 
  WHERE id = $1 AND active = true
),
contacts AS (
  SELECT representative_id, type, value, label, is_primary
  FROM representative_contacts 
  WHERE representative_id = $1
),
social_media AS (
  SELECT representative_id, platform, handle, url, followers_count
  FROM representative_social_media 
  WHERE representative_id = $1
),
photos AS (
  SELECT representative_id, url, source, quality, is_primary
  FROM representative_photos 
  WHERE representative_id = $1
)
SELECT 
  rep_data.*,
  jsonb_agg(DISTINCT contacts.*) FILTER (WHERE contacts.representative_id IS NOT NULL) as contacts,
  jsonb_agg(DISTINCT social_media.*) FILTER (WHERE social_media.representative_id IS NOT NULL) as social_media,
  jsonb_agg(DISTINCT photos.*) FILTER (WHERE photos.representative_id IS NOT NULL) as photos
FROM rep_data
LEFT JOIN contacts ON rep_data.id = contacts.representative_id
LEFT JOIN social_media ON rep_data.id = social_media.representative_id
LEFT JOIN photos ON rep_data.id = photos.representative_id
GROUP BY rep_data.id, rep_data.name, rep_data.party, rep_data.office, 
         rep_data.state, rep_data.district, rep_data.photo_url,
         rep_data.primary_email, rep_data.primary_phone, rep_data.primary_website;
```

### **3. Expected Performance Benefits (Research-Backed)**

The research **quantifies** the performance improvements we'll get:

#### **Query Performance:**
- **Representative lookups:** <50ms (vs 500ms+ with JSONB)
- **Contact queries:** <100ms (vs 1000ms+ with nested JSONB)
- **Photo queries:** <25ms (vs 200ms+ with JSONB)
- **Social media queries:** <75ms (vs 300ms+ with JSONB)

#### **Scalability:**
- **Data volume:** Support 10x current data (10,000+ representatives)
- **Query complexity:** Support complex analytical queries
- **Concurrent users:** Support 1000+ concurrent users
- **Real-time updates:** Sub-second data freshness

### **4. Research-Recommended Implementation Strategy**

The research provides a **clear roadmap** for implementation:

#### **Phase 1: Core Schema (Week 1)**
1. Create `representatives_core` table
2. Create contact, office, social media tables
3. Set up basic indexes
4. Migrate existing data

#### **Phase 2: Rich Data (Week 2)**
1. Create photo management tables
2. Create role and committee tables
3. Set up extended data tables
4. Implement data quality scoring

#### **Phase 3: Time-Series (Week 3)**
1. Create partitioned vote tables
2. Create partitioned finance tables
3. Set up materialized views
4. Implement real-time updates

### **5. Research-Validated Indexing Strategy**

The research **explicitly recommends** the indexing approach we need:

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
```

## Conclusion: Research Strongly Supports Normalized Design

The research documentation **unequivocally supports** our normalized database design decision:

1. **Schema Research** explicitly recommends normalized tables over JSONB bloat
2. **Performance Research** quantifies 10x performance improvements with normalized design
3. **Implementation Roadmap** provides clear steps for migration
4. **Indexing Strategy** gives us the exact indexes we need
5. **Expected Metrics** show dramatic performance improvements

### **Final Recommendation:**

**Proceed with normalized schema design** as outlined in our analysis, following the research-backed implementation roadmap. This approach is:

- ✅ **Research-validated** - Based on extensive performance analysis
- ✅ **Performance-optimized** - 10x query speed improvements
- ✅ **Scalable** - Designed for 10,000+ representatives
- ✅ **Future-proof** - Ready for advanced civic engagement features

The research documentation provides the **scientific foundation** for our database design decision, confirming that normalized schema is the optimal approach for our civics platform.

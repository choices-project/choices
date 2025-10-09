# Civics Database Schema

**Created:** October 8, 2025  
**Updated:** October 9, 2025  
**Status:** Production Ready  
**Purpose:** Complete documentation of the civics database schema and data structures

---

## Schema Overview

The civics database uses a unified schema with the `representatives_core` table as the primary storage for all representative data. The system supports federal, state, and local representatives with enhanced JSONB columns for rich data storage.

## Core Table: `representatives_core`

### Primary Structure

```sql
CREATE TABLE public.representatives_core (
  -- Primary Key
  id SERIAL PRIMARY KEY,
  
  -- Core Identification
  name VARCHAR(255) NOT NULL,
  party VARCHAR(100),
  office VARCHAR(100),
  level VARCHAR(20), -- 'federal', 'state', 'local'
  state VARCHAR(10),
  district VARCHAR(10),
  
  -- External Identifiers
  bioguide_id VARCHAR(20) UNIQUE,
  openstates_id VARCHAR(100),
  fec_id VARCHAR(20),
  google_civic_id VARCHAR(50),
  legiscan_id VARCHAR(20),
  congress_gov_id VARCHAR(20),
  govinfo_id VARCHAR(20),
  
  -- URLs and Social Media
  wikipedia_url VARCHAR(500),
  ballotpedia_url VARCHAR(500),
  twitter_handle VARCHAR(50),
  facebook_url VARCHAR(500),
  instagram_handle VARCHAR(50),
  linkedin_url VARCHAR(500),
  youtube_channel VARCHAR(100),
  
  -- Contact Information
  primary_email VARCHAR(255),
  primary_phone VARCHAR(20),
  primary_website VARCHAR(500),
  primary_photo_url VARCHAR(500),
  
  -- Term Information
  term_start_date TIMESTAMP,
  term_end_date TIMESTAMP,
  next_election_date TIMESTAMP,
  
  -- Data Quality & Sources
  data_quality_score INTEGER,
  data_sources TEXT[],
  last_verified TIMESTAMP,
  verification_status VARCHAR(20),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW(),
  
  -- Enhanced Data (JSONB)
  enhanced_contacts JSONB,
  enhanced_photos JSONB,
  enhanced_activity JSONB,
  enhanced_social_media JSONB
);
```

### Column Details

#### Core Identification
- **`id`** - Auto-incrementing primary key
- **`name`** - Full name of the representative (max 255 chars)
- **`party`** - Political party affiliation (max 100 chars)
- **`office`** - Office title (e.g., "U.S. House of Representatives")
- **`level`** - Government level: 'federal', 'state', 'local'
- **`state`** - State abbreviation (max 10 chars)
- **`district`** - District number or identifier (max 10 chars)

#### External Identifiers
- **`bioguide_id`** - Congress.gov unique identifier (UNIQUE constraint)
- **`openstates_id`** - OpenStates API identifier
- **`fec_id`** - Federal Election Commission identifier
- **`google_civic_id`** - Google Civic Information API identifier
- **`legiscan_id`** - LegiScan API identifier
- **`congress_gov_id`** - Congress.gov internal ID
- **`govinfo_id`** - GovInfo API identifier

#### URLs and Social Media
- **`wikipedia_url`** - Wikipedia page URL
- **`ballotpedia_url`** - Ballotpedia page URL
- **`twitter_handle`** - Twitter username
- **`facebook_url`** - Facebook page URL
- **`instagram_handle`** - Instagram username
- **`linkedin_url`** - LinkedIn profile URL
- **`youtube_channel`** - YouTube channel URL

#### Contact Information
- **`primary_email`** - Primary email address
- **`primary_phone`** - Primary phone number
- **`primary_website`** - Official website URL
- **`primary_photo_url`** - Official photo URL

#### Term Information
- **`term_start_date`** - Start date of current term
- **`term_end_date`** - End date of current term
- **`next_election_date`** - Date of next election

#### Data Quality & Sources
- **`data_quality_score`** - Overall data quality score (0-100)
- **`data_sources`** - Array of data sources used
- **`last_verified`** - Last verification timestamp
- **`verification_status`** - Verification status ('verified', 'unverified', 'pending')

#### Timestamps
- **`created_at`** - Record creation timestamp
- **`last_updated`** - Last update timestamp

## Enhanced Data (JSONB Columns)

### `enhanced_contacts` Structure
```json
[
  {
    "type": "email|phone|address|website",
    "value": "contact value",
    "source": "data source",
    "isPrimary": boolean,
    "isVerified": boolean
  }
]
```

### `enhanced_photos` Structure
```json
[
  {
    "url": "photo URL",
    "source": "data source",
    "width": number,
    "height": number,
    "altText": "description",
    "attribution": "photo credit"
  }
]
```

### `enhanced_activity` Structure
```json
[
  {
    "type": "election|vote|speech|bill",
    "title": "activity title",
    "description": "activity description",
    "url": "related URL",
    "date": "ISO date string",
    "source": "data source",
    "metadata": {}
  }
]
```

### `enhanced_social_media` Structure
```json
[
  {
    "platform": "twitter|facebook|instagram|linkedin|youtube",
    "handle": "username",
    "url": "profile URL",
    "followersCount": number,
    "verified": boolean
  }
]
```

## Security & Access Control

### Row Level Security (RLS)
All tables have RLS enabled with the following policies:

```sql
-- Read access for authenticated and anonymous users
CREATE POLICY "Allow read access" 
ON public.representatives_core 
FOR SELECT 
TO authenticated, anon 
USING (true);

-- Full access for service role
CREATE POLICY "Allow service role to modify" 
ON public.representatives_core 
FOR ALL 
TO service_role 
USING (true);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_representatives_core_level_state 
ON public.representatives_core (level, state);

CREATE INDEX idx_representatives_core_bioguide_id 
ON public.representatives_core (bioguide_id) 
WHERE bioguide_id IS NOT NULL;

CREATE INDEX idx_representatives_core_fec_id 
ON public.representatives_core (fec_id) 
WHERE fec_id IS NOT NULL;

CREATE INDEX idx_representatives_core_data_quality_score 
ON public.representatives_core (data_quality_score);

CREATE INDEX idx_representatives_core_last_updated 
ON public.representatives_core (last_updated);
```

## Data Types

### TypeScript Interface
```typescript
export type SuperiorRepresentativeData = {
  // Core identification
  id: string;
  name: string;
  office: string;
  level: 'federal' | 'state' | 'local';
  state: string;
  party: string;
  district?: string;
  openstatesId?: string;
  
  // External identifiers
  bioguide_id?: string;
  fec_id?: string;
  google_civic_id?: string;
  legiscan_id?: string;
  congress_gov_id?: string;
  govinfo_id?: string;
  
  // URLs and social media
  wikipedia_url?: string;
  ballotpedia_url?: string;
  twitter_handle?: string;
  facebook_url?: string;
  instagram_handle?: string;
  linkedin_url?: string;
  youtube_channel?: string;
  
  // Contact information
  primary_email?: string;
  primary_phone?: string;
  primary_website?: string;
  primary_photo_url?: string;
  
  // Term information
  termStartDate?: string;
  termEndDate?: string;
  nextElectionDate?: string;
  
  // Enhanced data
  enhancedContacts: Array<{
    type: string;
    value: string;
    source: string;
    isPrimary: boolean;
    isVerified: boolean;
  }>;
  
  enhancedPhotos: Array<{
    url: string;
    source: string;
    width?: number;
    height?: number;
    altText: string;
    attribution: string;
  }>;
  
  enhancedActivity: Array<{
    type: string;
    title: string;
    description: string;
    url?: string;
    date: string;
    source: string;
    metadata?: any;
  }>;
  
  enhancedSocialMedia: Array<{
    platform: string;
    handle: string;
    url: string;
    followersCount?: number;
    verified: boolean;
  }>;
  
  // Data quality
  dataQuality: {
    primarySourceScore: number;
    secondarySourceScore: number;
    overallConfidence: number;
    lastValidated: string;
    validationMethod: 'api-verification' | 'cross-reference' | 'manual';
    dataCompleteness: number;
    sourceReliability: number;
  };
  
  // Verification
  verificationStatus: 'verified' | 'unverified' | 'pending';
  dataSources: string[];
  lastUpdated: string;
};
```

## Data Quality Scoring

### Scoring System
- **Congress.gov**: 50 points (federal), 20 points (state)
- **Google Civic**: 15 points
- **FEC**: 20 points (federal)
- **Wikipedia**: 15 points
- **OpenStates**: 30 points (state)

### Quality Levels
- **High Quality**: 80%+ (all major sources)
- **Medium Quality**: 60-79% (primary sources)
- **Low Quality**: <60% (minimal sources)

## API Integration

### Data Sources
- **Congress.gov API** - Official federal data
- **Google Civic API** - Elections and voter information
- **FEC API** - Campaign finance data
- **Wikipedia API** - Biographical information
- **OpenStates API** - State legislator data

### Rate Limits
- **Congress.gov**: 5,000 requests/day
- **Google Civic**: 100,000 requests/day
- **FEC**: 1,000 requests/day
- **Wikipedia**: No official limit (respectful usage)
- **OpenStates**: 250 requests/day

## Usage Examples

### Query Representatives by State
```sql
SELECT name, party, office, data_quality_score, data_sources
FROM representatives_core 
WHERE state = 'CA' AND level = 'federal'
ORDER BY data_quality_score DESC;
```

### Query Enhanced Data
```sql
SELECT name, enhanced_contacts, enhanced_photos
FROM representatives_core 
WHERE id = 123;
```

### Query by Data Quality
```sql
SELECT name, data_quality_score, data_sources
FROM representatives_core 
WHERE data_quality_score >= 80
ORDER BY data_quality_score DESC;
```

### JSONB Queries
```sql
-- Find representatives with Twitter handles
SELECT name, enhanced_social_media
FROM representatives_core 
WHERE enhanced_social_media @> '[{"platform": "twitter"}]';

-- Find representatives with specific contact types
SELECT name, enhanced_contacts
FROM representatives_core 
WHERE enhanced_contacts @> '[{"type": "email"}]';
```

---

**Schema Version:** 1.0  
**Last Updated:** October 9, 2025  
**Maintainer:** Civics Platform Team
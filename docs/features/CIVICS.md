# Civics System Documentation

**Created:** December 19, 2024  
**Updated:** October 19, 2025  
**Status:** Production Ready

## Overview

The Civics system provides representative lookup, geographic services, and civic engagement tools through a mobile-optimized interface with comprehensive data from multiple sources.

### Core Capabilities
- Representative lookup with address-based discovery
- Geographic services with district mapping
- Enhanced representative profiles with quality scoring
- Campaign finance integration
- Social engagement features
- Mobile-optimized touch interactions

## Data Ingestion Architecture

### Two-Tier Data Pipeline
1. **Primary Source**: OpenStates People Database (25,000+ YAML files)
2. **Enhancement**: Superior Data Pipeline (live APIs)

### Data Flow
```
OpenStates People Database → representatives_core → User APIs
     ↓
Superior Data Pipeline → Enhanced data → User APIs
```

### OpenStates People Database
- **Source**: [OpenStates People Database](https://github.com/openstates/people)
- **Location**: `/Users/alaughingkitsune/src/Choices/scratch/agent-b/people/data`
- **Format**: YAML files by state (`al/legislature/`, `al/committees/`)
- **Endpoint**: `POST /api/civics/openstates-people`

## Database Schema

### Primary Table: `representatives_core`

| Field | Type | Description |
|-------|------|-------------|
| `id` | SERIAL | Primary key |
| `name` | VARCHAR(255) | Representative name |
| `party` | VARCHAR(100) | Party affiliation |
| `office` | VARCHAR(100) | Role title |
| `level` | VARCHAR(20) | Government level (federal/state/local) |
| `state` | VARCHAR(10) | State code |
| `district` | VARCHAR(10) | District number |

### External Identifiers
| Field | Type | Description |
|-------|------|-------------|
| `openstates_id` | VARCHAR(100) | OpenStates person ID |
| `bioguide_id` | VARCHAR(20) | Bioguide identifier |
| `fec_id` | VARCHAR(20) | FEC identifier |
| `google_civic_id` | VARCHAR(50) | Google Civic API ID |
| `legiscan_id` | VARCHAR(20) | Legiscan identifier |
| `congress_gov_id` | VARCHAR(20) | Congress.gov identifier |
| `govinfo_id` | VARCHAR(20) | GovInfo identifier |

### Contact Information
| Field | Type | Description |
|-------|------|-------------|
| `primary_email` | VARCHAR(255) | Email address |
| `primary_phone` | VARCHAR(20) | Phone number |
| `primary_website` | VARCHAR(500) | Website URL |
| `primary_photo_url` | VARCHAR(500) | Photo URL |

### Social Media
| Field | Type | Description |
|-------|------|-------------|
| `twitter_handle` | VARCHAR(50) | Twitter username |
| `facebook_url` | VARCHAR(500) | Facebook URL |
| `instagram_handle` | VARCHAR(50) | Instagram username |
| `linkedin_url` | VARCHAR(500) | LinkedIn URL |
| `youtube_channel` | VARCHAR(100) | YouTube channel |

### JSONB Enhanced Data
| Field | Type | Description |
|-------|------|-------------|
| `enhanced_contacts` | JSONB | Contact details with verification |
| `enhanced_photos` | JSONB | Photos with metadata |
| `enhanced_activity` | JSONB | Activities and committee memberships |
| `enhanced_social_media` | JSONB | Social media platforms with metrics |

### Quality & Metadata
| Field | Type | Description |
|-------|------|-------------|
| `data_quality_score` | INTEGER | Quality score (0-100) |
| `data_sources` | TEXT[] | Data sources array |
| `verification_status` | VARCHAR(20) | Verification status |
| `last_verified` | TIMESTAMP | Last verification timestamp |
| `created_at` | TIMESTAMP | Record creation timestamp |
| `last_updated` | TIMESTAMP | Last update timestamp |

## User-Facing Features

### Candidate Cards (`EnhancedCandidateCard`)

#### Visual Elements
- High-quality photos from `enhanced_photos` JSONB field
- Party badges with color coding (Republican=red, Democratic=blue)
- Quality score indicators showing data completeness
- Level indicators (Federal 🏛️, State 🏛️, Local 🏢)

#### Interactive Features
- Touch gestures for photo navigation and card expansion
- Like/Follow buttons for user engagement
- Share functionality with native sharing support
- Contact actions (email, phone, website)
- Expandable sections for detailed information

#### Data Sources
| Source | Field | Description |
|--------|-------|-------------|
| Basic Info | `name`, `office`, `party`, `state`, `district`, `level` | Core representative data |
| Photos | `enhanced_photos` | JSONB array with metadata |
| Contact | `enhanced_contacts` | JSONB array with verification status |
| Social Media | `enhanced_social_media` | JSONB array with follower counts |
| Activity | `enhanced_activity` | JSONB array with recent activities |
| Quality | `data_quality_score`, `verification_status` | Quality metrics |

### API Endpoints

#### 1. Representative by ID
**Endpoint:** `GET /api/civics/representative/[id]`

**Returns:**
- Basic information (name, office, party, district)
- Contact information with quality scoring
- Social media platforms with engagement metrics
- Campaign finance data (if available)
- Voting behavior and recent votes
- Policy positions and canonical IDs
- Data quality assessment

#### 2. Representatives by State
**Endpoint:** `GET /api/civics/by-state`

**Parameters:**
- `state` - State code (required)
- `level` - Government level (federal/state/local)
- `chamber` - Legislative chamber (house/senate)
- `limit` - Result limit (default: 200)

#### 3. Representatives by Address
**Endpoint:** `GET /api/civics/by-address`

**Parameters:**
- `address` - Address string (required)

**Features:**
- Google Civic Information API integration
- Address normalization and geocoding
- District mapping and representative assignment
- Fallback to database lookup if API fails

### Frontend Components

#### Civics 2.0 Main Page (`/civics-2-0`)
- Header with state selection and live data indicators
- Tab navigation between Representatives and Feed views
- Search and filtering by state, level, and quality
- Responsive grid of candidate cards
- Quality statistics showing data accuracy and source count

#### Enhanced Candidate Card Component
- Mobile-first design with touch-optimized interactions
- Progressive disclosure with expandable sections
- Photo gallery with swipe navigation
- Social engagement with like/follow/share actions
- Contact integration with direct action buttons
- Accessibility compliance (WCAG 2.2 AA)

## Data Quality & Verification

### Quality Scoring System
| Component | Points | Description |
|-----------|--------|-------------|
| Contact Info | 20 | Email address |
| Contact Info | 15 | Phone number |
| Contact Info | 10 | Website |
| Social Media | 15 | Per platform (Twitter, Facebook, Instagram, LinkedIn, YouTube) |
| Photos | 10 | Official photo |
| Photos | 5 | Additional photos |
| Activity Data | 5 | Per committee membership |
| Activity Data | 10 | Recent activity |
| Source Attribution | 5 | Per verified data source |

### Verification Status
| Status | Criteria | Description |
|--------|----------|-------------|
| Verified | Quality score ≥ 70 with multiple sources | High confidence data |
| Unverified | Quality score < 70 or single source | Low confidence data |
| Pending | New data awaiting verification | Under review |

## Performance Optimizations

### Caching Strategy
| Cache Type | TTL | Description |
|------------|-----|-------------|
| Representative cache | 5 minutes | Individual lookups |
| State cache | 10 minutes | State-based queries |
| Photo optimization | Lazy loading | Responsive images |
| API rate limiting | Built-in protection | Abuse prevention |

### Data Processing
- JSONB optimization for efficient storage
- Index optimization for fast queries on state, level, district
- Batch processing for efficient bulk data ingestion
- Real-time updates for live data refresh

## Table Usage Analysis

### Primary Tables
| Table Name | Usage Count | Purpose | Data Source |
|------------|-------------|---------|-------------|
| `representatives_core` | 29 | Main representative data | OpenStates People + Superior Pipeline |
| `id_crosswalk` | 8 | ID mapping between systems | Cross-reference validation |
| `representative_contacts_optimal` | 4 | Optimized contact info | Enhanced contact processing |

### Deprecated Tables
| Table Name | Usage Count | Purpose | Status |
|------------|-------------|---------|---------|
| `representatives_optimal` | 4 | Legacy optimized data | Deprecated |
| `civic_database_entries` | 4 | Legacy civic data | Deprecated |

### Data Flow Architecture
```
OpenStates People Database (YAML files)
    ↓
representatives_core (Primary storage)
    ↓
Enhanced JSONB fields (enhanced_contacts, enhanced_photos, enhanced_activity, enhanced_social_media)
    ↓
User-facing APIs (/api/civics/representative/[id], /api/civics/by-state)
    ↓
Frontend Components (EnhancedCandidateCard, Civics2Page)
```

### JSONB Field Structure

#### `enhanced_contacts`
```json
[
  {
    "type": "email",
    "value": "rep@example.com",
    "isVerified": true,
    "source": "openstates-people",
    "lastVerified": "2025-10-19T10:54:35.745Z"
  }
]
```

#### `enhanced_photos`
```json
[
  {
    "url": "https://www.legislature.state.al.us/pdf/house/members/Hendrix_55.png",
    "source": "openstates-people",
    "altText": "Photo of Travis Hendrix",
    "attribution": "OpenStates People Database",
    "isPrimary": true
  }
]
```

#### `enhanced_activity`
```json
[
  {
    "date": "2025-10-08T21:45:31.679Z",
    "type": "committee_membership",
    "title": "Fiscal Responsibility - member",
    "source": "openstates-people",
    "metadata": {
      "committee": "Fiscal Responsibility",
      "member_role": "member",
      "jurisdiction": "AL"
    },
    "description": "Committee: Fiscal Responsibility (member)"
  }
]
```

#### `enhanced_social_media`
```json
[
  {
    "platform": "twitter",
    "handle": "@rep_handle",
    "url": "https://twitter.com/rep_handle",
    "followersCount": 15000,
    "engagementRate": 0.05,
    "verified": true,
    "officialAccount": true,
    "lastUpdated": "2025-10-19T10:54:35.745Z"
  }
]
```

## System Architecture Summary

### Core Components
1. **`representatives_core`** - Single source of truth for all civics data
2. **JSONB fields** - Rich data storage (enhanced_contacts, enhanced_photos, enhanced_activity, enhanced_social_media)
3. **User-facing APIs** - 3 endpoints for different use cases
4. **Frontend components** - EnhancedCandidateCard and Civics2Page
5. **Data ingestion** - OpenStates People Database + Superior Pipeline

### Architecture Benefits
- **Single table** (`representatives_core`) stores everything
- **JSONB fields** provide rich, structured data
- **Two-tier ingestion** (OpenStates People → Superior Pipeline)
- **Clean separation** between ingestion (uses API keys) and user-facing (queries database)
- **Mobile-first UI** with touch-optimized candidate cards

### Performance Metrics
| Metric | Value | Description |
|--------|-------|-------------|
| Data Ingestion | 1-6 seconds | Per representative |
| API Response | <200ms | For cached data |
| Photo Loading | Lazy loading | Responsive images |
| Search Performance | Sub-second | Filtering and sorting |

### Current Electorate Filtering
- **Enabled**: `strictCurrentFiltering: true`
- **System Date Verification**: Uses current date for filtering
- **Excluded Representatives**: Dianne Feinstein, Kevin McCarthy, Kamala Harris
- **Result**: Only current, active representatives are shown to users
# Civics Ingestion System

**Created:** October 5, 2025  
**Updated:** October 9, 2025  
**Status:** Production Ready  
**Purpose:** Technical documentation for the civics data ingestion system

---

## System Overview

The Civics Ingestion System provides comprehensive data collection and processing for U.S. political representatives through a multi-API integration pipeline. The system supports federal, state, and local representatives with enhanced data quality scoring and cross-reference validation.

## Architecture

### Core Components

**SuperiorDataPipeline** (`web/lib/civics-2-0/superior-data-pipeline.ts`)
- Multi-API integration with intelligent failure detection
- Data quality scoring and cross-reference validation
- Current electorate filtering and data preservation
- Database storage with upsert logic

**API Routes** (`web/app/api/civics/`)
- `/superior-ingest` - Main data ingestion endpoint
- `/by-state` - Representative retrieval by state
- `/by-address` - Address-based representative lookup
- `/openstates-populate` - State legislator population

**Database Schema** (`representatives_core`)
- Unified table with JSONB columns for enhanced data
- Row Level Security (RLS) enabled on all tables
- Optimized indexes for common query patterns

## Data Sources

### Federal Representatives
- **Congress.gov API** - Official federal data (100% coverage)
- **Google Civic API** - Elections and voter information (100% coverage)
- **FEC API** - Campaign finance data (38% coverage)
- **Wikipedia API** - Biographical information (11% coverage)

### State Representatives
- **OpenStates API** - State legislator data (250 requests/day limit)
- **OpenStates People Database** - Enhanced state legislator profiles

## Usage

### Federal Representatives Population

```bash
# Run federal representatives population
cd /Users/alaughingkitsune/src/Choices
node populate-federal-superior.js
```

**Features:**
- Processes 330 federal representatives
- Intelligent API failure detection and backoff
- Data quality preservation (won't overwrite high-quality data)
- Progress tracking with real-time updates

### State Representatives Population

```bash
# Run state representatives population
curl -X POST http://localhost:3001/api/civics/openstates-populate
```

**Features:**
- Processes all 50 states
- Enhanced data collection with social media
- Committee memberships and leadership positions
- District-level precision mapping

### Data Retrieval

```bash
# Get representatives by state
curl "http://localhost:3001/api/civics/by-state?state=California&level=federal&limit=10"

# Get representatives by address
curl "http://localhost:3001/api/civics/by-address?address=123 Main St, Sacramento, CA"
```

## Configuration

### Environment Variables

```bash
# Required API keys
CONGRESS_GOV_API_KEY=your_congress_gov_key
GOOGLE_CIVIC_API_KEY=your_google_civic_key
FEC_API_KEY=your_fec_key

# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Pipeline Configuration

```typescript
const config = {
  enableCongressGov: true,
  enableGoogleCivic: true,
  enableFEC: true,
  enableOpenStatesApi: true,
  enableWikipedia: true,
  strictCurrentFiltering: true,
  minimumQualityScore: 15,
  maxConcurrentRequests: 3,
  rateLimitDelay: 1000
};
```

## Data Quality

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

## API Failure Handling

### Intelligent Rate Limiting
- Exponential backoff for rate-limited APIs
- API failure tracking and recovery detection
- Automatic API skipping after multiple failures
- Data preservation for high-quality records

### Error Recovery
- Retry logic with configurable delays
- Fallback data sources when primary APIs fail
- Graceful degradation of data quality
- Comprehensive error logging

## Database Schema

### Core Table: `representatives_core`

```sql
CREATE TABLE representatives_core (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  office VARCHAR(255),
  level VARCHAR(50), -- 'federal', 'state', 'local'
  state VARCHAR(50),
  district VARCHAR(10),
  party VARCHAR(100),
  
  -- External identifiers
  bioguide_id VARCHAR(20),
  fec_id VARCHAR(20),
  google_civic_id VARCHAR(50),
  openstates_id VARCHAR(100),
  
  -- Enhanced data (JSONB)
  enhanced_contacts JSONB,
  enhanced_photos JSONB,
  enhanced_activity JSONB,
  enhanced_social_media JSONB,
  
  -- Quality metrics
  data_quality_score INTEGER,
  data_sources TEXT[],
  last_updated TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Security
- Row Level Security (RLS) enabled on all tables
- Proper access policies for authenticated and anonymous users
- Service role permissions for data ingestion

## Performance

### Optimizations
- Database indexes on common query patterns
- JSONB columns for efficient enhanced data storage
- Concurrent API processing with rate limiting
- Query performance optimized (<100ms response times)

### Monitoring
- Real-time progress tracking
- API failure detection and reporting
- Data quality metrics and trends
- Performance monitoring and optimization

## Troubleshooting

### Common Issues

**API Rate Limits**
- Check API key validity and usage limits
- Monitor failure detection logs
- Adjust rate limiting delays if needed

**Data Quality Issues**
- Verify API key configurations
- Check network connectivity
- Review API failure detection logs

**Database Issues**
- Ensure RLS policies are properly configured
- Check database connection and permissions
- Verify table schemas and indexes

### Debugging

```bash
# Check federal population progress
tail -f federal-single-process.log

# Verify database connectivity
curl "http://localhost:3001/api/health"

# Test API endpoints
curl "http://localhost:3001/api/civics/by-state?state=California&limit=1"
```

## Maintenance

### Regular Tasks
- Monitor API usage and rate limits
- Update representative data periodically
- Review and optimize data quality scores
- Monitor database performance and storage

### Data Updates
- Federal representatives: Run `populate-federal-superior.js`
- State representatives: Use `/api/civics/openstates-populate`
- Address-based updates: Use `/api/civics/by-address`

---

**System Status:** Production Ready  
**Last Updated:** October 9, 2025  
**Maintainer:** Civics Platform Team
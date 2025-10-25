# Civics Data Ingestion Process

## Overview

The civics backend service ingests representative data from the OpenStates People database and enhances it with additional APIs.

## Data Sources

### Primary: OpenStates People Database
- **Location**: `/services/civics-backend/data/openstates-people/`
- **Format**: YAML files (25,199+ representatives)
- **Coverage**: All state legislators, federal representatives
- **Filtering**: Current representatives only (no expired terms)

### Enhancement APIs
- **Congress.gov**: Federal representative data
- **Google Civic API**: Additional contact information
- **FEC**: Campaign finance data

## Ingestion Order

1. **OpenStates People** (Foundation)
   - Populates `representatives_core` table
   - Establishes base representative data
   - Filters for current representatives only

2. **State/Federal APIs** (Enhancement)
   - Enhances existing data
   - Adds contact information
   - Adds photos and social media

## Scripts

### Main Ingestion Script
```bash
# Full pipeline
npm run ingest

# Individual steps
npm run ingest:openstates    # Step 1: Foundation
npm run ingest:superior      # Step 2: Enhancement
```

### Real OpenStates People Script
```bash
# Process all representatives
node scripts/real-openstates-people.js

# Process specific state
node scripts/real-openstates-people.js ca

# Process with limit
node scripts/real-openstates-people.js ca null 100
```

## Data Transformation

### OpenStates Format → Database Schema
```javascript
// Current representative filtering
const currentRoles = personData.roles?.filter(role => 
  !role.end_date || new Date(role.end_date) > new Date()
) || [];

// Data transformation
const representative = {
  name: personData.name,
  state: primaryRole.jurisdiction?.split('/').find(part => part.startsWith('state:'))?.split(':')[1],
  office: primaryRole.type === 'upper' ? 'Senator' : 'Representative',
  party: primaryRole.party,
  district: primaryRole.district,
  level: 'state'
};
```

## Quality Control

### Filtering
- ✅ Current representatives only
- ✅ Active roles only
- ✅ Valid data required
- ✅ No expired terms

### Validation
- Cross-reference multiple sources
- Verify contact information
- Validate social media handles
- Check committee memberships

### Error Handling
- Graceful failure for invalid data
- Detailed error logging
- Success rate tracking
- Retry mechanisms

## Status Monitoring

### Health Checks
```bash
# Check service health
npm run health

# Check ingestion status
npm run status

# View logs
tail -f openstates-ingest.log
```

### Metrics
- **Total Processed**: 7,328 representatives
- **Success Rate**: 92% (6,667 successful, 661 errors)
- **Current Representatives**: ✅ Filtered correctly
- **Data Quality**: High (validated and verified)

## Configuration

### Environment Variables
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CONGRESS_GOV_API_KEY=your_congress_gov_key
GOOGLE_CIVIC_API_KEY=your_google_civic_key
FEC_API_KEY=your_fec_key
```

### Rate Limiting
- 1 second delay between API requests
- Respects external API limits
- Prevents rate limit violations

## Troubleshooting

### Common Issues
1. **Database connection failed**: Check Supabase credentials
2. **API rate limit exceeded**: Increase delay between requests
3. **Data validation failed**: Check data format and quality
4. **Migration conflicts**: Remove old migration files

### Debug Commands
```bash
# Check database connection
npm run health

# Test specific data source
node scripts/real-openstates-people.js ca null 5

# View detailed logs
npm run ingest --verbose
```


# 📚 Civics Backend - API Reference

Complete reference for the civics backend data ingestion system APIs and data sources.

## 🔗 Data Sources

### Congress.gov API
- **Base URL**: `https://api.congress.gov/v3/`
- **Documentation**: [Congress.gov API Docs](https://api.congress.gov/docs/)
- **Rate Limit**: 5000 requests/day
- **Authentication**: API key required

#### Endpoints Used
```javascript
// Current Members
GET /member?api_key={key}&limit={limit}

// Member Details
GET /member/{bioguideId}?api_key={key}

// Committees
GET /committee?api_key={key}&limit={limit}

// Votes
GET /vote?api_key={key}&limit={limit}
```

### OpenStates API
- **Base URL**: `https://openstates.org/api/v1/`
- **Documentation**: [OpenStates API Docs](https://openstates.org/api/)
- **Rate Limit**: 10,000 requests/day
- **Authentication**: API key required

#### Endpoints Used
```javascript
// Legislators
GET /legislators/?apikey={key}&state={state}&limit={limit}

// Legislator Details
GET /legislators/{id}/?apikey={key}

// Committees
GET /committees/?apikey={key}&state={state}

// Bills
GET /bills/?apikey={key}&state={state}&limit={limit}
```

### FEC API
- **Base URL**: `https://api.open.fec.gov/v1/`
- **Documentation**: [FEC API Docs](https://api.open.fec.gov/developers/)
- **Rate Limit**: 1000 requests/hour
- **Authentication**: API key required

#### Endpoints Used
```javascript
// Candidates
GET /candidates/?api_key={key}&cycle={year}

// Candidate Details
GET /candidate/{candidate_id}/?api_key={key}

// Financial Data
GET /candidate/{candidate_id}/totals/?api_key={key}
```

### Google Civic Information API
- **Base URL**: `https://www.googleapis.com/civicinfo/v2/`
- **Documentation**: [Google Civic API Docs](https://developers.google.com/civic-information)
- **Rate Limit**: 25,000 requests/day
- **Authentication**: API key required

#### Endpoints Used
```javascript
// Divisions (OCD-IDs)
GET /divisions?key={key}&query={address}

// Elections
GET /elections?key={key}

// Voter Info
GET /voterinfo?key={key}&address={address}&electionId={id}
```

### Wikipedia API
- **Base URL**: `https://en.wikipedia.org/api/rest_v1/`
- **Documentation**: [Wikipedia API Docs](https://en.wikipedia.org/api/rest_v1/)
- **Rate Limit**: No official limit
- **Authentication**: None required

#### Endpoints Used
```javascript
// Page Summary
GET /page/summary/{title}

// Search
GET /page/summary/{search_term}
```

## 🗄️ Database Schema

### Core Tables

#### representatives_core
```sql
CREATE TABLE representatives_core (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  office varchar(100) NOT NULL,
  level varchar(20) NOT NULL,
  state varchar(2) NOT NULL,
  district varchar(10),
  party varchar(10),
  is_active boolean DEFAULT true,
  bioguide_id varchar(20),
  canonical_id varchar(255) UNIQUE,
  data_quality_score integer DEFAULT 0,
  verification_status varchar(50) DEFAULT 'unverified',
  primary_email varchar(255),
  primary_phone varchar(20),
  primary_website varchar(255),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

#### representative_contacts
```sql
CREATE TABLE representative_contacts (
  id serial PRIMARY KEY,
  representative_id integer REFERENCES representatives_core(id),
  contact_type varchar(50) NOT NULL,
  value varchar(255) NOT NULL,
  is_verified boolean DEFAULT false,
  source varchar(50) NOT NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

#### representative_photos
```sql
CREATE TABLE representative_photos (
  id serial PRIMARY KEY,
  representative_id integer REFERENCES representatives_core(id),
  url varchar(500) NOT NULL,
  is_primary boolean DEFAULT false,
  source varchar(50) NOT NULL,
  alt_text varchar(255),
  attribution varchar(255),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

#### representative_social_media
```sql
CREATE TABLE representative_social_media (
  id serial PRIMARY KEY,
  representative_id integer REFERENCES representatives_core(id),
  platform varchar(50) NOT NULL,
  handle varchar(100) NOT NULL,
  url varchar(500),
  is_verified boolean DEFAULT false,
  is_primary boolean DEFAULT false,
  follower_count integer,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

#### representative_activity
```sql
CREATE TABLE representative_activity (
  id serial PRIMARY KEY,
  representative_id integer REFERENCES representatives_core(id),
  type varchar(50) NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  date timestamp NOT NULL,
  source varchar(50) NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

#### id_crosswalk
```sql
CREATE TABLE id_crosswalk (
  id serial PRIMARY KEY,
  entity_type varchar(50) NOT NULL,
  canonical_id varchar(255) NOT NULL,
  source varchar(50) NOT NULL,
  source_id varchar(255) NOT NULL,
  attrs jsonb DEFAULT '{}',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(source, source_id)
);
```

## 🔧 Configuration

### Environment Variables
```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API Keys
CONGRESS_GOV_API_KEY=your_congress_key
OPEN_STATES_API_KEY=your_openstates_key
FEC_API_KEY=your_fec_key
GOOGLE_CIVIC_API_KEY=your_google_key

# Optional
WIKIPEDIA_API_KEY=your_wikipedia_key
OPENSECRETS_API_KEY=your_opensecrets_key
```

### Pipeline Configuration
```javascript
// config/default.js
module.exports = {
  // Rate limiting
  rateLimits: {
    congressGov: 60,      // requests per minute
    openStates: 60,
    fec: 60,
    googleCivic: 100,
    wikipedia: 60
  },
  
  // Data quality thresholds
  qualityThresholds: {
    minScore: 0.7,
    minVerification: 0.8
  },
  
  // Processing limits
  limits: {
    maxRepresentatives: 1000,
    batchSize: 50,
    concurrentRequests: 5
  }
};
```

## 🚀 Usage Examples

### Basic Pipeline
```bash
# Run complete pipeline
npm start

# Process federal representatives
npm run federal

# Process state representatives
npm run state

# Run tests
npm test
```

### Advanced Usage
```bash
# Process specific state
node scripts/main-pipeline.js state CA

# Process with custom limits
node scripts/main-pipeline.js federal --limit 50

# Test specific functionality
node scripts/test-enhanced-pipeline.js
```

### Programmatic Usage
```javascript
const { CivicsBackendPipeline } = require('./lib/civics-backend-pipeline');

const pipeline = new CivicsBackendPipeline();

// Process federal representatives
await pipeline.processFederalRepresentatives(100);

// Process state representatives
await pipeline.processStateRepresentatives(50, 'CA');

// Get data summary
const summary = await pipeline.getDataSummary();
```

## 📊 Data Quality Metrics

### Quality Scoring
```javascript
// Quality score calculation
const qualityScore = {
  completeness: 0.8,    // 80% of required fields populated
  accuracy: 0.9,        // 90% cross-source validation
  consistency: 0.85,    // 85% format consistency
  timeliness: 0.95,     // 95% data freshness
  overall: 0.875        // Weighted average
};
```

### Verification Status
```javascript
const verificationStatus = {
  'verified': 'Cross-source validated',
  'partial': 'Some sources validated',
  'unverified': 'Single source only',
  'conflict': 'Conflicting data sources'
};
```

## 🔄 Data Flow

### Ingestion Process
1. **Fetch** - Get data from APIs and YAML files
2. **Parse** - Extract and normalize data
3. **Enhance** - Cross-reference with multiple sources
4. **Validate** - Check data quality and consistency
5. **Store** - Save to normalized database tables
6. **Score** - Calculate quality metrics
7. **Verify** - Mark verification status

### Cross-Reference Process
1. **Canonical ID** - Generate unique identifier
2. **Source Mapping** - Map to source-specific IDs
3. **Quality Check** - Validate across sources
4. **Conflict Resolution** - Resolve data conflicts
5. **Final Score** - Calculate overall quality

## 🧪 Testing

### Test Suites
```bash
# Database connection test
node scripts/verify-database-connection.js

# Basic functionality test
node scripts/test-basic-functionality.js

# Enhanced pipeline test
node scripts/test-enhanced-pipeline.js

# Data quality test
node scripts/data-summary.js
```

### Test Data
```javascript
// Sample test representative
const testRep = {
  name: 'Test Representative',
  office: 'Representative',
  level: 'federal',
  state: 'CA',
  district: '1',
  party: 'D',
  is_active: true,
  bioguide_id: 'T000000',
  canonical_id: 'test_rep_1'
};
```

## 📈 Monitoring

### Health Checks
```bash
# Database health
node scripts/verify-database-connection.js

# API health
node scripts/test-api-connectivity.js

# Data quality
node scripts/data-summary.js
```

### Metrics
- **Processing Speed**: Records per minute
- **API Usage**: Rate limit utilization
- **Error Rates**: Failed requests percentage
- **Data Quality**: Average quality scores
- **Storage Usage**: Database size and growth

## 🔒 Security

### API Security
- Rate limiting to prevent abuse
- API key rotation
- Request validation
- Error handling without data exposure

### Database Security
- Service role with minimal permissions
- Row Level Security (RLS) policies
- Data encryption for sensitive fields
- Regular security audits

### Data Privacy
- PII protection and hashing
- Data retention policies
- GDPR compliance
- Secure data transmission

## 🆘 Troubleshooting

### Common Issues
```bash
# Database connection errors
node scripts/verify-database-connection.js

# API rate limiting
node scripts/check-api-usage.js

# Data quality issues
node scripts/data-summary.js

# Duplicate records
node scripts/check-existing-data.js
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm start

# Check specific logs
tail -f logs/civics-backend.log | grep ERROR
```

## 📞 Support

### Getting Help
- **Documentation**: [README.md](../README.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/civics-backend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/civics-backend/discussions)

### Emergency Procedures
```bash
# Stop all processes
pm2 stop all

# Restart system
pm2 restart all

# Check system status
pm2 status
```

## 🎉 Success!

Once everything is working, you should see:
- ✅ Database connection successful
- ✅ All API keys working
- ✅ Data ingestion running
- ✅ Quality scores > 80%
- ✅ No errors in logs

Your civics backend is now ready for production use! 🗳️

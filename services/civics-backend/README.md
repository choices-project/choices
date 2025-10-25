# 🗳️ Civics Backend - Standalone Data Ingestion System

A complete, standalone system for ingesting and processing civic data from multiple sources including Congress.gov, OpenStates, FEC, Google Civic, and Wikipedia.

## 🚀 Quick Start

```bash
# Clone the repository
git clone <your-repo-url> civics-backend
cd civics-backend

# Run the complete setup
./setup.sh

# Start ingesting data
npm start
```

## 📋 Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Database** - Supabase account with service role key
- **API Keys** - See [API Keys](#api-keys) section below
- **OpenStates People Data** - Automatically included via git submodule

## 🏛️ Data Sources & Attribution

### OpenStates People Data
This system uses data from the [OpenStates People](https://github.com/openstates/people) project, which provides comprehensive information about state legislators across the United States.

- **License**: MIT License
- **Attribution**: See [data/OPENSTATES_ATTRIBUTION.md](data/OPENSTATES_ATTRIBUTION.md)
- **Repository**: [https://github.com/openstates/people](https://github.com/openstates/people)
- **Organization**: [OpenStates](https://openstates.org/)

We are grateful to the OpenStates team for providing this valuable public resource that enables civic engagement and transparency in state government.

## 🔧 Installation

### Option 1: Automated Setup (Recommended)
```bash
./setup.sh
```

### Option 2: Manual Setup
```bash
# Install dependencies
npm install

# Copy environment template
cp env.example .env.local

# Edit configuration
nano .env.local

# Test the system
npm test
```

## 🔑 API Keys

You'll need API keys from the following services:

### Required
- **Supabase** - Database and authentication
  - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
  - `SUPABASE_SERVICE_ROLE_KEY` - Service role key with full permissions

### Data Sources
- **Congress.gov** - Federal representative data
  - `CONGRESS_GOV_API_KEY` - [Get key here](https://api.congress.gov/sign-up/)
- **OpenStates** - State legislative data
  - `OPEN_STATES_API_KEY` - [Get key here](https://openstates.org/api/register/)
- **FEC** - Campaign finance data
  - `FEC_API_KEY` - [Get key here](https://api.open.fec.gov/developers/)
- **Google Civic** - Geographic and election data
  - `GOOGLE_CIVIC_API_KEY` - [Get key here](https://developers.google.com/civic-information)

### Optional
- **Wikipedia** - Biographical data (no key required)
- **OpenSecrets** - Additional campaign finance data

## 🗄️ Database Schema

The system uses a normalized relational schema with the following core tables:

### Core Tables
- `representatives_core` - Main representative data
- `representative_contacts` - Contact information
- `representative_photos` - Profile photos
- `representative_social_media` - Social media accounts
- `representative_activity` - Recent activities and votes
- `id_crosswalk` - Cross-reference IDs from different sources

### Supporting Tables
- `openstates_people_data` - OpenStates YAML data
- `openstates_people_roles` - Legislative roles
- `user_address_lookups` - Geographic lookups
- `user_profiles` - User data

## 🎯 Usage

### Basic Commands
```bash
# Run complete pipeline
npm start

# Process federal representatives only
npm run federal

# Process state representatives only
npm run state

# Run tests
npm test

# Development mode
npm run dev
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

## 📊 Data Sources

### Federal Data
- **Congress.gov API** - Current members, committees, votes
- **FEC API** - Campaign finance, contributions
- **Wikipedia API** - Biographical information
- **Google Civic API** - Geographic divisions (OCD-IDs)

### State Data
- **OpenStates API** - State legislators, committees, bills
- **OpenStates YAML** - Historical data and roles
- **Wikipedia API** - Biographical information
- **Google Civic API** - Geographic divisions

## 🔄 Data Flow

1. **Ingestion** - Fetch data from APIs and YAML files
2. **Enhancement** - Cross-reference and enrich with multiple sources
3. **Normalization** - Store in normalized relational tables
4. **Quality Scoring** - Calculate data quality metrics
5. **Verification** - Mark verification status and sources

## 🛠️ Configuration

### Environment Variables
```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# API Keys
CONGRESS_GOV_API_KEY=your_congress_key
OPEN_STATES_API_KEY=your_openstates_key
FEC_API_KEY=your_fec_key
GOOGLE_CIVIC_API_KEY=your_google_key

# Optional
WIKIPEDIA_API_KEY=your_wikipedia_key
```

### Pipeline Configuration
Edit `config/default.js` to customize:
- Rate limiting
- Data sources
- Quality thresholds
- Processing limits

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Individual Test Suites
```bash
# Test database connection
node scripts/verify-database-connection.js

# Test basic functionality
node scripts/test-basic-functionality.js

# Test enhanced pipeline
node scripts/test-enhanced-pipeline.js

# Test data quality
node scripts/data-summary.js
```

## 📈 Monitoring

### Data Quality Metrics
- **Completeness** - Percentage of required fields populated
- **Accuracy** - Cross-source validation scores
- **Consistency** - Data format and type consistency
- **Timeliness** - Data freshness and update frequency

### Performance Metrics
- **Processing Speed** - Records per minute
- **API Usage** - Rate limit utilization
- **Error Rates** - Failed requests and data quality issues
- **Storage Usage** - Database size and growth

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Test database connection
node scripts/verify-database-connection.js

# Check environment variables
cat .env.local
```

#### API Rate Limiting
```bash
# Check API usage
node scripts/check-api-usage.js

# Adjust rate limits in config/default.js
```

#### Data Quality Issues
```bash
# Run data quality report
node scripts/data-summary.js

# Check for duplicates
node scripts/check-existing-data.js
```

### Logs and Debugging
```bash
# Enable debug logging
DEBUG=* npm start

# Check specific logs
tail -f logs/civics-backend.log
```

## 📚 Documentation

- [API Reference](docs/api-reference.md)
- [Data Schema](docs/data-schema.md)
- [Deployment Guide](docs/deployment.md)
- [Contributing](docs/contributing.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues** - [GitHub Issues](https://github.com/your-org/civics-backend/issues)
- **Discussions** - [GitHub Discussions](https://github.com/your-org/civics-backend/discussions)
- **Email** - support@your-domain.com

## 🎉 Success!

Once everything is set up, you should see:
- ✅ Database connection successful
- ✅ All API keys configured
- ✅ Data ingestion working
- ✅ Quality scores > 80%
- ✅ No duplicate records

Happy data ingesting! 🗳️
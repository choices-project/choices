# 🚀 Civics Backend Scripts

Essential scripts for the sophisticated civics data ingestion system.

## 📋 **Production Scripts**

### **Main Pipeline**
- **`sophisticated-main-pipeline.ts`** - Main production pipeline (TypeScript)
  - Usage: `npm start`, `npm run federal`, `npm run state`
  - Features: Multi-source integration, quality scoring, error handling

### **Testing & Validation**
- **`test-sophisticated-system.ts`** - Comprehensive test suite
  - Usage: `npm test`
  - Features: Database connection, pipeline initialization, data quality tests

- **`test-basic-functionality.js`** - Basic functionality tests
  - Usage: `node scripts/test-basic-functionality.js`
  - Features: Environment variables, database access, API keys

### **Setup & Utilities**
- **`setup-database.js`** - Database setup and configuration
  - Usage: `node scripts/setup-database.js`
  - Features: Schema setup, RLS policies, permissions

- **`verify-database-connection.js`** - Database connection verification
  - Usage: `node scripts/verify-database-connection.js`
  - Features: Connection testing, table access, permissions

## 🎯 **Usage Commands**

### **Main Operations**
```bash
# Run complete pipeline
npm start

# Process federal representatives
npm run federal

# Process state representatives
npm run state CA

# Run comprehensive tests
npm test

# Run basic functionality tests
node scripts/test-basic-functionality.js
```

### **Setup & Maintenance**
```bash
# Complete system setup
./setup.sh

# Database setup only
node scripts/setup-database.js

# Verify database connection
node scripts/verify-database-connection.js
```

## 📊 **Script Features**

### **Sophisticated Main Pipeline**
- ✅ **TypeScript-based** with full type safety
- ✅ **Multi-source integration** (Congress.gov, FEC, OpenStates, Google Civic, Wikipedia)
- ✅ **Data quality scoring** and validation
- ✅ **Rate limiting** and API failure recovery
- ✅ **Current electorate verification** with system date filtering
- ✅ **Cross-referencing** and deduplication
- ✅ **Normalized table integration**

### **Comprehensive Test Suite**
- ✅ **Database connection** testing
- ✅ **Pipeline initialization** verification
- ✅ **Environment variable** validation
- ✅ **Data quality** assessment
- ✅ **Crosswalk data** verification
- ✅ **Normalized tables** accessibility

### **Setup & Utilities**
- ✅ **Database schema** setup and configuration
- ✅ **RLS policies** and permissions management
- ✅ **Connection verification** with detailed diagnostics
- ✅ **Environment validation** for all required variables

## 🔧 **Configuration**

All scripts use the environment variables defined in `.env.local`:
- **Database**: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **APIs**: `CONGRESS_GOV_API_KEY`, `OPEN_STATES_API_KEY`, `FEC_API_KEY`, `GOOGLE_CIVIC_API_KEY`

## 📈 **Performance**

- ✅ **Concurrent processing** with configurable limits
- ✅ **Batch processing** for large datasets
- ✅ **Caching** for repeated API calls
- ✅ **Memory management** for large data processing

## 🎉 **Ready for Production**

The civics backend scripts are now **streamlined and production-ready** with only essential functionality remaining! 🗳️
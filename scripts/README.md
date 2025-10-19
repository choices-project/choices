# Supabase Database Scripts

This directory contains safe, production-ready scripts for inspecting and maintaining your Supabase database.

## 🔒 Safety First

All scripts in this directory are designed with safety as the top priority:

- **Read-only operations** - No data modification
- **No schema changes** - No table or index modifications
- **Safe error handling** - Graceful failure without side effects
- **Clear documentation** - Every script explains what it does

## 📁 Available Scripts

### `generate-comprehensive-schema.js` ⭐ **PRIMARY**

**Purpose**: Generate comprehensive TypeScript types for all 121 database tables from actual Supabase dashboard

**What it does**:
- Generates complete TypeScript Database interface for ALL actual tables
- Covers all major systems (core, hashtags, analytics, civics, privacy, WebAuthn, etc.)
- Creates production-ready type definitions based on real database structure
- Updates `web/types/database-comprehensive.ts`
- **RESOLVES AUTHENTICATION ISSUES** - Includes missing WebAuthn tables

**Usage**:
```bash
cd /Users/alaughingkitsune/src/Choices
node scripts/generate-comprehensive-schema.js
```

**Output**: Complete TypeScript schema with 121 tables from actual Supabase dashboard

### `discover-all-tables.js` 🔍 **DISCOVERY**

**Purpose**: Discover all tables in the database using comprehensive testing

**What it does**:
- Tests 469 potential table names
- Identifies all accessible tables
- Discovers tables with data vs empty tables
- Creates comprehensive table inventory
- **BREAKTHROUGH**: Found all 121 actual tables!

**Usage**:
```bash
cd /Users/alaughingkitsune/src/Choices
node scripts/discover-all-tables.js
```

**Output**: Complete inventory of all database tables with accessibility status

### `supabase-inspection.js`

**Purpose**: Comprehensive database health check and performance analysis

**What it does**:
- Database size and table statistics
- Cache hit rate analysis
- Index usage and performance
- Query performance metrics
- Bloat detection

**Usage**:
```bash
cd /Users/alaughingkitsune/src/Choices
node scripts/supabase-inspection.js
```

**Output**: Safe, read-only analysis of your database performance

### `database-schema.js`

**Purpose**: Comprehensive database schema inspection and documentation

**What it does**:
- Queries all tables, columns, indexes, constraints
- Generates detailed schema documentation
- Identifies relationships and dependencies
- Creates comprehensive schema reports

**Usage**:
```bash
cd /Users/alaughingkitsune/src/Choices
node scripts/database-schema.js
```

**Output**: Detailed schema documentation and analysis

### `simple-schema-check.js`

**Purpose**: Quick database table verification

**What it does**:
- Verifies specific tables exist
- Quick health check
- Validates WebAuthn tables
- Fast table accessibility test

**Usage**:
```bash
cd /Users/alaughingkitsune/src/Choices
node scripts/simple-schema-check.js
```

**Output**: Quick table verification results

**Current script collection**: 8 production-ready scripts, all current and useful.

## 🚫 What These Scripts DON'T Do

- ❌ Modify any data
- ❌ Change schema structure
- ❌ Drop tables or indexes
- ❌ Execute unsafe SQL
- ❌ Access sensitive user data

## 🔧 Prerequisites

1. **Environment Setup**: Ensure your `web/.env.local` file contains:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Node.js Dependencies**: Scripts use the same dependencies as your web app

## 📊 Understanding the Output

### Cache Hit Rates
- **✅ 99%+**: Excellent performance
- **⚠️ 95-99%**: Good, but could be better
- **❌ <95%**: Poor performance, consider upgrading compute

### Index Analysis
- **Unused Indexes**: Indexes that have never been scanned (candidates for removal)
- **Large Indexes**: Indexes taking up significant space
- **Scan Counts**: How often indexes are used

### Table Statistics
- **Size**: Total size including indexes
- **Bloat**: Dead tuples that need cleanup
- **Live Tuples**: Active data rows

### Query Performance
- **Total Time**: Cumulative execution time
- **Mean Time**: Average execution time
- **Calls**: How often the query runs

## 🛠️ Troubleshooting

### "Missing Supabase credentials"
- Check that `web/.env.local` exists and contains the required variables
- Ensure the service role key has the correct permissions

### "Could not get [metric]"
- Some metrics require `pg_stat_statements` to be enabled
- This is normal and doesn't affect the safety of the script

### "No data available"
- Some metrics may not be available on all Supabase plans
- The script will gracefully handle missing data

## 🔄 Regular Maintenance

Run the inspection script regularly to:
- Monitor database health
- Identify performance issues early
- Track optimization progress
- Ensure efficient resource usage

## 📞 Support

If you encounter issues with these scripts:
1. Check the error messages - they're designed to be helpful
2. Verify your environment setup
3. Ensure you have the necessary Supabase permissions

Remember: These scripts are **read-only** and **safe to run** in production environments.


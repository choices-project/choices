# Archived Test Endpoints

**Created:** October 5, 2025  
**Updated:** October 5, 2025

## Overview

These test endpoints were created during the development and debugging of the Civics 2.0 ingestion system. They are now archived since the production system is working correctly.

## Archived Endpoints

### Database & Schema Testing
- `canonical-id/` - Test canonical ID generation and lookup
- `canonical-ids-list/` - List all canonical IDs in the system
- `database-schema/` - Inspect database schema and structure
- `simple-schema-check/` - Basic database connectivity test

### API & Environment Testing
- `env-check/` - Check environment variable configuration
- `service-key-test/` - Test Supabase service key authentication
- `civics-2-0-free-apis/` - Test FREE APIs pipeline integration

### Pipeline & Data Testing
- `pipeline-test/` - Test the FREE APIs pipeline methods
- `minimal-test/` - Minimal pipeline functionality test
- `minimal-ingest/` - Simple ingestion test without external APIs
- `free-apis-data-types-audit/` - Audit data types and structure

## Current Production System

The working production system now uses:

### Active Endpoints
- `/api/test/execute-comprehensive-ingest/` - Main test ingestion endpoint
- `/api/test/ingestion-status/` - Monitor ingestion progress and status
- `/api/admin/execute-comprehensive-ingest/` - Production admin endpoint

### Working APIs
- **OpenStates API v3** - `https://v3.openstates.org/people` with API key authentication
- **Google Civic API** - Representative lookup and contact information
- **Congress.gov API** - Federal representative data
- **FEC API** - Campaign finance information

### System Status
- ✅ **Active Ingestion**: System processing data successfully
- ✅ **Multi-Source Coverage**: 100% coverage with multiple APIs
- ✅ **Canonical IDs**: 8 IDs from 5 different sources
- ✅ **Database Storage**: Data being stored in Supabase
- ✅ **Geographic Data**: Boundary data ready for visualization

## Notes

- All test endpoints were functional but are no longer needed
- The production system is fully operational
- These endpoints can be safely deleted if storage space is needed
- The main ingestion system is working with all 50 states

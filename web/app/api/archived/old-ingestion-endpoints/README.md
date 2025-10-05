# Archived Old Ingestion Endpoints

**Archived Date:** January 5, 2025  
**Reason:** Replaced by Civics 2.0 FREE APIs Pipeline Implementation

## Archived Endpoints

The following endpoints have been archived because they were replaced by the comprehensive Civics 2.0 FREE APIs pipeline implementation:

### 1. `trial-ingest/`
- **Purpose:** Old trial data ingestion system
- **Replaced by:** `/api/admin/execute-comprehensive-ingest/` and `/api/test/execute-comprehensive-ingest/`
- **Reason:** Limited functionality, replaced by comprehensive FREE APIs pipeline

### 2. `data-ingestion-audit/`
- **Purpose:** Old data ingestion audit system
- **Replaced by:** Built-in audit functionality in comprehensive ingest endpoints
- **Reason:** Redundant with new pipeline's built-in monitoring

### 3. `individual-api-testing/`
- **Purpose:** Individual API testing for old system
- **Replaced by:** `/api/test/civics-2-0-free-apis/` and `/api/test/free-apis-data-types-audit/`
- **Reason:** Superseded by comprehensive FREE APIs testing

### 4. `data-transformations-audit/`
- **Purpose:** Old data transformation audit
- **Replaced by:** Built-in data transformation in FREE APIs pipeline
- **Reason:** Integrated into main pipeline with better error handling

### 5. `database-optimization-plan/`
- **Purpose:** Old database optimization planning
- **Replaced by:** Optimized Civics 2.0 database schema
- **Reason:** Superseded by production-ready schema

### 6. `rate-limits-audit/`
- **Purpose:** Old rate limiting audit
- **Replaced by:** Built-in rate limiting in FREE APIs pipeline
- **Reason:** Integrated into main pipeline with proper rate limiting

### 7. `api-data-extraction-audit/`
- **Purpose:** Old API data extraction audit
- **Replaced by:** Comprehensive FREE APIs pipeline with built-in monitoring
- **Reason:** Superseded by production-ready pipeline

### 8. `web/lib/pipelines/` (Data Ingestion Pipeline)
- **Purpose:** Old batch data ingestion pipeline system
- **Replaced by:** Civics 2.0 FREE APIs Pipeline (`web/lib/civics-2-0/free-apis-pipeline.ts`)
- **Reason:** Superseded by comprehensive FREE APIs integration with better rate limiting and error handling

### 9. `web/lib/civics/ingest.ts`
- **Purpose:** Old civics data ingestion system
- **Replaced by:** Integrated into FREE APIs pipeline
- **Reason:** Consolidated into main pipeline for better maintainability

## Current Active Endpoints

The following endpoints are the **correct and current** implementation:

### ✅ **KEEP THESE - ACTIVE ENDPOINTS:**

1. **`/api/admin/execute-comprehensive-ingest/`** - Main production ingestion endpoint
2. **`/api/test/execute-comprehensive-ingest/`** - Test version of comprehensive ingestion
3. **`/api/test/civics-2-0-free-apis/`** - FREE APIs testing endpoint
4. **`/api/test/free-apis-data-types-audit/`** - Data types audit for FREE APIs
5. **`/api/v1/civics/by-state/`** - State representatives API
6. **`/api/v1/civics/feed/`** - Social feed API
7. **`/api/v1/civics/representative/[id]/`** - Individual representative API

## Implementation Details

The new Civics 2.0 system provides:

- **FREE APIs Integration:** Google Civic (25k/day), OpenStates (10k/day), Congress.gov (5k/day), FEC (1k/day), Wikipedia (unlimited)
- **Comprehensive Data Enrichment:** 200+ data points per representative
- **Cross-Source ID Mapping:** CanonicalIdService integration
- **Production-Ready Architecture:** Rate limiting, error handling, monitoring
- **Mobile-First UI:** Beautiful candidate cards and social feed

## Migration Notes

- All old ingestion logic has been consolidated into the FREE APIs pipeline
- Database schema has been optimized for the new system
- Rate limiting is now built into the pipeline
- Monitoring and auditing are integrated into the main endpoints

---

**Status:** ✅ **ARCHIVED - DO NOT USE**  
**Replacement:** Civics 2.0 FREE APIs Pipeline  
**Contact:** See main project documentation for current implementation details

# 📦 Archived Web Civics Data Ingest Files

This directory contains civics data ingestion files that were moved from the web application to the standalone civics backend service.

## 🗂️ **Archived Files**

### **Core Data Ingest Components**
- `superior-data-pipeline.ts` - Main data ingestion pipeline
- `canonical-id-service.ts` - ID crosswalk and canonical ID resolution
- `current-electorate-verifier.ts` - Current representative filtering
- `openstates-integration.ts` - OpenStates API integration
- `provenance-service.ts` - Data lineage and provenance tracking
- `votesmart-enrichment.ts` - VoteSmart data enrichment
- `types.ts` - Data models and type definitions

### **Documentation**
- `README.md` - Original archive documentation

## 📅 **Archive Information**

- **Original Location**: `web/features/civics/archive/data-ingest/`
- **Archive Date**: October 25, 2025
- **Reason**: Moved to standalone civics backend service
- **Current Location**: `services/civics-backend/lib/`

## 🚫 **Do Not Use**

These files are **archived for reference only**. The active versions are now in the standalone civics backend service at `services/civics-backend/lib/`.

## 🎯 **Current Active Files**

For current civics data ingestion functionality, refer to:
- **`services/civics-backend/lib/`** - Active civics backend service
- **`services/civics-backend/scripts/`** - Production scripts
- **`services/civics-backend/docs/`** - Current documentation

## 📋 **Purpose**

These files were moved from the web application to create a standalone civics backend service, separating data ingestion from user-facing functionality.
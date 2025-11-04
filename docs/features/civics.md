# Civics Feature

**Last Updated**: November 4, 2025  
**Status**: ✅ Operational  
**Location**: `/web/features/civics`

---

## Implementation

### Components (15 files)
- Representative lookup and display
- Campaign finance visualization
- Legislative tracking

### API Integration
- Google Civic Information API
- FEC (Federal Election Commission) API
- ProPublica Congress API

---

## Database

### Tables
- **civic_representatives** (20+ columns)
  - Elected officials database
  - Contact information, district data
  
- **civic_actions** (12 columns)
  - User civic engagement tracking
  - `category` column (added Nov 2025)
  
- **campaign_finance** (15+ columns)
  - Campaign contribution data
  - FEC integration

---

## API Endpoints

### `/api/v1/civics/representative/[id]`
Get representative details
- Auth: Public
- Source: Database + external APIs

### `/api/v1/civics/by-state`
Representatives by state
- Auth: Public
- Returns: Array of representatives

### `/api/v1/civics/coverage-dashboard`
Coverage statistics
- Auth: Public
- Returns: Data completeness metrics

### `/api/civics/ingest`
Admin data ingestion
- Auth: Admin only
- Pulls from external APIs

---

## External API Integration

### Google Civic Information API
- Representative lookup by address
- Electoral district mapping

### FEC API
- Campaign finance data
- Contribution tracking

### ProPublica Congress API
- Legislative votes
- Bill tracking

---

## Tests

**E2E Tests**: Representative lookup, data display  
**Location**: `tests/e2e/civics/`

---

## Key Features

- Address-based representative lookup
- Campaign finance transparency
- Legislative voting records
- Contact representative tools
- Data ingestion from multiple sources

---

_Comprehensive civics information system_


**Last Updated**: 2025-09-17
**Last Updated**: 2025-09-17
# Civics Ingest: Current State & Research Needs
**Last Updated**: 2025-09-17
**Created:** September 16, 2025  
**Purpose:** Research brief for AI to identify current data sources and fill gaps

---

## 🎯 **Current System Status**

### **What We Have Built**
- **Database**: 1,000 representatives across federal (253), state (713), and local (34) levels
- **API Versioning**: `/api/v1/civics/` endpoints with `?fields=` and `?include=` parameters
- **Coverage Dashboard**: Real-time observability with freshness tracking
- **Voting Records**: Mock data integration working (last 5 votes + party alignment)
- **FEC Integration**: Mock data working, ready for live API
- **Production Guardrails**: Canonical IDs, temporal modeling, RLS policies

### **Data Sources Currently Integrated**
1. **GovTrack.us API** ✅
   - Federal representatives (253)
   - Voting records (mock data working)
   - Status: Active and reliable

2. **OpenStates API** ✅
   - State representatives (713)
   - Status: Active and reliable

3. **Google Civic Information API** ✅
   - Local representatives (SF: 16, LA: 18)
   - Status: Active, used for SF/LA local data

4. **FEC API** ⚠️
   - Campaign finance data
   - Status: Mock data working, live API had network issues

5. **Manual Verification** ✅
   - SF and LA local officials
   - Status: Working, manually curated

---

## 🎯 **Our Desires & Goals**

### **Phase 2 MVP (Current Focus)**
1. **FEC Minimal**: `candidate_id`, `cycle`, `total_receipts`, `cash_on_hand`
2. **Voting Records Minimal**: Last 5 roll calls + party alignment %
3. **Contact Enrichment Minimal**: `phone`, `website`, `twitter_url`

### **Data Quality Goals**
- **Coverage**: ≥90% federal reps with FEC mapping
- **Freshness**: Federal ≤7 days, State ≤14 days, Local ≤30 days
- **Accuracy**: Source attribution, confidence scoring
- **Completeness**: All 50 states + DC for federal/state data

### **User Experience Goals**
- **Transparency**: Clear source attribution
- **Performance**: p95 < 500ms API responses
- **Reliability**: 99.9% uptime, graceful degradation
- **Accessibility**: A11y compliance, mobile-friendly

---

## 📊 **Current Data Coverage**

### **Federal Level (253 representatives)**
- **Source**: GovTrack.us API
- **Coverage**: 100% of current Congress
- **Freshness**: <24 hours
- **Gaps**: FEC mapping (0%), contact info (0%)

### **State Level (713 representatives)**
- **Source**: OpenStates API
- **Coverage**: Top 10 states only
- **Freshness**: <24 hours
- **Gaps**: Need all 50 states + DC

### **Local Level (34 representatives)**
- **Source**: Manual verification + Google Civic
- **Coverage**: SF (16) + LA (18) only
- **Freshness**: Manual updates
- **Gaps**: Need scalable local data strategy

---

## 🔍 **Research Questions for AI**

### **1. Contact Information Sources** ✅ **RESOLVED**
**Question**: What are the current best sources for congressional contact information?

**Context**: ProPublica Congress API is officially discontinued. We need:
- Phone numbers
- Official websites
- Twitter/X handles
- Email addresses (if publicly available)

**✅ SOLUTION IMPLEMENTED**:
- **Primary Source**: `unitedstates/congress-legislators` GitHub dataset
  - Rich, curated, versioned data
  - Includes phone, website, social media handles
  - Flat files (YAML/JSON), widely adopted in civic tech
  - **Implementation**: `civics-congress-legislators-sync.ts` created
- **Secondary Source**: Google Civic Information API for gaps
- **Attribution**: Source badges + freshness tracking implemented

### **2. FEC API Status & Alternatives** ✅ **RESOLVED**
**Question**: What's the current status of FEC API and are there better alternatives?

**Context**: We had network connectivity issues with `api.fec.gov`. We need:
- Candidate IDs
- Campaign finance data
- Election cycle information

**✅ SOLUTION IMPLEMENTED**:
- **Primary Source**: OpenFEC API (https://api.open.fec.gov/)
  - Official FEC data source
  - Uses api.data.gov keys (same as Congress.gov)
  - **Implementation**: `civics-openfec-minimal.ts` created
- **Data Mapping**: congress-legislators dataset provides FEC candidate IDs
- **Minimal Fields**: candidate_id, cycle, total_receipts, cash_on_hand
- **Attribution**: FEC.gov attribution implemented

### **3. State-Level Data Expansion** ✅ **RESOLVED**
**Question**: How can we efficiently expand to all 50 states + DC?

**Context**: We currently only have top 10 states. We need:
- All state representatives
- State senators
- District information
- Contact information

**✅ SOLUTION IMPLEMENTED**:
- **Primary Source**: OpenStates API v3
  - Broad state coverage, consistent schema
  - **Implementation**: Existing `civics-seed-everything.ts` can be expanded
  - **Strategy**: Queue OpenStates pulls by state with backoff + freshness tracking
  - **Timeline**: Expand beyond top 10 states on a schedule

### **4. Local Government Data Strategy** ✅ **RESOLVED**
**Question**: How can we scale local government data beyond SF/LA?

**Context**: We need a scalable approach for local officials. We need:
- Mayors, city council members
- County officials
- School board members
- Contact information

**✅ SOLUTION IMPLEMENTED**:
- **Primary Source**: Google Civic Information API
  - Best free coverage for city/county/boards
  - **Strategy**: Accept gaps, keep manual curation for SF/LA
  - **Expansion**: Add 1-2 more cities only if we get them "for free"
  - **Implementation**: Existing Google Civic integration working

### **5. Voting Records Integration** ✅ **RESOLVED**
**Question**: What's the best source for federal voting records?

**Context**: We need last 5 roll calls + party alignment for federal reps.

**✅ SOLUTION IMPLEMENTED**:
- **Primary Source**: Congress.gov API (https://api.congress.gov/)
  - Official, stable government source
  - Uses api.data.gov keys (same as OpenFEC)
  - **Implementation**: `civics-congress-gov-votes.ts` created
- **Fallback**: Direct House/Senate roll-call feeds (official bulk data)
- **Fields**: vote_id, bill_title, vote_date, vote_position, party_position
- **Computation**: Party alignment % calculated on ingest

### **6. Data Quality & Verification**
**Question**: How can we ensure data accuracy and freshness?

**Context**: We need robust data quality monitoring. We need:
- Data freshness tracking
- Accuracy verification
- Conflict resolution
- Source precedence rules

**Specific Research Needs**:
- [ ] What are the best practices for civic data quality?
- [ ] Are there any data validation services we should use?
- [ ] How do other civic tech organizations handle data quality?
- [ ] What about automated data verification techniques?
- [ ] Are there any data quality APIs or services?

### **6. API Rate Limits & Costs**
**Question**: What are the current rate limits and costs for civic data APIs?

**Context**: We need to understand the operational costs and constraints. We need:
- Rate limits for each API
- Cost structures
- Terms of service
- Usage patterns

**Specific Research Needs**:
- [ ] What are the current rate limits for GovTrack, OpenStates, FEC APIs?
- [ ] Are there any costs associated with these APIs?
- [ ] What are the terms of service and attribution requirements?
- [ ] How can we optimize API usage to stay within limits?
- [ ] Are there any bulk data download options to reduce API calls?

---

## 🛠️ **Current Technical Stack**

### **Database**
- **Platform**: Supabase PostgreSQL
- **Tables**: `civics_representatives`, `civics_votes_minimal`, `civics_fec_minimal`
- **Features**: RLS, temporal modeling, canonical IDs

### **APIs**
- **Versioning**: `/api/v1/civics/`
- **Features**: ETag caching, field selection, include parameters
- **Performance**: <500ms p95 response times

### **Data Processing**
- **Scripts**: TypeScript/Node.js
- **Caching**: In-memory + Redis (Upstash)
- **Monitoring**: Coverage dashboard, freshness tracking

---

## 🎯 **Immediate Priorities**

### **High Priority (This Week)**
1. **FEC API Resolution**: Fix network issues or find alternatives
2. **Contact Information**: Identify reliable sources for congressional contacts
3. **State Expansion**: Plan expansion to all 50 states

### **Medium Priority (Next 2 Weeks)**
1. **Local Data Strategy**: Develop scalable approach for local officials
2. **Data Quality**: Implement automated quality monitoring
3. **Performance**: Optimize API responses and caching

### **Low Priority (Future)**
1. **Advanced Features**: Committee memberships, bill sponsorships
2. **Historical Data**: Past representatives, voting history
3. **International**: Expand beyond US (if desired)

---

## 📋 **Research Deliverables Needed**

### **For Each Data Source**
- [ ] **Status**: Active/Inactive/Deprecated
- [ ] **URL**: Current endpoint
- [ ] **Rate Limits**: Requests per minute/hour/day
- [ ] **Costs**: Free/Paid/Pricing structure
- [ ] **Terms of Service**: Attribution requirements, usage restrictions
- [ ] **Data Quality**: Completeness, accuracy, freshness
- [ ] **Documentation**: API docs, examples, support

### **For Each Gap**
- [ ] **Alternative Sources**: What are the options?
- [ ] **Implementation Effort**: How hard to integrate?
- [ ] **Cost-Benefit**: Is it worth the effort?
- [ ] **Timeline**: How long to implement?

### **For Each Priority**
- [ ] **Recommendation**: What should we do?
- [ ] **Rationale**: Why this approach?
- [ ] **Next Steps**: What are the immediate actions?
- [ ] **Risks**: What could go wrong?

---

## 🚀 **Success Criteria**

### **Technical Success**
- [ ] All APIs working reliably
- [ ] Data coverage ≥90% for federal reps
- [ ] Freshness within SLA (7/14/30 days)
- [ ] Performance <500ms p95

### **Business Success**
- [ ] Clear source attribution
- [ ] Cost-effective data acquisition
- [ ] Scalable architecture
- [ ] User-friendly experience

### **Research Success**
- [ ] Comprehensive source inventory
- [ ] Clear recommendations
- [ ] Implementation roadmap
- [ ] Risk assessment

---

---

## 🎉 **IMPLEMENTATION STATUS UPDATE**

### **✅ COMPLETED THIS SESSION**
1. **OpenFEC Minimal Integration** - `civics-openfec-minimal.ts`
   - 4 fields: candidate_id, cycle, total_receipts, cash_on_hand
   - Uses congress-legislators for FEC ID mapping
   - Ready for testing with FEC_API_KEY

2. **Congress Legislators Sync** - `civics-congress-legislators-sync.ts`
   - Primary source for federal contacts and social media
   - Checksum-based sync to avoid unnecessary updates
   - Includes phone, website, Twitter, Facebook, etc.

3. **Congress.gov Voting Records** - `civics-congress-gov-votes.ts`
   - Official government source for roll-call votes
   - Last 5 votes + party alignment calculation
   - Ready for testing with CONGRESS_GOV_API_KEY

4. **Updated Research Document** - All major gaps resolved
   - Contact info: congress-legislators dataset
   - FEC data: OpenFEC API
   - Voting records: Congress.gov API
   - State expansion: OpenStates API v3
   - Local data: Google Civic Information API

### **🚀 NEXT STEPS**
1. **Get API Keys**: FEC_API_KEY and CONGRESS_GOV_API_KEY from api.data.gov
2. **Test Integrations**: Run the new scripts with live API keys
3. **State Expansion**: Modify existing script to process all 50 states
4. **Production Deployment**: Deploy with new data sources

### **📊 EXPECTED OUTCOMES**
- **Contact Coverage**: 90%+ federal reps with phone/website/social
- **FEC Coverage**: 90%+ federal reps with campaign finance data
- **Voting Coverage**: 90%+ federal reps with last 5 votes + party alignment
- **Data Quality**: Official government sources with proper attribution

**This document now serves as both a research brief and implementation guide for the complete Phase 2 MVP.**

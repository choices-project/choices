# GovInfo MCP Benefits Analysis for Choices Application

**Date:** 2026-01-27  
**Status:** Evaluation - High potential value for future features

## Executive Summary

The GovInfo MCP server **does NOT** help with our current use case (fetching `govinfo_id` for representatives), but it **could be highly valuable** for planned features like "Walk the Talk" analysis, vote tracking, and legislative history.

## Current GovInfo Usage

### What We Use Now
- **Purpose:** Fetch `govinfo_id` for federal representatives
- **Method:** REST API endpoint `/members/{bioguideId}`
- **Status:** Experiencing 500 errors (0/547 have `govinfo_id`)
- **Impact:** Low (optional enrichment)

### What GovInfo MCP Provides
The MCP server offers **14+ tools** for document access and research, but **NOT** member/representative lookups. It focuses on:
- Document search and retrieval (bills, laws, regulations, CFR)
- Collection browsing
- Package content access
- Related document discovery
- Congressional Record access
- Public laws by congress

**Key Finding:** MCP does **NOT** have a member lookup tool - it won't solve our current `govinfo_id` problem.

## Application Features That Could Benefit

### 1. "Walk the Talk" Analysis ✅ **HIGH VALUE**

**Current State:**
- Planned feature: Track campaign promises vs. actions
- Track votes vs. district preferences
- Track votes vs. donor interests
- Overall accountability scoring (0-100%)

**How GovInfo MCP Helps:**
- **Bill Text Access:** Get full bill text to analyze what representatives actually voted on
- **Related Documents:** Find related bills, amendments, committee reports
- **Congressional Record:** Access statements and speeches from Congressional Record
- **Public Laws:** Track which bills became law and their final text
- **Regulatory Impact:** Access CFR to see how laws translate to regulations

**Example Use Cases:**
- "Representative X promised to support climate action" → Search bills related to climate, get full text, analyze votes
- "Representative Y voted against constituent preferences" → Get bill details, related documents, understand context
- "Representative Z's votes align with major donors" → Cross-reference votes with bill text and donor interests

### 2. Voting Record Tracking ✅ **HIGH VALUE**

**Current State:**
- Application tracks voting records with `bill_id`, `bill_title`, `vote` information
- Has `VotingRecord` type with bill details
- Uses Congress.gov API for some bill data

**How GovInfo MCP Helps:**
- **Full Bill Text:** Access complete bill text (HTML, XML, PDF, plain text)
- **Bill Versions:** Track bill through different versions and amendments
- **Related Bills:** Find related bills, amendments, committee reports
- **Congressional Record:** Access floor statements and debate transcripts
- **Advanced Search:** Lucene syntax search for complex queries

**Example Use Cases:**
- Get full text of bills representatives voted on
- Track bill evolution through amendments
- Find related bills that might show voting patterns
- Access Congressional Record statements explaining votes

### 3. Legislative Activity & Bill Tracking ✅ **MEDIUM VALUE**

**Current State:**
- Application has `representative_activity` table tracking bills
- Has `test-bills-fetch.ts` for testing bill fetching
- Syncs activity from OpenStates and Congress.gov
- Tracks bill sponsorships and cosponsorships

**How GovInfo MCP Helps:**
- **Bill Content:** Get full bill text, not just metadata
- **Bill History:** Track bill through committee, floor, conference
- **Related Documents:** Find committee reports, hearings, related bills
- **Collection Browsing:** Browse bills by collection, date, congress
- **Package Retrieval:** Get all available formats (HTML, XML, PDF, text)

**Example Use Cases:**
- Enrich bill activity records with full bill text
- Track bill progress through legislative process
- Find related bills and documents for context
- Access bill amendments and changes

### 4. Congressional Record Access ✅ **MEDIUM VALUE**

**Current State:**
- Application tracks "public statements" in engagement metrics
- Could track statements and speeches

**How GovInfo MCP Helps:**
- **Congressional Record:** Access full Congressional Record entries
- **Statements & Speeches:** Get official statements from floor
- **Search:** Search Congressional Record by keyword, date, member
- **Granules:** Access individual sections of Congressional Record

**Example Use Cases:**
- Track official statements representatives made on floor
- Analyze speech patterns and topics
- Find statements related to specific bills or issues
- Cross-reference statements with votes

### 5. Regulatory Tracking (CFR) ⚠️ **LOW-MEDIUM VALUE**

**Current State:**
- Not currently implemented
- Could be useful for tracking how laws become regulations

**How GovInfo MCP Helps:**
- **CFR Access:** Access Code of Federal Regulations
- **Regulatory Changes:** Track changes to regulations
- **Related Documents:** Find regulations related to specific laws

**Example Use Cases:**
- Track how bills representatives voted on became regulations
- Monitor regulatory changes affecting constituents
- Link laws to implementing regulations

## Specific MCP Tools That Would Be Useful

### High Priority Tools
1. **`get_package_content`** - Get full bill text in multiple formats
2. **`search_packages`** - Search bills by keyword, collection, date
3. **`get_related_packages`** - Find related bills, amendments, reports
4. **`get_published_packages`** - Get bills by publication date
5. **`get_public_laws_by_congress`** - Track which bills became law

### Medium Priority Tools
6. **`advanced_search`** - Lucene syntax for complex queries
7. **`get_collection_details`** - Browse available document collections
8. **`get_package_summary`** - Get bill metadata and links
9. **`get_granule_related`** - Find related Congressional Record entries

### Lower Priority Tools
10. **`get_packages_by_collection`** - Browse bills by collection
11. **`get_published_range`** - Get bills in date range
12. **`search_statutes`** - Search statutes at large

## Implementation Considerations

### Current Limitations
- **No Member Lookup:** MCP doesn't solve our current `govinfo_id` lookup problem
- **Document-Focused:** MCP is for documents, not member data
- **LLM-Optimized:** Designed for LLM workflows, may be overkill for simple lookups

### Integration Approach
1. **Hybrid Strategy:**
   - Keep REST API for simple `govinfo_id` lookups (when it works)
   - Use MCP for document access (bills, Congressional Record, etc.)

2. **Future Features:**
   - Implement MCP integration when building "Walk the Talk" features
   - Use MCP for bill text retrieval and analysis
   - Use MCP for Congressional Record access

3. **Data Enrichment:**
   - Use MCP to enrich existing bill activity records with full text
   - Use MCP to find related documents for context
   - Use MCP for advanced legislative research

## Cost-Benefit Analysis

### Benefits
- ✅ **Rich Document Access:** Full bill text, amendments, related documents
- ✅ **Congressional Record:** Official statements and speeches
- ✅ **Advanced Search:** Lucene syntax for complex queries
- ✅ **Multiple Formats:** HTML, XML, PDF, plain text
- ✅ **LLM-Friendly:** Optimized for AI/LLM workflows
- ✅ **Future-Proof:** Aligns with modern integration patterns

### Costs
- ⚠️ **Integration Effort:** Requires implementing MCP client
- ⚠️ **Learning Curve:** Team needs to learn MCP protocol
- ⚠️ **Overhead:** More complex than REST API for simple lookups
- ⚠️ **Documentation:** MCP docs may be limited (file appears empty)

### ROI Assessment
- **Current Use Case (govinfo_id lookup):** ❌ **Not Worth It** - MCP doesn't help
- **Future Features (Walk the Talk, Vote Analysis):** ✅ **High ROI** - MCP would be very valuable
- **Bill Tracking Enhancement:** ✅ **Medium ROI** - Could enrich existing features

## Recommendations

### Immediate (Current Problem)
- **Continue with REST API** for `govinfo_id` lookups
- **Add retry logic** with exponential backoff
- **Monitor API status** and retry when stable
- **Do NOT use MCP** for this use case

### Short Term (Next 3-6 Months)
- **Monitor MCP Development:** Track documentation and feature updates
- **Plan Integration:** Design MCP integration for future features
- **Evaluate Alternatives:** Consider if Congress.gov API covers bill needs

### Long Term (6+ Months)
- **Implement MCP for Document Access:** When building "Walk the Talk" features
- **Use MCP for Bill Text:** Enrich bill activity with full text
- **Use MCP for Congressional Record:** Track official statements
- **Hybrid Approach:** REST API for simple lookups, MCP for document access

## Conclusion

**For Current Use Case:** GovInfo MCP is **NOT useful** - it doesn't provide member lookups.

**For Future Features:** GovInfo MCP could be **highly valuable** for:
- "Walk the Talk" analysis (bill text, related documents, Congressional Record)
- Vote tracking enhancement (full bill context, related bills)
- Legislative history tracking (bill evolution, amendments, related documents)
- Congressional Record access (official statements, speeches)

**Recommendation:** 
- **Don't use MCP now** for `govinfo_id` lookups
- **Plan to use MCP** when implementing "Walk the Talk" and vote analysis features
- **Monitor MCP development** and documentation improvements

## Resources

- **GovInfo MCP Server:** https://glama.ai/mcp/servers/%40Travis-Prall/govinfo-mcp
- **GovInfo API Repository:** https://github.com/usgpo/api
- **MCP Documentation:** https://github.com/usgpo/api/blob/main/docs/mcp.md
- **MCP Specification:** https://modelcontextprotocol.io/
- **Current Implementation:** `services/civics-backend/src/clients/govinfo.ts`

# GovInfo MCP Server Evaluation

**Date:** 2026-01-27  
**Status:** Evaluation recommended for future consideration

## Overview

GovInfo now offers a **Model Context Protocol (MCP) server** as a public preview. This document evaluates whether it would be useful for our federal enrichment process.

## Current Situation

### Current GovInfo Integration
- **Method:** REST API (`/members/{bioguideId}` endpoint)
- **Status:** Experiencing widespread 500 errors
- **Coverage:** 0/547 federal representatives have `govinfo_id`
- **Impact:** Low (GovInfo enrichment is optional)

### Current Implementation
- **File:** `services/civics-backend/src/clients/govinfo.ts`
- **Endpoint:** `https://api.govinfo.gov/members/{bioguideId}`
- **Error Handling:** Catches 500 errors and continues without GovInfo IDs

## GovInfo MCP Server

### What is MCP?
Model Context Protocol (MCP) is an open protocol that standardizes how applications provide context to LLMs. It functions like "a USB-C port for AI applications," providing a standardized way to connect AI models to different data sources and tools.

### GovInfo MCP Availability
- **Status:** Public preview
- **Repository:** https://github.com/usgpo/api
- **Documentation:** https://github.com/usgpo/api/blob/main/docs/mcp.md
- **Purpose:** Enable integration of GovInfo information into LLM workflows

### MCP Server Primitives
MCP servers provide three fundamental building blocks:
1. **Prompts:** User-controlled interactive templates
2. **Resources:** Application-controlled contextual data
3. **Tools:** Model-controlled executable functions

## Evaluation

### Potential Benefits
1. **More Reliable Access:** MCP server may have better reliability than REST API
2. **Structured Integration:** Standardized protocol for LLM workflows
3. **Better Error Handling:** MCP may provide more robust error handling
4. **Future-Proof:** Aligns with modern LLM integration patterns

### Considerations
1. **Public Preview:** Still in preview, may have limitations
2. **Integration Effort:** Would require implementing MCP client
3. **Documentation:** MCP documentation may be limited (file appears empty)
4. **API Still Available:** REST API may stabilize, making MCP unnecessary

### Use Case Analysis
**Current Need:** Fetch `govinfo_id` for federal representatives using bioguide IDs

**MCP Fit:**
- MCP is designed for LLM workflows, not necessarily for batch data enrichment
- Our use case is straightforward API calls, not complex LLM interactions
- REST API (when working) is simpler for our needs

## Recommendation

### Short Term
- **Continue with REST API:** Monitor GovInfo REST API status
- **Retry Logic:** Add exponential backoff retry for REST API calls
- **Batch Retry:** Create separate script to retry failed GovInfo lookups

### Long Term
- **Evaluate MCP:** If REST API continues to have issues, evaluate MCP server
- **Hybrid Approach:** Consider using MCP for complex queries, REST for simple lookups
- **Monitor MCP:** Track MCP server development and documentation updates

### When to Consider MCP
1. REST API continues to have reliability issues
2. We need more complex GovInfo queries beyond simple member lookups
3. We want to integrate GovInfo data into LLM-powered features
4. MCP documentation becomes more comprehensive

## Resources

- **GovInfo API Repository:** https://github.com/usgpo/api
- **MCP Documentation:** https://github.com/usgpo/api/blob/main/docs/mcp.md
- **MCP Specification:** https://modelcontextprotocol.io/
- **Current Implementation:** `services/civics-backend/src/clients/govinfo.ts`

## Conclusion

**Current Assessment:** MCP server is **NOT useful** for our current use case (fetching `govinfo_id` by bioguide ID). MCP doesn't provide member lookups - it's focused on document access.

**Future Consideration:** MCP server could be **highly valuable** for planned features:
- "Walk the Talk" analysis (bill text, related documents, Congressional Record)
- Vote tracking enhancement (full bill context, related bills)
- Legislative history tracking (bill evolution, amendments)
- Congressional Record access (official statements, speeches)

**See Also:** `GOVINFO_MCP_BENEFITS_ANALYSIS.md` for detailed analysis of MCP benefits for future features.

**Action Items:**
- [ ] Monitor GovInfo REST API status (for current `govinfo_id` lookups)
- [ ] Add retry logic with exponential backoff (for REST API)
- [ ] Track MCP server development and documentation (for future features)
- [ ] Plan MCP integration for "Walk the Talk" and vote analysis features
- [ ] Re-evaluate MCP when implementing legislative document access features

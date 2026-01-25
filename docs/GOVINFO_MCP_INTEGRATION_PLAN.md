# GovInfo MCP Integration Plan for FEC & Financial Transparency

**Date:** 2026-01-25  
**Status:** 📋 Planning - Ready for Implementation

## Executive Summary

GovInfo MCP provides powerful document access capabilities that can significantly enhance our FEC service and financial transparency system. While it doesn't help with basic member lookups, it's **highly valuable** for connecting campaign finance data to actual legislative actions, bills, and votes.

## Current State

### Existing Services
1. **FEC Service** (`web/lib/civics/fec-service.ts`)
   - Campaign finance data (contributions, disbursements, independent expenditures)
   - Independence scoring
   - Committee tracking
   - Cycle management

2. **Financial Transparency System** (`web/lib/electoral/financial-transparency.ts`)
   - Financial influence dashboards
   - "Bought off" indicators
   - Issue influence analysis
   - Revolving door tracking
   - Corporate influence mapping

### Current Limitations
- **No bill text access** - Can't see what representatives actually voted on
- **No Congressional Record** - Can't access official statements explaining votes
- **No legislative context** - Can't connect donations to specific bills
- **Limited vote analysis** - Only have vote metadata, not bill content

## GovInfo MCP Capabilities

### Available Tools (17 total)
- **Bill Content:** `packages_get_package_content` - Get full bill text (HTML, XML, PDF, text)
- **Bill Search:** `search_search_packages` - Search bills by keyword, date, congress
- **Related Documents:** `related_get_related_packages` - Find amendments, related bills
- **Congressional Record:** Search and access official statements
- **Public Laws:** `statutes_get_public_laws_by_congress` - Track enacted laws
- **Statutes:** `statutes_search_statutes` - Search US Code and statutes

## Integration Opportunities

### 1. Enhanced Issue Influence Analysis ⭐ **HIGH VALUE**

**Current State:**
```typescript
// financial-transparency.ts - analyzeIssueInfluence()
// Gets campaign finance data and voting records
// But can't see what bills were actually about
```

**With GovInfo MCP:**
```typescript
async analyzeIssueInfluence(candidateId: string, issue: string): Promise<InfluenceAnalysis> {
  // 1. Get campaign finance data (existing)
  const campaignFinance = await this.orchestrator.getCampaignFinance(candidateId, 2024);
  
  // 2. Get voting record (existing)
  const votes = await this.orchestrator.getVotingRecord(candidateId);
  
  // 3. NEW: Get bill text for each vote
  const votesWithBillText = await Promise.all(
    votes.map(async (vote) => {
      if (vote.billId) {
        const billContent = await call_mcp_tool({
          server: "project-0-Choices-govinfo",
          toolName: "packages_get_package_content",
          arguments: {
            package_id: vote.billId, // e.g., "BILLS-119hr1234-ih"
            content_type: "html"
          }
        });
        
        // Extract key provisions related to issue
        const issueRelevance = extractIssueRelevance(billContent, issue);
        
        return {
          ...vote,
          billText: billContent,
          issueRelevance,
          keyProvisions: extractKeyProvisions(billContent, issue)
        };
      }
      return vote;
    })
  );
  
  // 4. NEW: Find related bills that donors care about
  const donorRelatedBills = await Promise.all(
    campaignFinance.topContributors.map(async (contributor) => {
      const relatedBills = await call_mcp_tool({
        server: "project-0-Choices-govinfo",
        toolName: "search_search_packages",
        arguments: {
          query: `${contributor.industry} ${issue}`,
          collection: "BILLS",
          page_size: 10
        }
      });
      
      return {
        contributor,
        relatedBills: relatedBills.packages || []
      };
    })
  );
  
  // 5. Enhanced analysis with bill context
  return {
    candidateId,
    issue,
    industryContributions,
    topContributors: campaignFinance.topContributors.map(c => ({
      ...c,
      relatedBills: donorRelatedBills.find(d => d.contributor.name === c.name)?.relatedBills || []
    })),
    votesOnIssue: votesWithBillText.map(v => ({
      voteId: v.voteId,
      vote: v.vote,
      billText: v.billText,
      issueRelevance: v.issueRelevance,
      keyProvisions: v.keyProvisions,
      contributorAlignment: calculateAlignment(v, campaignFinance.topContributors)
    })),
    influenceScore,
    correlationStrength,
    lastUpdated: new Date().toISOString()
  };
}
```

**Benefits:**
- See actual bill text representatives voted on
- Identify key provisions related to donor interests
- Calculate more accurate influence scores with bill context
- Show users what bills donors care about

### 2. "Walk the Talk" Analysis ⭐ **HIGH VALUE**

**Current State:**
- Track campaign promises
- Track votes
- But can't compare promises to actual bill content

**With GovInfo MCP:**
```typescript
async analyzePromiseFulfillment(
  candidateId: string,
  promise: { issue: string; position: string; billIds?: string[] }
): Promise<PromiseFulfillmentAnalysis> {
  // 1. Search for bills related to promise
  const relatedBills = await call_mcp_tool({
    server: "project-0-Choices-govinfo",
    toolName: "search_search_packages",
    arguments: {
      query: promise.issue,
      collection: "BILLS",
      start_date: promise.campaignDate,
      page_size: 20
    }
  });
  
  // 2. Get full text of bills candidate voted on
  const billsWithText = await Promise.all(
    (promise.billIds || []).map(async (billId) => {
      const content = await call_mcp_tool({
        server: "project-0-Choices-govinfo",
        toolName: "packages_get_package_content",
        arguments: {
          package_id: billId,
          content_type: "html"
        }
      });
      
      return {
        billId,
        content,
        alignment: analyzeAlignment(content, promise.position)
      };
    })
  );
  
  // 3. Get Congressional Record statements
  const statements = await call_mcp_tool({
    server: "project-0-Choices-govinfo",
    toolName: "search_search_packages",
    arguments: {
      query: `${candidateId} ${promise.issue}`,
      collection: "CREC", // Congressional Record
      page_size: 10
    }
  });
  
  return {
    promise,
    relatedBills: relatedBills.packages || [],
    billsWithText,
    statements: statements.packages || [],
    fulfillmentScore: calculateFulfillmentScore(billsWithText, promise.position),
    alignment: calculateOverallAlignment(billsWithText, statements)
  };
}
```

**Benefits:**
- Compare campaign promises to actual bill text
- Find official statements in Congressional Record
- Calculate accurate fulfillment scores
- Show users exactly how promises were kept/broken

### 3. Enhanced Vote Analysis ⭐ **MEDIUM-HIGH VALUE**

**Current State:**
- Have vote metadata (yes/no/abstain)
- Know bill titles
- But can't see bill content or context

**With GovInfo MCP:**
```typescript
async enrichVoteWithContext(vote: Vote): Promise<EnrichedVote> {
  if (!vote.billId) return vote;
  
  // 1. Get full bill text
  const billContent = await call_mcp_tool({
    server: "project-0-Choices-govinfo",
    toolName: "packages_get_package_content",
    arguments: {
      package_id: vote.billId,
      content_type: "html"
    }
  });
  
  // 2. Get related bills (amendments, related legislation)
  const relatedBills = await call_mcp_tool({
    server: "project-0-Choices-govinfo",
    toolName: "related_get_related_packages",
    arguments: {
      package_id: vote.billId
    }
  });
  
  // 3. Get Congressional Record statements about this vote
  const statements = await call_mcp_tool({
    server: "project-0-Choices-govinfo",
    toolName: "search_search_packages",
    arguments: {
      query: vote.billId,
      collection: "CREC",
      page_size: 5
    }
  });
  
  return {
    ...vote,
    billText: billContent,
    billSummary: extractSummary(billContent),
    keyProvisions: extractKeyProvisions(billContent),
    relatedBills: relatedBills.packages || [],
    statements: statements.packages || [],
    context: {
      billType: extractBillType(billContent),
      primarySponsor: extractSponsor(billContent),
      committee: extractCommittee(billContent),
      status: extractStatus(billContent)
    }
  };
}
```

**Benefits:**
- Full bill context for every vote
- Related bills and amendments
- Official statements explaining votes
- Better understanding of vote significance

### 4. Donor-Bill Correlation Analysis ⭐ **HIGH VALUE**

**Current State:**
- Know who donated
- Know how candidate voted
- But can't connect donations to specific bill provisions

**With GovInfo MCP:**
```typescript
async analyzeDonorBillCorrelation(
  candidateId: string,
  cycle: number
): Promise<DonorBillCorrelation[]> {
  // 1. Get top contributors
  const contributions = await fecService.getCandidateContributions(candidateId, cycle, {
    limit: 50,
    minAmount: 1000
  });
  
  // 2. Get candidate's votes
  const votes = await this.orchestrator.getVotingRecord(candidateId);
  
  // 3. For each major contributor, find related bills
  const correlations = await Promise.all(
    contributions.map(async (contrib) => {
      // Search for bills related to contributor's industry
      const industryBills = await call_mcp_tool({
        server: "project-0-Choices-govinfo",
        toolName: "search_search_packages",
        arguments: {
          query: `${contrib.contributor_industry || contrib.contributor_employer} regulation`,
          collection: "BILLS",
          page_size: 20
        }
      });
      
      // Get bill text and analyze alignment
      const billsWithAlignment = await Promise.all(
        (industryBills.packages || []).slice(0, 10).map(async (pkg) => {
          const content = await call_mcp_tool({
            server: "project-0-Choices-govinfo",
            toolName: "packages_get_package_content",
            arguments: {
              package_id: pkg.packageId,
              content_type: "html"
            }
          });
          
          // Check if candidate voted on this bill
          const vote = votes.find(v => v.billId === pkg.packageId);
          
          return {
            bill: pkg,
            billText: content,
            vote: vote?.vote,
            alignment: calculateAlignment(content, contrib.contributor_industry),
            correlation: vote ? calculateCorrelation(contrib.amount, vote.vote, content) : null
          };
        })
      );
      
      return {
        contributor: contrib,
        relatedBills: billsWithAlignment,
        correlationScore: calculateOverallCorrelation(billsWithAlignment, contrib.amount)
      };
    })
  );
  
  return correlations.sort((a, b) => b.correlationScore - a.correlationScore);
}
```

**Benefits:**
- Direct connection between donations and bill provisions
- Show which bills align with donor interests
- Calculate correlation scores
- Transparency: "Donor X gave $Y, candidate voted on bills Z that benefit donor's industry"

### 5. Financial Transparency Dashboard Enhancement ⭐ **MEDIUM VALUE**

**Current State:**
- Financial breakdown
- Top contributors
- Independence scores
- But limited context on what money influenced

**With GovInfo MCP:**
```typescript
async generateEnhancedFinancialDashboard(
  candidateId: string,
  cycle: number
): Promise<EnhancedFinancialDashboard> {
  // 1. Get existing financial data
  const dashboard = await this.generateFinancialDashboard(candidateId, cycle);
  
  // 2. For each top contributor, find related bills
  const contributorBillAnalysis = await Promise.all(
    dashboard.topContributors.map(async (contributor) => {
      const bills = await call_mcp_tool({
        server: "project-0-Choices-govinfo",
        toolName: "search_search_packages",
        arguments: {
          query: `${contributor.industry} ${contributor.name}`,
          collection: "BILLS",
          page_size: 10
        }
      });
      
      return {
        contributor,
        relatedBills: bills.packages || [],
        billCount: (bills.packages || []).length
      };
    })
  );
  
  // 3. Get votes on bills related to top contributors
  const votes = await this.orchestrator.getVotingRecord(candidateId);
  const relevantVotes = await Promise.all(
    votes
      .filter(v => v.billId)
      .slice(0, 20)
      .map(async (vote) => {
        const content = await call_mcp_tool({
          server: "project-0-Choices-govinfo",
          toolName: "packages_get_package_content",
          arguments: {
            package_id: vote.billId!,
            content_type: "html"
          }
        });
        
        // Check if any top contributors have interest in this bill
        const contributorInterests = contributorBillAnalysis
          .filter(c => c.relatedBills.some(b => b.packageId === vote.billId))
          .map(c => c.contributor);
        
        return {
          vote,
          billText: content,
          contributorInterests,
          hasContributorInterest: contributorInterests.length > 0
        };
      })
  );
  
  return {
    ...dashboard,
    contributorBillAnalysis,
    relevantVotes,
    transparencyMetrics: {
      ...dashboard.influenceAnalysis,
      billsWithContributorInterest: relevantVotes.filter(v => v.hasContributorInterest).length,
      contributorBillCorrelation: calculateCorrelation(contributorBillAnalysis, relevantVotes)
    }
  };
}
```

**Benefits:**
- Show which bills top contributors care about
- Highlight votes on bills with contributor interest
- Enhanced transparency metrics
- Better "bought off" indicators

## Implementation Plan

### Phase 1: Foundation (Week 1-2)
1. **Create GovInfo MCP Service Wrapper**
   ```typescript
   // web/lib/services/govinfo-mcp-service.ts
   export class GovInfoMCPService {
     async getBillContent(packageId: string, format: 'html' | 'xml' | 'text' = 'html')
     async searchBills(query: string, filters: BillSearchFilters)
     async getRelatedBills(packageId: string)
     async searchCongressionalRecord(query: string, filters: RecordSearchFilters)
   }
   ```

2. **Add to Financial Transparency System**
   - Integrate GovInfo MCP service
   - Add bill text fetching to issue influence analysis
   - Add related bill search

### Phase 2: Enhanced Analysis (Week 3-4)
1. **Enhance Issue Influence Analysis**
   - Get bill text for votes
   - Extract issue-relevant provisions
   - Calculate alignment with donor interests

2. **Add Donor-Bill Correlation**
   - Search bills by contributor industry
   - Analyze correlation between donations and votes
   - Generate correlation scores

### Phase 3: "Walk the Talk" (Week 5-6)
1. **Promise Tracking Enhancement**
   - Search bills related to promises
   - Get bill text for analysis
   - Calculate fulfillment scores

2. **Congressional Record Integration**
   - Search for official statements
   - Extract position statements
   - Compare to votes

### Phase 4: Dashboard Enhancement (Week 7-8)
1. **Enhanced Financial Dashboard**
   - Add bill context to contributor analysis
   - Show votes on bills with contributor interest
   - Enhanced transparency metrics

2. **UI Integration**
   - Display bill text excerpts
   - Show related bills
   - Link to full documents

## Technical Considerations

### Rate Limits
- GovInfo API: Not documented, but likely similar to other government APIs
- **Strategy:** Cache bill content aggressively
- **Strategy:** Batch requests where possible
- **Strategy:** Use package summaries first, then fetch content

### Caching Strategy
```typescript
// Cache bill content in database
interface CachedBillContent {
  package_id: string;
  content_type: 'html' | 'xml' | 'text';
  content: string;
  cached_at: Date;
  expires_at: Date;
}

// Cache for 30 days (bills don't change after publication)
// Invalidate on demand if needed
```

### Error Handling
- GovInfo MCP may return 400 for unavailable formats
- Always check package summary first
- Fallback to HTML if preferred format unavailable
- Graceful degradation if MCP unavailable

### Performance
- Bill content can be large (100KB+)
- **Strategy:** Extract summaries and key provisions
- **Strategy:** Lazy load full content
- **Strategy:** Use HTML format (most available, smaller than PDF)

## Example Integration Code

### Enhanced FEC Service Method
```typescript
// web/lib/civics/fec-service.ts

import { call_mcp_tool } from '@/lib/mcp/client';

export class FECService {
  // ... existing methods ...
  
  /**
   * Get bill context for a vote
   */
  async getBillContextForVote(billId: string): Promise<BillContext | null> {
    try {
      // Get bill summary first
      const summary = await call_mcp_tool({
        server: "project-0-Choices-govinfo",
        toolName: "packages_get_package_summary",
        arguments: { package_id: billId }
      });
      
      // Get bill content
      const content = await call_mcp_tool({
        server: "project-0-Choices-govinfo",
        toolName: "packages_get_package_content",
        arguments: {
          package_id: billId,
          content_type: "html"
        }
      });
      
      // Get related bills
      const related = await call_mcp_tool({
        server: "project-0-Choices-govinfo",
        toolName: "related_get_related_packages",
        arguments: { package_id: billId }
      });
      
      return {
        billId,
        summary: summary.result,
        content: content.result,
        relatedBills: related.result?.packages || [],
        keyProvisions: extractKeyProvisions(content.result),
        summary: extractSummary(content.result)
      };
    } catch (error) {
      logger.warn('Failed to get bill context', { billId, error });
      return null; // Graceful degradation
    }
  }
}
```

### Enhanced Financial Transparency Method
```typescript
// web/lib/electoral/financial-transparency.ts

import { call_mcp_tool } from '@/lib/mcp/client';
import { fecService } from '@/lib/civics/fec-service';

export class FinancialTransparencySystem {
  // ... existing methods ...
  
  /**
   * Enhanced issue influence with bill text
   */
  async analyzeIssueInfluenceWithBills(
    candidateId: string,
    issue: string
  ): Promise<EnhancedInfluenceAnalysis> {
    // Get existing analysis
    const baseAnalysis = await this.analyzeIssueInfluence(candidateId, issue);
    
    // Enhance with bill text
    const votesWithBills = await Promise.all(
      baseAnalysis.votesOnIssue.map(async (vote) => {
        if (vote.voteId && vote.voteId.startsWith('BILLS-')) {
          const billContext = await fecService.getBillContextForVote(vote.voteId);
          
          return {
            ...vote,
            billContext,
            issueRelevance: billContext 
              ? calculateIssueRelevance(billContext.content, issue)
              : null
          };
        }
        return vote;
      })
    );
    
    return {
      ...baseAnalysis,
      votesOnIssue: votesWithBills,
      enhancedMetrics: {
        billsWithIssueRelevance: votesWithBills.filter(v => v.issueRelevance !== null).length,
        averageIssueRelevance: calculateAverageRelevance(votesWithBills),
        topRelevantBills: votesWithBills
          .filter(v => v.issueRelevance !== null)
          .sort((a, b) => (b.issueRelevance || 0) - (a.issueRelevance || 0))
          .slice(0, 5)
      }
    };
  }
}
```

## Benefits Summary

### For Users
- **Transparency:** See what bills representatives actually voted on
- **Context:** Understand vote significance with full bill text
- **Accountability:** Connect donations to specific legislative actions
- **Education:** Learn about bills and their provisions

### For Platform
- **Differentiation:** Unique feature combining finance + legislation
- **Trust:** Enhanced transparency builds user trust
- **Engagement:** More context = more user engagement
- **Value:** High-value feature for civic engagement

### For Analysis
- **Accuracy:** More accurate influence scores with bill context
- **Completeness:** Full picture of representative actions
- **Correlation:** Better donor-vote correlation analysis
- **Fulfillment:** Accurate promise fulfillment tracking

## Next Steps

1. **Review & Approve Plan** - Get stakeholder buy-in
2. **Set Up GovInfo MCP Client** - Create service wrapper
3. **Design Database Schema** - Plan caching strategy
4. **Implement Phase 1** - Foundation and basic integration
5. **Test & Iterate** - Validate with real data
6. **Deploy & Monitor** - Roll out gradually

## Conclusion

GovInfo MCP is **highly valuable** for enhancing our FEC and financial transparency services. It provides the missing piece - actual legislative content - that connects campaign finance data to real-world impact. The integration will significantly enhance our "Walk the Talk" analysis, issue influence tracking, and overall transparency features.

**Recommendation:** Proceed with implementation, starting with Phase 1 (Foundation) to validate the approach before full integration.

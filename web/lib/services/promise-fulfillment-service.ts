/**
 * Promise Fulfillment Analysis Service
 * 
 * Analyzes how well representatives fulfill campaign promises by comparing
 * promises to actual votes and bill text using GovInfo MCP
 * 
 * ⚠️ SERVER-ONLY: This service MUST only be used in API routes and server actions.
 * It uses GovInfo MCP which is server-only.
 * 
 * Note: 'use server' directive removed - this is a service class, not a server action.
 * Runtime checks ensure server-only usage.
 * 
 * @author Choices Platform Team
 * @date 2026-01-25
 */

import { govInfoMCPService, type BillPackage } from './govinfo-mcp-service';
import { logger } from '@/lib/utils/logger';
import { createUnifiedDataOrchestrator } from '@/lib/integrations/unified-orchestrator';

// Runtime assertion to prevent client-side usage
function assertServerOnly() {
  if (typeof window !== 'undefined') {
    throw new Error(
      'Promise Fulfillment Service is server-only and cannot be used in client components. ' +
      'Use API routes or server actions instead.'
    );
  }
}

export type CampaignPromise = {
  id: string;
  candidateId: string;
  issue: string;
  position: string; // 'support' | 'oppose' | 'neutral'
  description?: string;
  campaignDate: string;
  billIds?: string[];
  source?: string;
};

export type PromiseFulfillmentAnalysis = {
  promise: CampaignPromise;
  relatedBills: Array<{
    packageId: string;
    title: string;
    lastModified: string;
  }>;
  billsWithText: Array<{
    billId: string;
    content: string;
    alignment: number; // -100 to +100
    keyProvisions?: string[];
  }>;
  statements: Array<{
    packageId: string;
    title: string;
    lastModified: string;
  }>;
  fulfillmentScore: number; // 0-100
  alignment: number; // -100 to +100
  votes: Array<{
    voteId: string;
    vote: 'yes' | 'no' | 'abstain';
    billId?: string;
    alignment: number;
  }>;
  lastUpdated: string;
};

export type ConstituentWillAnalysis = {
  representativeId: string;
  billId: string;
  billTitle: string;
  pollResults: {
    pollId: string;
    pollTitle: string;
    totalVotes: number;
    constituentPreference: 'yes' | 'no' | 'abstain' | 'mixed';
    percentageYes: number;
    percentageNo: number;
    percentageAbstain: number;
  };
  actualVote: {
    vote: 'yes' | 'no' | 'abstain' | 'not_voted';
    date?: string;
    alignment: number; // -100 to +100, negative = misaligned
  };
  billContext: {
    summary?: string;
    keyProvisions?: string[];
    relatedBills?: string[];
  };
  accountabilityScore: number; // 0-100, higher = more aligned with constituents
  lastUpdated: string;
};

export class PromiseFulfillmentService {
  private orchestrator: ReturnType<typeof createUnifiedDataOrchestrator>;

  constructor() {
    this.orchestrator = createUnifiedDataOrchestrator();
  }

  /**
   * Analyze promise fulfillment by comparing promises to actual votes and bill text
   */
  async analyzePromiseFulfillment(
    promise: CampaignPromise
  ): Promise<PromiseFulfillmentAnalysis> {
    assertServerOnly();
    try {
      logger.info('Analyzing promise fulfillment', { 
        candidateId: promise.candidateId, 
        issue: promise.issue 
      });

      // 1. Search for bills related to promise
      const relatedBillsResult = await govInfoMCPService.searchBills(
        promise.issue,
        {
          collection: 'BILLS',
          start_date: promise.campaignDate,
          page_size: 20
        }
      );

      // 2. Get full text of bills candidate voted on (if billIds provided)
      const billsWithText = await Promise.all(
        (promise.billIds || []).map(async (billId) => {
          const content = await govInfoMCPService.getBillContent(billId, 'html');
          
          if (!content) {
            return null;
          }

          const alignment = this.analyzeAlignment(content.content, promise.position);

          return {
            billId,
            content: content.content,
            alignment,
            keyProvisions: this.extractKeyProvisions(content.content, promise.issue)
          };
        })
      );

      // Filter out null results
      const validBillsWithText = billsWithText.filter(
        (bill): bill is NonNullable<typeof bill> => bill !== null
      );

      // 3. Get Congressional Record statements
      const statementsResult = await govInfoMCPService.searchCongressionalRecord(
        `${promise.candidateId} ${promise.issue}`,
        {
          start_date: promise.campaignDate,
          page_size: 10
        }
      );

      // 4. Get voting record
      const votes = await this.orchestrator.getVotingRecord(promise.candidateId);
      const relevantVotes = votes
        .filter((v: any) => {
          // Match votes to bills related to promise
          if (!v.billId) return false;
          return promise.billIds?.includes(v.billId) || 
                 relatedBillsResult.packages.some((b: BillPackage) => b.packageId === v.billId);
        })
        .map((v: any) => ({
          voteId: String(v.id || ''),
          vote: (v.vote || 'abstain') as 'yes' | 'no' | 'abstain',
          billId: v.billId,
          alignment: this.calculateVoteAlignment(v.vote || 'abstain', promise.position)
        }));

      // 5. Calculate fulfillment score
      const fulfillmentScore = this.calculateFulfillmentScore(
        validBillsWithText,
        relevantVotes,
        promise.position
      );

      // 6. Calculate overall alignment
      const alignment = this.calculateOverallAlignment(
        validBillsWithText,
        relevantVotes
      );

      return {
        promise,
        relatedBills: relatedBillsResult.packages.map(pkg => ({
          packageId: pkg.packageId,
          title: pkg.title,
          lastModified: pkg.lastModified
        })),
        billsWithText: validBillsWithText,
        statements: statementsResult.packages.map(pkg => ({
          packageId: pkg.packageId,
          title: pkg.title,
          lastModified: pkg.lastModified
        })),
        fulfillmentScore,
        alignment,
        votes: relevantVotes,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to analyze promise fulfillment', { 
        promise, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw new Error(`Failed to analyze promise fulfillment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Compare constituent poll results to actual representative vote
   * This is the key feature: showing how the will of the people compares to actual votes
   */
  async analyzeConstituentWill(
    representativeId: string,
    billId: string,
    pollId: string
  ): Promise<ConstituentWillAnalysis> {
    assertServerOnly();
    try {
      logger.info('Analyzing constituent will vs actual vote', { 
        representativeId, 
        billId, 
        pollId 
      });

      // 1. Get poll results (need to fetch from database)
      const pollResults = await this.getPollResults(pollId);
      
      // 2. Get actual vote
      const votes = await this.orchestrator.getVotingRecord(representativeId);
      const actualVote = votes.find((v: any) => v.billId === billId);

      // 3. Get bill context
      const billContent = await govInfoMCPService.getBillContent(billId, 'html');
      const billSummary = await govInfoMCPService.getPackageSummary(billId);
      const relatedBills = await govInfoMCPService.getRelatedBills(billId);

      // 4. Calculate constituent preference from poll
      const constituentPreference = this.calculateConstituentPreference(pollResults);
      
      // 5. Calculate alignment
      const actualVoteValue = (actualVote?.vote as string) || 'not_voted';
      const alignment = this.calculateVoteAlignment(
        actualVoteValue === 'not_voting' ? 'not_voted' : actualVoteValue,
        constituentPreference
      );

      // 6. Calculate accountability score
      const accountabilityScore = this.calculateAccountabilityScore(
        constituentPreference,
        actualVoteValue === 'not_voting' ? 'not_voted' : (actualVoteValue as 'yes' | 'no' | 'abstain' | 'not_voted'),
        pollResults.totalVotes
      );

      return {
        representativeId,
        billId,
        billTitle: billSummary?.title || billId,
        pollResults: {
          pollId,
          pollTitle: pollResults.title,
          totalVotes: pollResults.totalVotes,
          constituentPreference,
          percentageYes: pollResults.percentageYes,
          percentageNo: pollResults.percentageNo,
          percentageAbstain: pollResults.percentageAbstain
        },
        actualVote: {
          vote: (actualVoteValue === 'not_voting' ? 'not_voted' : actualVoteValue) as 'yes' | 'no' | 'abstain' | 'not_voted',
          date: (actualVote as any)?.date,
          alignment
        },
        billContext: {
          summary: this.extractSummary(billContent?.content || ''),
          keyProvisions: billContent ? this.extractKeyProvisions(billContent.content, '') : undefined,
          relatedBills: relatedBills.map(b => b.packageId)
        },
        accountabilityScore,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to analyze constituent will', { 
        representativeId, 
        billId, 
        pollId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw new Error(`Failed to analyze constituent will: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods

  private analyzeAlignment(billText: string, position: string): number {
    // Simple keyword-based alignment analysis
    // In production, this would use NLP/AI for better analysis
    const supportKeywords = ['support', 'favor', 'endorse', 'back', 'advocate'];
    const opposeKeywords = ['oppose', 'against', 'reject', 'block', 'prevent'];
    
    const text = billText.toLowerCase();
    const positionLower = position.toLowerCase();
    
    if (positionLower.includes('support')) {
      const supportCount = supportKeywords.filter(kw => text.includes(kw)).length;
      const opposeCount = opposeKeywords.filter(kw => text.includes(kw)).length;
      return supportCount > opposeCount ? 50 + (supportCount * 10) : -50;
    } else if (positionLower.includes('oppose')) {
      const opposeCount = opposeKeywords.filter(kw => text.includes(kw)).length;
      const supportCount = supportKeywords.filter(kw => text.includes(kw)).length;
      return opposeCount > supportCount ? -50 - (opposeCount * 10) : 50;
    }
    
    return 0; // Neutral
  }

  private calculateVoteAlignment(
    vote: string,
    preference: string
  ): number {
    const voteLower = (vote || '').toLowerCase();
    const prefLower = (preference || '').toLowerCase();
    
    if (prefLower.includes('support')) {
      if (voteLower === 'yes') return 100;
      if (voteLower === 'no') return -100;
      return 0; // abstain
    } else if (prefLower.includes('oppose')) {
      if (voteLower === 'no') return 100;
      if (voteLower === 'yes') return -100;
      return 0; // abstain
    }
    
    return 0;
  }

  private calculateFulfillmentScore(
    billsWithText: Array<{ alignment: number }>,
    votes: Array<{ alignment: number }>,
    _position: string
  ): number {
    if (billsWithText.length === 0 && votes.length === 0) return 0;
    
    const billScore = billsWithText.length > 0
      ? billsWithText.reduce((sum, b) => sum + b.alignment, 0) / billsWithText.length
      : 0;
    
    const voteScore = votes.length > 0
      ? votes.reduce((sum, v) => sum + v.alignment, 0) / votes.length
      : 0;
    
    // Combine scores (weighted average)
    const combinedScore = (billScore * 0.6 + voteScore * 0.4);
    
    // Normalize to 0-100
    return Math.max(0, Math.min(100, (combinedScore + 100) / 2));
  }

  private calculateOverallAlignment(
    billsWithText: Array<{ alignment: number }>,
    votes: Array<{ alignment: number }>
  ): number {
    const allAlignments = [
      ...billsWithText.map(b => b.alignment),
      ...votes.map(v => v.alignment)
    ];
    
    if (allAlignments.length === 0) return 0;
    
    return allAlignments.reduce((sum, a) => sum + a, 0) / allAlignments.length;
  }

  private extractKeyProvisions(billText: string, issue: string): string[] {
    // Simple extraction - in production would use NLP
    const sentences = billText.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const issueLower = issue.toLowerCase();
    
    return sentences
      .filter(s => s.toLowerCase().includes(issueLower))
      .slice(0, 5)
      .map(s => s.trim());
  }

  private extractSummary(billText: string): string {
    // Extract first paragraph or first 500 characters
    const paragraphs = billText.split('\n\n').filter(p => p.trim().length > 50);
    if (paragraphs.length > 0) {
      return paragraphs[0].substring(0, 500);
    }
    return billText.substring(0, 500);
  }

  private async getPollResults(pollId: string): Promise<{
    title: string;
    totalVotes: number;
    percentageYes: number;
    percentageNo: number;
    percentageAbstain: number;
  }> {
    assertServerOnly();
    
    try {
      // Dynamic import to avoid client-side bundling
      const { getSupabaseServerClient } = await import('@/utils/supabase/server');
      const supabase = await getSupabaseServerClient();
      
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      // Get poll with options
      const { data: poll, error: pollError } = await supabase
        .from('polls')
        .select(`
          id, 
          title, 
          poll_options(id, text, option_text, order_index)
        `)
        .eq('id', pollId)
        .single();

      if (pollError || !poll) {
        throw new Error('Poll not found');
      }

      // Get votes for this poll
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('choice, option_id, poll_option_id')
        .eq('poll_id', pollId);

      if (votesError) {
        throw new Error(`Failed to get votes: ${votesError.message}`);
      }

      const totalVotes = votes?.length || 0;
      
      if (totalVotes === 0) {
        return {
          title: poll.title || 'Constituent Poll',
          totalVotes: 0,
          percentageYes: 0,
          percentageNo: 0,
          percentageAbstain: 0
        };
      }
      
      // For yes/no/abstain polls, we need to map options to these categories
      // Assuming poll has options like "Yes", "No", "Abstain" or similar
      const options = (poll.poll_options as Array<{ 
        id: string; 
        text?: string | null; 
        option_text?: string | null;
        order_index?: number | null;
      }>) || [];
      
      // Find yes/no/abstain options (case-insensitive matching)
      const yesOption = options.find(opt => {
        const text = (opt.text || opt.option_text || '').toLowerCase();
        return text.includes('yes') || text.includes('support') || text.includes('favor');
      });
      
      const noOption = options.find(opt => {
        const text = (opt.text || opt.option_text || '').toLowerCase();
        return text.includes('no') || text.includes('oppose') || text.includes('against');
      });
      
      const abstainOption = options.find(opt => {
        const text = (opt.text || opt.option_text || '').toLowerCase();
        return text.includes('abstain') || text.includes('neutral');
      });

      // Count votes by option_id
      // Votes table uses option_id to reference poll_options.id
      const yesVotes = votes?.filter((v: any) => {
        if (!yesOption) return false;
        // Match by option_id (can be string or number)
        return String(v.option_id) === String(yesOption.id) ||
               (v.rankings && Array.isArray(v.rankings) && v.rankings[0] === 0);
      }).length || 0;
      
      const noVotes = votes?.filter((v: any) => {
        if (!noOption) return false;
        return String(v.option_id) === String(noOption.id) ||
               (v.rankings && Array.isArray(v.rankings) && v.rankings[0] === 1);
      }).length || 0;
      
      const abstainVotes = votes?.filter((v: any) => {
        if (!abstainOption) return false;
        return String(v.option_id) === String(abstainOption.id) ||
               (v.rankings && Array.isArray(v.rankings) && v.rankings[0] === 2);
      }).length || 0;

      return {
        title: poll.title || 'Constituent Poll',
        totalVotes,
        percentageYes: totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0,
        percentageNo: totalVotes > 0 ? (noVotes / totalVotes) * 100 : 0,
        percentageAbstain: totalVotes > 0 ? (abstainVotes / totalVotes) * 100 : 0
      };
    } catch (error) {
      logger.error('Failed to get poll results', { 
        pollId, 
        error: error instanceof Error ? error.message : String(error) 
      });
      // Return empty results on error
      return {
        title: 'Constituent Poll',
        totalVotes: 0,
        percentageYes: 0,
        percentageNo: 0,
        percentageAbstain: 0
      };
    }
  }

  private calculateConstituentPreference(pollResults: {
    percentageYes: number;
    percentageNo: number;
    percentageAbstain: number;
  }): 'yes' | 'no' | 'abstain' | 'mixed' {
    const { percentageYes, percentageNo, percentageAbstain } = pollResults;
    
    if (percentageYes > percentageNo && percentageYes > percentageAbstain) {
      return 'yes';
    } else if (percentageNo > percentageYes && percentageNo > percentageAbstain) {
      return 'no';
    } else if (percentageAbstain > percentageYes && percentageAbstain > percentageNo) {
      return 'abstain';
    }
    
    return 'mixed';
  }

  private calculateAccountabilityScore(
    constituentPreference: 'yes' | 'no' | 'abstain' | 'mixed',
    actualVote: 'yes' | 'no' | 'abstain' | 'not_voted',
    totalVotes: number
  ): number {
    // Base score: alignment
    let score = 0;
    
    if (actualVote === 'not_voted') {
      return 0; // No vote = no accountability
    }
    
    if (constituentPreference === actualVote) {
      score = 100;
    } else if (constituentPreference === 'mixed') {
      score = 50; // Mixed preference = neutral
    } else {
      score = 0; // Misaligned
    }
    
    // Adjust based on participation (more votes = more weight)
    const participationFactor = Math.min(1, totalVotes / 1000); // Max at 1000 votes
    score = score * (0.7 + 0.3 * participationFactor);
    
    return Math.round(score);
  }
}

// Export singleton instance
export const promiseFulfillmentService = new PromiseFulfillmentService();

/**
 * Electoral Unified Types Bridge
 * 
 * Purpose: bridge legacy snake_case interfaces to the new unified shapes
 * Zero feature changes; types only.
 * 
 * @author Agent B
 * @date December 19, 2024
 */

import type { UnifiedCampaignFinance, UnifiedVote } from '@/lib/integrations/unified-orchestrator';

export type CampaignFinance = UnifiedCampaignFinance;
export type Vote = UnifiedVote;

export interface Representative {
  id: string
  name: string
  party: string
  office: string
  jurisdiction: string
  district?: string
  email?: string
  phone?: string
  website?: string
  socialMedia: Record<string, string>
  votingRecord: {
    totalVotes: number
    partyLineVotes: number
    constituentAlignment: number
    keyVotes: Array<{
      id: string
      billId: string
      billTitle: string
      question: string
      vote: string
      result: string
      date: string
      partyLineVote: boolean
      constituentAlignment: number
    }>
  }
  campaignFinance: CampaignFinance
  engagement: {
    responseRate: number
    averageResponseTime: number
    constituentQuestions: number
    publicStatements: number
  }
  walk_the_talk_score: {
    overall: number
    promise_fulfillment: number
    constituentAlignment: number
    financial_independence: number
  }
  recentActivity?: Activity[]
  platform?: string[]
}

export interface UserLocation {
  address?: string
  city?: string
  stateCode?: string
  zipCode?: string
  coordinates?: { lat: number; lng: number }
  federal: {
    house: { district: string; representative: string }
    senate: { senators: string[] }
  }
  state: {
    governor: string
    legislature: {
      house: { district: string; representative: string }
      senate: { district: string; representative: string }
    }
  }
  local: {
    county: { executive: string; commissioners: string[] }
    city: { mayor: string; council: string[] }
    school: { board: string[] }
  }
}

export interface ElectoralRace {
  raceId: string
  office: string
  jurisdiction: string
  electionDate: string
  incumbent: Representative
  challengers: Representative[]
  allCandidates: Candidate[]
  keyIssues: string[]
  campaignFinance: CampaignFinance
  pollingData?: unknown
  voterRegistrationDeadline: string
  earlyVotingStart: string
  absenteeBallotDeadline: string
  recentActivity: Activity[]
  constituentQuestions: number
  candidateResponses: number
  status: 'upcoming' | 'active' | 'completed'
  importance: 'high' | 'medium' | 'low'
}

export interface Candidate {
  id: string
  name: string
  party: string
  office: string
  jurisdiction: string
  district?: string
  campaign: {
    status: 'active' | 'suspended' | 'withdrawn'
    filingDate: string
    electionDate: string
    keyIssues: string[]
    platform: string[]
  }
  email?: string
  phone?: string
  website?: string
  socialMedia: Record<string, string>
  campaignFinance: CampaignFinance
  platform_access: {
    is_verified: boolean
    verification_method: 'gov_email' | 'filing_document' | 'manual_review'
    can_post: boolean
    can_respond: boolean
    can_engage: boolean
  }
  engagement: {
    posts: number
    responses: number
    constituentQuestions: number
    responseRate: number
  }
  platform?: string[]
}

export interface Activity {
  id: string
  type: 'vote' | 'statement' | 'event'
  title: string
  description: string
  date: string // ISO
  source: string
}

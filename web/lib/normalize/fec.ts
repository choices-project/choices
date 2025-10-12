/**
 * Phase 4: FEC Data Normalization
 * 
 * Wire → Model mappers for FEC API data
 * Normalizes external API types into strict internal model types
 */

import { isPresent } from '@/lib/utils/clean'
import { withOptional } from '@/lib/utils/objects'

// External API types (permissive)
export interface FECTotalsWire {
  cycle?: number | null
  total_receipts?: number | null
  cash_on_hand_end_period?: number | null
  total_disbursements?: number | null
  debts_owed_by_committee?: number | null
}

export interface FECContributionWire {
  contributor_id?: string | null
  contributor_name?: string | null
  contributor_type?: string | null
  amount?: number | null
  date?: string | null
  candidate_id?: string | null
  committee_id?: string | null
  election_cycle?: string | null
  industry?: string | null
}

// Internal model types (strict)
export interface FECMinimal {
  person_id: string
  fec_candidate_id: string
  election_cycle: number
  total_receipts?: number
  cash_on_hand?: number
  total_disbursements?: number
  debts_owed?: number
  data_source: 'fec_api'
}

export interface FECContributionModel {
  contributor_id: string
  contributor_name: string
  contributor_type: 'individual' | 'committee' | 'organization'
  amount: number
  date: string
  candidate_id: string
  committee_id: string
  election_cycle: string
  industry?: string
}

/**
 * Convert FEC totals wire data to internal model
 * Coalesces required fields, omits undefined optional fields
 */
export function toFECMinimal(
  person_id: string, 
  fecId: string, 
  wire: FECTotalsWire
): FECMinimal {
  if (!wire.cycle) {
    throw new Error('FEC totals missing cycle')
  }
  
  return withOptional(
    { 
      person_id, 
      fec_candidate_id: fecId, 
      election_cycle: wire.cycle, 
      data_source: 'fec_api' as const 
    },
    { 
      total_receipts: wire.total_receipts, 
      cash_on_hand: wire.cash_on_hand_end_period,
      total_disbursements: wire.total_disbursements,
      debts_owed: wire.debts_owed_by_committee
    }
  )
}

/**
 * Convert FEC contribution wire data to internal model
 * Validates and normalizes contribution data
 */
export function toFECContribution(wire: FECContributionWire): FECContributionModel | null {
  // Validate required fields
  if (!wire.contributor_id || !wire.contributor_name || !wire.amount || !wire.date) {
    return null
  }
  
  // Normalize contributor type
  const contributorType = wire.contributor_type === 'committee' ? 'committee' :
                         wire.contributor_type === 'organization' ? 'organization' : 'individual'
  
  return {
    contributor_id: wire.contributor_id,
    contributor_name: wire.contributor_name.trim(),
    contributor_type: contributorType,
    amount: wire.amount,
    date: wire.date,
    candidate_id: wire.candidate_id ?? '',
    committee_id: wire.committee_id ?? '',
    election_cycle: wire.election_cycle ?? '',
    ...(wire.industry ? { industry: wire.industry.trim() } : {})
  }
}

/**
 * Convert array of wire contributions to model contributions
 * Filters out invalid entries
 */
export function toFECContributions(wireContributions: FECContributionWire[]): FECContributionModel[] {
  return wireContributions
    .map(toFECContribution)
    .filter(isPresent)
}

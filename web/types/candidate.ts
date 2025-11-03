/**
 * Candidate Platform Types
 * 
 * Types for the candidate platform builder system.
 * These types are based on the candidate_platforms database table.
 * 
 * When database types are regenerated, these should align with:
 * Database['public']['Tables']['candidate_platforms']
 * 
 * Created: January 30, 2025
 */

/**
 * Platform position entry in a candidate's platform
 */
export type PlatformPosition = {
  id: string
  title: string
  position: string
  description?: string
  category: string
  priority: 'high' | 'medium' | 'low'
}

/**
 * Campaign funding information
 */
export type CampaignFunding = {
  total: number
  sources: string[]
  [key: string]: unknown // Allow for additional fields
}

/**
 * Candidate platform status
 */
export type CandidatePlatformStatus = 'active' | 'suspended' | 'withdrawn' | 'draft'

/**
 * Candidate platform visibility level
 */
export type CandidatePlatformVisibility = 'high' | 'medium' | 'low'

/**
 * Office level
 */
export type OfficeLevel = 'federal' | 'state' | 'local'

/**
 * Official filing status - tracks legal candidacy declaration
 */
export type FilingStatus = 'not_filed' | 'filed' | 'pending_verification' | 'verified' | 'rejected'

/**
 * Verification method for official filing
 */
export type VerificationMethod = 'gov_email' | 'filing_document' | 'manual_review' | 'api_verification'

/**
 * Candidate platform database row type
 * Matches the candidate_platforms table schema
 */
export type CandidatePlatformRow = {
  id: string
  user_id: string
  office: string
  level: OfficeLevel
  state: string
  district: string | null
  jurisdiction: string
  candidate_name: string
  party: string | null
  photo_url: string | null
  platform_positions: PlatformPosition[]
  experience: string | null
  endorsements: string[]
  campaign_funding: CampaignFunding
  campaign_website: string | null
  campaign_email: string | null
  campaign_phone: string | null
  visibility: CandidatePlatformVisibility
  status: CandidatePlatformStatus
  verified: boolean
  created_at: string
  updated_at: string
  last_active_at: string
  // Official filing fields (for legal candidacy declaration)
  official_filing_id?: string | null
  official_filing_date?: string | null  // DATE in DB, returned as ISO string
  filing_jurisdiction?: string | null
  filing_document_url?: string | null
  filing_status?: FilingStatus  // Defaults to 'not_filed' in DB
  filing_deadline?: string | null  // DATE in DB, returned as ISO string
  election_date?: string | null  // DATE in DB, returned as ISO string
  ballot_access_confirmed?: boolean  // Defaults to false in DB
  verification_method?: VerificationMethod | null
  verified_at?: string | null  // TIMESTAMPTZ in DB, returned as ISO string
  verified_by?: string | null  // UUID in DB (references auth.users)
}

/**
 * Candidate platform insert type
 * For creating new candidate platforms
 */
export type CandidatePlatformInsert = {
  id?: string
  user_id: string
  office: string
  level: OfficeLevel
  state: string
  district?: string | null
  jurisdiction: string
  candidate_name: string
  party?: string | null
  photo_url?: string | null
  platform_positions?: PlatformPosition[]
  experience?: string | null
  endorsements?: string[]
  campaign_funding?: CampaignFunding
  campaign_website?: string | null
  campaign_email?: string | null
  campaign_phone?: string | null
  visibility?: CandidatePlatformVisibility
  status?: CandidatePlatformStatus
  verified?: boolean
  created_at?: string
  updated_at?: string
  last_active_at?: string
  // Official filing fields (optional at creation, can be added later)
  official_filing_id?: string | null
  official_filing_date?: string | null
  filing_jurisdiction?: string | null
  filing_document_url?: string | null
  filing_status?: FilingStatus
  filing_deadline?: string | null
  election_date?: string | null
  ballot_access_confirmed?: boolean
  verification_method?: VerificationMethod | null
  verified_at?: string | null
  verified_by?: string | null
}

/**
 * Candidate platform update type
 * For updating existing candidate platforms
 */
export type CandidatePlatformUpdate = {
  id?: string
  user_id?: string
  office?: string
  level?: OfficeLevel
  state?: string
  district?: string | null
  jurisdiction?: string
  candidate_name?: string
  party?: string | null
  photo_url?: string | null
  platform_positions?: PlatformPosition[]
  experience?: string | null
  endorsements?: string[]
  campaign_funding?: CampaignFunding
  campaign_website?: string | null
  campaign_email?: string | null
  campaign_phone?: string | null
  visibility?: CandidatePlatformVisibility
  status?: CandidatePlatformStatus
  verified?: boolean
  created_at?: string
  updated_at?: string
  last_active_at?: string
  // Official filing fields (can be updated when filing is completed)
  official_filing_id?: string | null
  official_filing_date?: string | null
  filing_jurisdiction?: string | null
  filing_document_url?: string | null
  filing_status?: FilingStatus
  filing_deadline?: string | null
  election_date?: string | null
  ballot_access_confirmed?: boolean
  verification_method?: VerificationMethod | null
  verified_at?: string | null
  verified_by?: string | null
}


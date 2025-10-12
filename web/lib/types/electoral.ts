/**
 * Electoral & Civics Data Types
 * 
 * Comprehensive type definitions for electoral and civics modules
 * Replaces all 'any' types with proper TypeScript interfaces
 * 
 * Created: 2025-01-16
 * Updated: 2025-01-16
 */

// ============================================================================
// GEOJSON TYPES (Local definitions)
// ============================================================================

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
  properties: Record<string, unknown>;
}

// ============================================================================
// FINANCIAL TRANSPARENCY TYPES
// ============================================================================

export interface FECContribution {
  contributor_id: string;
  contributor_name: string;
  contributor_type: 'individual' | 'committee' | 'organization';
  amount: number;
  date: string;
  candidate_id: string;
  committee_id: string;
  election_cycle: string;
  industry?: string;
  influence_score?: number;
}

export interface FECExpenditure {
  expenditure_id: string;
  payee_name: string;
  amount: number;
  date: string;
  purpose: string;
  candidate_id: string;
  committee_id: string;
  election_cycle: string;
}

export interface CampaignFinanceSummary {
  candidate_id: string;
  cycle: string;
  total_contributions: number;
  total_expenditures: number;
  cash_on_hand: number;
  debt: number;
  independence_score: number;
  individual_contributions: number;
  pac_contributions: number;
  corporate_contributions: number;
  union_contributions: number;
  self_funding: number;
  small_donor_percentage: number;
  top_contributors: FECContribution[];
}

export interface IndustryContribution {
  industry: string;
  amount: number;
  percentage: number;
  candidate_id: string;
  cycle: string;
}

export interface TopContributor {
  name: string;
  amount: number;
  type: 'individual' | 'pac' | 'corporate' | 'union';
  industry: string;
  influence_score: number;
}

// ============================================================================
// GEOGRAPHIC AND ELECTORAL TYPES
// ============================================================================

export interface ElectoralDistrict {
  id: string;
  name: string;
  type: 'congressional' | 'state' | 'local';
  state: string;
  boundaries: GeoJSONFeature;
  population: number;
  registered_voters: number;
}

export interface GovernmentOfficial {
  id: string;
  name: string;
  title: string;
  party: string;
  district: string;
  state: string;
  term_start: Date;
  term_end: Date;
  contact_info: ContactInfo;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
  address?: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface UserLocation {
  zipCode?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  federal: {
    house: { district: string; representative: string };
    senate: { senators: string[] };
  };
  state: {
    governor?: string;
    legislature: {
      house: { district: string; representative: string };
      senate: { district: string; representative: string };
    };
  };
  local: {
    county: { executive?: string; commissioners: string[] };
    city: { mayor?: string; council: string[] };
    school: { board: string[] };
  };
}

// ============================================================================
// CIVICS DATA TYPES
// ============================================================================

export interface GovernmentAgency {
  id: string;
  name: string;
  type: 'federal' | 'state' | 'local';
  jurisdiction: string;
  description: string;
  website: string;
  contact_info: ContactInfo;
}

export interface Policy {
  id: string;
  title: string;
  description: string;
  status: 'proposed' | 'active' | 'inactive' | 'repealed';
  effective_date: Date;
  expiration_date?: Date;
  jurisdiction: string;
  category: string;
  tags: string[];
}

export interface Legislation {
  id: string;
  title: string;
  bill_number: string;
  status: 'introduced' | 'committee' | 'floor' | 'passed' | 'vetoed';
  chamber: 'house' | 'senate';
  session: string;
  sponsors: string[];
  summary: string;
  full_text_url: string;
  last_action: string;
  last_action_date: Date;
}

export interface CivicEngagement {
  user_id: string;
  actions: CivicAction[];
  total_score: number;
  last_updated: Date;
}

export interface CivicAction {
  type: 'vote' | 'contact' | 'petition' | 'donation' | 'volunteer';
  description: string;
  date: Date;
  impact_score: number;
  verified: boolean;
}

// ============================================================================
// INTEGRATION API TYPES
// ============================================================================

// Google Civic API Types
export interface GoogleCivicError {
  error: {
    code: number;
    message: string;
    status: string;
    details: Array<{
      '@type': string;
      field_violations: Array<{
        field: string;
        description: string;
      }>;
    }>;
  };
}

export interface GoogleCivicResponse<T> {
  kind: string;
  etag: string;
  data: T;
  error?: GoogleCivicError;
}

export interface RepresentativeInfo {
  offices: Office[];
  officials: Official[];
}

export interface Office {
  name: string;
  divisionId: string;
  levels: string[];
  roles: string[];
  sources: Source[];
  officialIndices: number[];
}

export interface Official {
  name: string;
  address: Address[];
  party: string;
  phones: string[];
  urls: string[];
  photoUrl: string;
  emails: string[];
  channels: Channel[];
}

export interface Source {
  name: string;
  official: boolean;
}

export interface Channel {
  type: string;
  id: string;
}

// FEC API Types
export interface FECResponse<T> {
  results: T[];
  pagination: {
    page: number;
    per_page: number;
    count: number;
    pages: number;
  };
}

export interface FECError {
  error: {
    code: string;
    message: string;
    details: string;
  };
}

// Congress.gov API Types
export interface CongressGovResponse<T> {
  results: T[];
  pagination: {
    count: number;
    next: string;
    previous: string;
  };
}

export interface Bill {
  congress: number;
  bill_id: string;
  bill_type: string;
  number: string;
  title: string;
  short_title: string;
  introduced_date: string;
  sponsor: Sponsor;
  subjects: string[];
  summary: string;
  latest_action: LatestAction;
}

export interface Sponsor {
  bioguide_id: string;
  first_name: string;
  last_name: string;
  party: string;
  state: string;
}

export interface LatestAction {
  action_date: string;
  text: string;
}

// ============================================================================
// VOTING AND ELECTORAL TYPES
// ============================================================================

export interface Vote {
  id: string;
  bill_id: string;
  bill_title: string;
  question: string;
  vote: 'yes' | 'no' | 'abstain' | 'not_voting';
  result: 'passed' | 'failed' | 'tabled';
  date: string;
  party_line_vote: boolean;
  constituent_alignment: number;
}

export interface VotingRecord {
  candidate_id: string;
  votes: Vote[];
  total_votes: number;
  party_line_votes: number;
  constituent_alignment: number;
}

export interface ElectoralRace {
  race_id: string;
  office: string;
  jurisdiction: string;
  election_date: string;
  incumbent?: Representative;
  challengers: Candidate[];
  all_candidates: Candidate[];
  key_issues: string[];
  campaign_finance: {
    incumbent?: CampaignFinanceSummary;
    challengers: CampaignFinanceSummary[];
  };
  recent_activity: Activity[];
  constituent_questions: number;
  candidate_responses: number;
  status: 'upcoming' | 'active' | 'completed';
  importance: 'high' | 'medium' | 'low';
}

export interface Representative {
  id: string;
  name: string;
  party: string;
  office: string;
  jurisdiction: string;
  district?: string;
  email?: string;
  phone?: string;
  website?: string;
  social_media: Record<string, string>;
  voting_record: VotingRecord;
  campaign_finance: CampaignFinanceSummary;
  engagement: {
    response_rate: number;
    average_response_time: number;
    constituent_questions: number;
    public_statements: number;
  };
  walk_the_talk_score: {
    overall: number;
    promise_fulfillment: number;
    constituent_alignment: number;
    financial_independence: number;
  };
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  office: string;
  jurisdiction: string;
  district?: string;
  campaign: {
    status: 'active' | 'suspended' | 'withdrawn';
    filing_date: string;
    election_date: string;
    key_issues: string[];
    platform: string[];
  };
  email?: string;
  phone?: string;
  website?: string;
  social_media: Record<string, string>;
  campaign_finance: CampaignFinanceSummary;
  platform_access: {
    is_verified: boolean;
    verification_method: 'gov_email' | 'filing_document' | 'manual_review';
    can_post: boolean;
    can_respond: boolean;
    can_engage: boolean;
  };
  engagement: {
    posts: number;
    responses: number;
    constituent_questions: number;
    response_rate: number;
  };
}

export interface Activity {
  id: string;
  type: 'post' | 'response' | 'vote' | 'statement' | 'event';
  candidate_id: string;
  candidate_name: string;
  content: string;
  timestamp: string;
  engagement: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
}

// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

export interface ApiError {
  message: string;
  statusCode: number;
  errorCode?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

export interface ErrorContext {
  operation: string;
  endpoint?: string;
  params?: Record<string, unknown>;
  attempt?: number;
  timestamp: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PaginationInfo {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationInfo;
  metadata: {
    source: string;
    retrieved_at: string;
    quality_score: number;
  };
}

export interface QualityMetrics {
  completeness: number; // 0-1
  accuracy: number; // 0-1
  consistency: number; // 0-1
  timeliness: number; // 0-1
  overall: number; // 0-1
}

export interface DataSource {
  name: string;
  enabled: boolean;
  rate_limit: {
    requests_per_minute: number;
    requests_per_hour: number;
    requests_per_day: number;
  };
  cache_ttl: number;
  priority: number; // 0-100, higher = more reliable
}

// ============================================================================
// ADDITIONAL TYPES FOR FINANCIAL TRANSPARENCY
// ============================================================================

export interface CorporateConnection {
  company: string;
  industry: string;
  connection_type: 'donation' | 'employment' | 'board_member' | 'consultant';
  amount?: number;
  start_date: string;
  end_date?: string;
}

export interface IndustryInfluence {
  industry: string;
  total_contributions: number;
  influence_score: number;
  key_companies: string[];
  policy_impact: string[];
}

export interface ConflictOfInterest {
  issue: string;
  conflict_type: 'financial' | 'employment' | 'family' | 'business';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  disclosure: boolean;
}

export interface RevolvingDoorEntry {
  position: string;
  agency: string;
  start_date: string;
  end_date: string;
  salary: number;
}

export interface PostGovernmentEmployment {
  employer: string;
  position: string;
  start_date: string;
  industry: string;
  salary: number;
  lobbying: boolean;
}

// ============================================================================
// ALL TYPES ARE EXPORTED VIA 'export interface' DECLARATIONS ABOVE
// ============================================================================

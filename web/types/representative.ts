/**
 * Representative Types
 * 
 * TypeScript interfaces for representative data structures
 * Based on the civics backend database schema
 * 
 * Created: October 28, 2025
 * Status: ✅ FOUNDATION
 */

// ============================================================================
// CORE REPRESENTATIVE TYPES
// ============================================================================

export interface Representative {
  id: number;
  name: string;
  party: string;
  office: string;
  level: 'federal' | 'state' | 'local';
  state: string;
  district?: string;
  
  // Contact Information
  primary_email?: string;
  primary_phone?: string;
  primary_website?: string;
  
  // Social Media
  twitter_handle?: string;
  facebook_url?: string;
  instagram_handle?: string;
  linkedin_url?: string;
  youtube_channel?: string;
  
  // External IDs
  bioguide_id?: string;
  openstates_id?: string;
  fec_id?: string;
  google_civic_id?: string;
  congress_gov_id?: string;
  
  // Additional Info
  primary_photo_url?: string;
  term_start_date?: string;
  term_end_date?: string;
  next_election_date?: string;
  
  // Data Quality
  data_quality_score: number;
  verification_status: 'verified' | 'pending' | 'failed';
  data_sources: string[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_verified: string;
  
  // Related Data (populated by service)
  photos?: RepresentativePhoto[];
  activities?: RepresentativeActivity[];
  committees?: RepresentativeCommittee[];
  crosswalk?: RepresentativeCrosswalk[];
}

export interface RepresentativePhoto {
  id: number;
  representative_id: number;
  url: string;
  source: string;
  width?: number;
  height?: number;
  alt_text?: string;
  attribution?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface RepresentativeActivity {
  id: number;
  representative_id: number;
  type: string;
  title: string;
  description?: string;
  date: string;
  source: string;
  source_url?: string;
  url?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RepresentativeCommittee {
  id: number;
  representative_id: number;
  committee_name: string;
  role: 'chair' | 'vice_chair' | 'member';
  jurisdiction?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface RepresentativeCrosswalk {
  id: number;
  entity_type: string;
  canonical_id: string;
  source: string;
  source_id: string;
  attrs?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SEARCH AND QUERY TYPES
// ============================================================================

export interface RepresentativeSearchQuery {
  query?: string;
  state?: string;
  district?: string;
  party?: string;
  office?: string;
  level?: 'federal' | 'state' | 'local';
  committee?: string;
  limit?: number;
  offset?: number;
}

export interface RepresentativeSearchResult {
  representatives: Representative[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface RepresentativeLocationQuery {
  address: string;
  includeState?: boolean;
  includeFederal?: boolean;
}

// ============================================================================
// USER INTERACTION TYPES
// ============================================================================

export interface UserRepresentative {
  id: string;
  user_id: string;
  representative_id: number;
  relationship_type: 'constituent' | 'following' | 'interested';
  created_at: string;
  updated_at: string;
}

export interface RepresentativeSubscription {
  id: string;
  user_id: string;
  representative_id: number;
  subscription_type: 'updates' | 'votes' | 'committees' | 'all';
  created_at: string;
  updated_at: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface RepresentativeApiResponse {
  success: boolean;
  data?: Representative | Representative[];
  error?: string;
  message?: string;
}

export interface RepresentativeListResponse {
  success: boolean;
  data: {
    representatives: Representative[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  error?: string;
  message?: string;
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

export interface RepresentativeCardProps {
  representative: Representative;
  showDetails?: boolean;
  showActions?: boolean;
  onFollow?: (representative: Representative) => void;
  onContact?: (representative: Representative) => void;
  onClick?: (representative: Representative) => void;
  className?: string;
}

export interface RepresentativeListProps {
  representatives: Representative[];
  loading?: boolean;
  error?: string;
  onRepresentativeClick?: (representative: Representative) => void;
  className?: string;
}

export interface RepresentativeSearchProps {
  onSearch: (query: RepresentativeSearchQuery) => void;
  onLocationSearch?: (address: string) => void;
  loading?: boolean;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const REPRESENTATIVE_CONSTANTS = {
  MAX_SEARCH_RESULTS: 50,
  DEFAULT_PAGE_SIZE: 20,
  MAX_FOLLOWED_REPRESENTATIVES: 10,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
} as const;

export const REPRESENTATIVE_OFFICES = {
  FEDERAL: {
    SENATOR: 'Senator',
    REPRESENTATIVE: 'Representative',
  },
  STATE: {
    GOVERNOR: 'Governor',
    LIEUTENANT_GOVERNOR: 'Lieutenant Governor',
    ATTORNEY_GENERAL: 'Attorney General',
    SECRETARY_OF_STATE: 'Secretary of State',
    STATE_SENATOR: 'State Senator',
    STATE_REPRESENTATIVE: 'State Representative',
    ASSEMBLY_MEMBER: 'Assembly Member',
  },
} as const;

export const REPRESENTATIVE_PARTIES = {
  DEMOCRATIC: 'Democratic',
  REPUBLICAN: 'Republican',
  INDEPENDENT: 'Independent',
  GREEN: 'Green',
  LIBERTARIAN: 'Libertarian',
} as const;

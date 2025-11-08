/**
 * Civics Data Types
 *
 * Type definitions for the civics data ingestion system
 * Includes canonical ID system and comprehensive data models
 */
export type EntityType = 'person' | 'committee' | 'bill' | 'jurisdiction' | 'election';
export type DataSource = 'congress-gov' | 'fec' | 'open-states' | 'opensecrets' | 'google-civic' | 'govtrack';
export type Party = 'D' | 'R' | 'I' | 'L' | 'G' | 'N' | 'U';
export type Chamber = 'house' | 'senate' | 'state_house' | 'state_senate' | 'local';
export type Level = 'federal' | 'state' | 'local';
export type ElectionType = 'general' | 'primary' | 'special' | 'runoff';
export type ElectionStatus = 'upcoming' | 'active' | 'completed';
export type VoteType = 'yea' | 'nay' | 'present' | 'not_voting';
export type ContributionType = 'individual' | 'pac' | 'party' | 'self';
export type BillType = 'house' | 'senate' | 'concurrent';
export interface IdCrosswalk {
    entity_uuid: string;
    entity_type: EntityType;
    canonical_id: string;
    source: DataSource;
    source_id: string;
    attrs: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}
export interface CanonicalIdMapping {
    canonical_id: string;
    sources: Record<DataSource, string>;
    entity_type: EntityType;
}
export interface Candidate {
    id: string;
    canonical_id: string;
    name: string;
    first_name?: string;
    last_name?: string;
    party?: Party;
    office: string;
    chamber?: Chamber;
    state: string;
    district?: string;
    level: Level;
    email?: string;
    phone?: string;
    website?: string;
    photo_url?: string;
    social_media: Record<string, string>;
    ocd_division_id?: string;
    jurisdiction_ids: string[];
    verified: boolean;
    verification_method?: string;
    verification_date?: string;
    data_sources: DataSource[];
    quality_score: number;
    last_updated: string;
    created_at: string;
    provenance: Record<string, unknown>;
    license_key: string;
}
export interface Election {
    id: string;
    canonical_id: string;
    name: string;
    type: ElectionType;
    level: Level;
    state: string;
    district?: string;
    election_date: string;
    registration_deadline?: string;
    early_voting_start?: string;
    early_voting_end?: string;
    ocd_division_id?: string;
    jurisdiction_ids: string[];
    status: ElectionStatus;
    results_available: boolean;
    data_sources: DataSource[];
    quality_score: number;
    last_updated: string;
    created_at: string;
    provenance: Record<string, unknown>;
    license_key: string;
}
export interface CampaignFinance {
    id: string;
    candidate_id: string;
    committee_id?: string;
    committee_name?: string;
    cycle: number;
    total_receipts: number;
    total_disbursements: number;
    cash_on_hand: number;
    debt: number;
    individual_contributions: number;
    pac_contributions: number;
    party_contributions: number;
    self_financing: number;
    independence_score: number;
    top_donor_percentage: number;
    corporate_donor_percentage: number;
    data_sources: DataSource[];
    quality_score: number;
    last_updated: string;
    created_at: string;
    provenance: Record<string, unknown>;
    license_key: string;
}
export interface Contribution {
    id: string;
    candidate_id: string;
    committee_id?: string;
    contributor_name_hash?: string;
    contributor_city?: string;
    contributor_state?: string;
    contributor_zip5?: string;
    contributor_employer?: string;
    contributor_occupation?: string;
    amount: number;
    contribution_date: string;
    contribution_type?: ContributionType;
    sector?: string;
    industry?: string;
    data_sources: DataSource[];
    quality_score: number;
    last_updated: string;
    created_at: string;
    provenance: Record<string, unknown>;
    license_key: string;
    retention_until?: string;
}
export interface VotingRecord {
    id: string;
    candidate_id: string;
    bill_id?: string;
    bill_title?: string;
    bill_subject?: string;
    vote: VoteType;
    vote_date: string;
    chamber?: string;
    bill_type?: BillType;
    bill_number?: string;
    congress_number?: number;
    vote_description?: string;
    vote_question?: string;
    data_sources: DataSource[];
    quality_score: number;
    last_updated: string;
    created_at: string;
    provenance: Record<string, unknown>;
    license_key: string;
}
export interface DataLicense {
    license_key: string;
    source_name: string;
    attribution_text: string;
    display_requirements?: string;
    cache_ttl_seconds?: number;
    usage_restrictions?: Record<string, unknown>;
    created_at: string;
}
export interface IndependenceScoreMethodology {
    version: string;
    formula: string;
    data_sources: DataSource[];
    confidence_interval?: number;
    experimental: boolean;
    methodology_url?: string;
    created_at: string;
}
export interface IngestCursor {
    source: DataSource;
    cursor: Record<string, unknown>;
    updated_at: string;
}
export interface DataQualityAudit {
    id: string;
    table_name: string;
    record_id: string;
    completeness_score: number;
    accuracy_score: number;
    consistency_score: number;
    timeliness_score: number;
    overall_score: number;
    primary_source?: DataSource;
    secondary_sources: DataSource[];
    conflict_resolution?: string;
    last_validation: string;
    validation_method?: string;
    issues_found: string[];
    resolved_issues: string[];
    created_at: string;
}
export interface ProvenanceData {
    source_names: DataSource[];
    source_urls: string[];
    retrieved_at: string[];
    transform_version: string;
    api_version?: string;
    etag?: string;
    md5_hash?: string;
}
export interface QualityMetrics {
    completeness: number;
    accuracy: number;
    consistency: number;
    timeliness: number;
    overall: number;
}
export interface DataSourceConfig {
    name: DataSource;
    enabled: boolean;
    rate_limit: {
        requests_per_minute: number;
        requests_per_hour: number;
        requests_per_day: number;
    };
    cache_ttl: number;
    priority: number;
}
export interface CivicsApiResponse<T> {
    data: T[];
    pagination?: {
        count: number;
        next?: string;
        previous?: string;
    };
    metadata: {
        source: DataSource;
        retrieved_at: string;
        quality_score: number;
    };
}
export interface CrosswalkResponse {
    canonical_id: string;
    entity_type: EntityType;
    sources: Record<DataSource, string>;
    quality_score: number;
    last_updated: string;
}
export interface ValidationResult {
    isValid: boolean;
    score: number;
    issues: ValidationIssue[];
    suggestions: string[];
}
export interface ValidationIssue {
    field: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    suggestedFix?: string;
}
export interface IngestTask {
    id: string;
    source: DataSource;
    params: Record<string, unknown>;
    window: string;
    priority: 'high' | 'medium' | 'low';
    retryCount: number;
    maxRetries: number;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    created_at: string;
    started_at?: string;
    completed_at?: string;
    error?: string;
}
export interface IngestMetrics {
    source: DataSource;
    total_processed: number;
    successful: number;
    failed: number;
    quality_score: number;
    last_run: string;
    next_run?: string;
    quota_used: number;
    quota_remaining: number;
}
export interface GeographicLookup {
    ocd_division_id: string;
    fips_state_code?: string;
    fips_county_code?: string;
    geoid?: string;
    census_cycle?: number;
    congress_number?: number;
    geometry?: unknown;
    created_at: string;
}
export interface ZipToOcd {
    zip5: string;
    ocd_division_id: string;
    confidence: number;
}
export interface LatLonToOcd {
    lat: number;
    lon: number;
    ocd_division_id: string;
}
//# sourceMappingURL=types.d.ts.map
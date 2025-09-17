/**
 * Core Services Types
 * 
 * Comprehensive type definitions for core services including feature flags,
 * real-time news, hybrid voting, and monitoring systems.
 * 
 * Created: 2025-09-16
 * Agent A2 - Database & Core Services Types
 */

// ============================================================================
// FEATURE FLAG TYPES
// ============================================================================

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  key?: FeatureFlagKey;
  category?: string;
}

export type FeatureFlagKey = 
  | 'CORE_AUTH'
  | 'CORE_POLLS'
  | 'CORE_USERS'
  | 'WEBAUTHN'
  | 'PWA'
  | 'ANALYTICS'
  | 'ADMIN'
  | 'EXPERIMENTAL_UI'
  | 'EXPERIMENTAL_ANALYTICS'
  | 'ADVANCED_PRIVACY';

export interface FeatureFlagConfig {
  flags: Record<FeatureFlagKey, boolean>;
  timestamp: string;
  version: string;
}

export interface FeatureFlagMetadata {
  description?: string;
  category?: string;
  dependencies?: FeatureFlagKey[];
  tags?: string[];
}

export interface FeatureFlagCallback {
  (flag: string, value: boolean): void;
}

export interface FeatureFlagEvaluation {
  flag: string;
  value: boolean;
  reason: 'default' | 'targeting' | 'override';
  timestamp: Date;
}

// ============================================================================
// REAL-TIME NEWS TYPES
// ============================================================================

export interface BreakingNewsStory {
  id: string;
  headline: string;
  summary: string;
  fullStory: string;
  sourceUrl: string;
  sourceName: string;
  sourceReliability: number;
  category: string[];
  urgency: 'low' | 'medium' | 'high' | 'breaking';
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  entities: NewsEntity[];
  metadata: NewsMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsEntity {
  name: string;
  type: 'person' | 'organization' | 'location' | 'event' | 'policy' | 'concept';
  confidence: number;
  role?: string;
  stance?: 'support' | 'oppose' | 'neutral' | 'unknown';
  metadata?: Record<string, unknown>;
}

export interface NewsMetadata {
  keywords: string[];
  controversy: number;
  timeSensitivity: 'low' | 'medium' | 'high';
  geographicScope: 'local' | 'national' | 'international' | 'global';
  politicalImpact: number;
  publicInterest: number;
  complexity?: 'low' | 'medium' | 'high';
}

export interface NewsSource {
  id: string;
  name: string;
  domain: string;
  reliability: number;
  bias: 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'unknown';
  type: 'mainstream' | 'wire' | 'digital' | 'international';
  apiEndpoint?: string;
  apiKey?: string;
  rateLimit: number;
  isActive: boolean;
  lastUpdated: Date;
  errorCount: number;
  successRate: number;
}

export interface PollContext {
  storyId: string;
  question: string;
  context: string;
  whyImportant: string;
  stakeholders: NewsEntity[];
  options: PollOption[];
  votingMethod: 'single' | 'multiple' | 'ranked' | 'approval' | 'range';
  estimatedControversy: number;
  timeToLive: number;
}

export interface PollOption {
  id: string;
  text: string;
  description?: string;
  stance?: 'support' | 'oppose' | 'neutral' | 'nuanced';
  metadata?: Record<string, unknown>;
}

// ============================================================================
// HYBRID VOTING TYPES
// ============================================================================

export enum PrivacyLevel {
  MINIMAL = 'minimal',
  STANDARD = 'standard',
  ENHANCED = 'enhanced',
  MAXIMUM = 'maximum'
}

export interface VoteRequest {
  pollId: string;
  choice: number;
  privacyLevel: PrivacyLevel;
  userId?: string;
}

export interface VoteResponse {
  success: boolean;
  message: string;
  pollId: string;
  voteId?: string;
  auditReceipt?: string;
  privacyLevel: PrivacyLevel;
  responseTime: number;
}

export interface VoteValidation {
  isValid: boolean;
  error?: string;
  requiresAuthentication: boolean;
  requiresTokens: boolean;
}

export interface PollPrivacySettings {
  privacy_level: PrivacyLevel;
  requires_authentication: boolean;
  uses_blinded_tokens: boolean;
}

export interface BlindedTokenResponse {
  token: string;
  tag: string;
}

export interface POServiceResponse {
  vote_id: string;
  audit_receipt: string;
}

export interface UserVerificationTier {
  verification_tier: string;
}

// ============================================================================
// MONITORING TYPES
// ============================================================================

export interface IntegrationMetrics {
  apiName: string;
  timestamp: Date;
  requests: {
    total: number;
    successful: number;
    failed: number;
    rateLimited: number;
  };
  performance: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
    byStatusCode: Record<number, number>;
  };
  cache: {
    hitRate: number;
    missRate: number;
    totalHits: number;
    totalMisses: number;
  };
  quota: {
    remaining: number;
    used: number;
    resetTime: Date;
    quotaExceeded: boolean;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  apiName: string;
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown: number;
  lastTriggered?: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  apiName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
}

export interface HealthCheck {
  apiName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  responseTime: number;
  errorRate: number;
  lastError?: string;
  details: Record<string, unknown>;
}

// ============================================================================
// CACHING TYPES
// ============================================================================

export interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
  enableCompression: boolean;
  enablePersistence: boolean;
}

export interface CacheEntry<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  totalRequests: number;
  memoryUsage: number;
  oldestEntry: number;
  newestEntry: number;
}

export interface CacheMetrics {
  apiName: string;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  averageResponseTime: number;
  dataFreshness: number;
  storageEfficiency: number;
}

// ============================================================================
// PRE-LAUNCH CHECKLIST TYPES
// ============================================================================

export interface ChecklistItem {
  category: string;
  item: string;
  weight: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  verificationMethod: 'automated' | 'manual' | 'hybrid';
  dependencies?: string[];
}

export interface ChecklistItemResult {
  category: string;
  item: string;
  weight: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  checkedAt: string;
  notes: string;
  evidence?: string;
  verifiedBy?: string;
}

export interface ChecklistResult {
  items: ChecklistItemResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    pending: number;
    criticalPassed: number;
    criticalFailed: number;
    criticalTotal: number;
  };
  overallStatus: 'ready' | 'not-ready' | 'conditional';
  readyForLaunch: boolean;
  blockers: string[];
  recommendations: string[];
  checkedAt: string;
}

// ============================================================================
// MOCK DATA TYPES FOR VERIFICATION
// ============================================================================

export interface RLSPolicy {
  table: string;
  operation: string;
  denies: boolean;
}

export interface PollSnapshot {
  checksum: string;
  merkleRoot: string;
}

export interface WebAuthnStatus {
  working: boolean;
}

export interface DPBudgetLedger {
  visible: boolean;
  accurate: boolean;
}

export interface KAnonymityGates {
  enforced: boolean;
}

export interface RetentionPolicies {
  implemented: boolean;
}

export interface WCAGCompliance {
  level: string;
}

export interface Chart {
  colorSafe: boolean;
}

export interface LowBandwidthForm {
  available: boolean;
}

export interface RateLimitingStatus {
  working: boolean;
  alertsFiring: boolean;
}

export interface ChaosTestResult {
  success: boolean;
}

export interface SLOMetrics {
  status: 'healthy' | 'unhealthy';
}

export interface RedDashboard {
  operational: boolean;
}

export interface LoadTestResults {
  success: boolean;
  ballots: number;
}

export interface ActivePoll {
  hasUnofficialBadge: boolean;
}

export interface MethodologyPage {
  live: boolean;
  accessible: boolean;
}

export interface CryptoPolicy {
  documented: boolean;
  implemented: boolean;
}

export interface ConstituentStatus {
  working: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type VerificationMethod = 'automated' | 'manual' | 'hybrid';
export type ChecklistStatus = 'pass' | 'fail' | 'warning' | 'pending';
export type OverallStatus = 'ready' | 'not-ready' | 'conditional';
export type Weight = 'critical' | 'high' | 'medium' | 'low';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';
export type AlertOperator = 'gt' | 'lt' | 'eq' | 'gte' | 'lte';

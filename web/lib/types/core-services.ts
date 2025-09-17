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

export type FeatureFlag = {
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

export type FeatureFlagConfig = {
  flags: Record<FeatureFlagKey, boolean>;
  timestamp: string;
  version: string;
}

export type FeatureFlagMetadata = {
  description?: string;
  category?: string;
  dependencies?: FeatureFlagKey[];
  tags?: string[];
}

export type FeatureFlagCallback = {
  (flag: string, value: boolean): void;
}

export type FeatureFlagEvaluation = {
  flag: string;
  value: boolean;
  reason: 'default' | 'targeting' | 'override';
  timestamp: Date;
}

// ============================================================================
// REAL-TIME NEWS TYPES
// ============================================================================

export type BreakingNewsStory = {
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

export type NewsEntity = {
  name: string;
  type: 'person' | 'organization' | 'location' | 'event' | 'policy' | 'concept';
  confidence: number;
  role?: string;
  stance?: 'support' | 'oppose' | 'neutral' | 'unknown';
  metadata?: Record<string, unknown>;
}

export type NewsMetadata = {
  keywords: string[];
  controversy: number;
  timeSensitivity: 'low' | 'medium' | 'high';
  geographicScope: 'local' | 'national' | 'international' | 'global';
  politicalImpact: number;
  publicInterest: number;
  complexity?: 'low' | 'medium' | 'high';
}

export type NewsSource = {
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

export type PollContext = {
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

export type PollOption = {
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

export type VoteRequest = {
  pollId: string;
  choice: number;
  privacyLevel: PrivacyLevel;
  userId?: string;
}

export type VoteResponse = {
  success: boolean;
  message: string;
  pollId: string;
  voteId?: string;
  auditReceipt?: string;
  privacyLevel: PrivacyLevel;
  responseTime: number;
}

export type VoteValidation = {
  isValid: boolean;
  error?: string;
  requiresAuthentication: boolean;
  requiresTokens: boolean;
}

export type PollPrivacySettings = {
  privacy_level: PrivacyLevel;
  requires_authentication: boolean;
  uses_blinded_tokens: boolean;
}

export type BlindedTokenResponse = {
  token: string;
  tag: string;
}

export type POServiceResponse = {
  vote_id: string;
  audit_receipt: string;
}

export type UserVerificationTier = {
  verification_tier: string;
}

// ============================================================================
// MONITORING TYPES
// ============================================================================

export type IntegrationMetrics = {
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

export type AlertRule = {
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

export type Alert = {
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

export type HealthCheck = {
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

export type CacheConfig = {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
  enableCompression: boolean;
  enablePersistence: boolean;
}

export type CacheEntry<T = unknown> = {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  source: string;
  metadata?: Record<string, unknown>;
}

export type CacheStats = {
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

export type CacheMetrics = {
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

export type ChecklistItem = {
  category: string;
  item: string;
  weight: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  verificationMethod: 'automated' | 'manual' | 'hybrid';
  dependencies?: string[];
}

export type ChecklistItemResult = {
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

export type ChecklistResult = {
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

export type RLSPolicy = {
  table: string;
  operation: string;
  denies: boolean;
}

export type PollSnapshot = {
  checksum: string;
  merkleRoot: string;
}

export type WebAuthnStatus = {
  working: boolean;
}

export type DPBudgetLedger = {
  visible: boolean;
  accurate: boolean;
}

export type KAnonymityGates = {
  enforced: boolean;
}

export type RetentionPolicies = {
  implemented: boolean;
}

export type WCAGCompliance = {
  level: string;
}

export type Chart = {
  colorSafe: boolean;
}

export type LowBandwidthForm = {
  available: boolean;
}

export type RateLimitingStatus = {
  working: boolean;
  alertsFiring: boolean;
}

export type ChaosTestResult = {
  success: boolean;
}

export type SLOMetrics = {
  status: 'healthy' | 'unhealthy';
}

export type RedDashboard = {
  operational: boolean;
}

export type LoadTestResults = {
  success: boolean;
  ballots: number;
}

export type ActivePoll = {
  hasUnofficialBadge: boolean;
}

export type MethodologyPage = {
  live: boolean;
  accessible: boolean;
}

export type CryptoPolicy = {
  documented: boolean;
  implemented: boolean;
}

export type ConstituentStatus = {
  working: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type ErrorResponse = {
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

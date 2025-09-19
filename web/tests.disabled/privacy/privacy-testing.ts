// ============================================================================
// PHASE 2: COMPREHENSIVE PRIVACY TESTING SUITE
// ============================================================================
// Agent A2 - Privacy Specialist
// 
// This module contains comprehensive privacy testing for differential privacy,
// k-anonymity, LINDDUN threat modeling, and legal compliance for the
// Ranked Choice Democracy Revolution platform.
// 
// Test Categories:
// - Differential Privacy Testing
// - K-Anonymity Testing
// - LINDDUN Threat Assessment Testing
// - Legal Compliance Testing
// - Data Retention Testing
// - Social Discovery Privacy Testing
// 
// Created: January 15, 2025
// Status: Phase 2 Implementation
// ============================================================================

import { DifferentialPrivacyManager, laplaceNoise, dpCount, showBucket } from '../../lib/privacy/dp';
import { PrivacyThreatAssessmentManager, createDataFlow, quickPrivacyAssessment } from '../../lib/privacy/linddun-analysis';
import { CommunicationComplianceManager, requiresCOPPACompliance, getCOPPARequirements } from '../../lib/legal/compliance';
import { PrivacyAwareSocialDiscoveryManager, meetsKAnonymity, applyDifferentialPrivacy } from '../../lib/privacy/social-discovery';
import { DataRetentionManager, shouldRetainData, calculateDataAge, formatRetentionPeriod } from '../../lib/privacy/retention-policies';

// ============================================================================
// DIFFERENTIAL PRIVACY TESTING
// ============================================================================

describe('Differential Privacy', () => {
  let dpManager: DifferentialPrivacyManager;

  beforeEach(() => {
    dpManager = new DifferentialPrivacyManager();
  });

  test('Laplace noise generation', () => {
    const epsilon = 0.8;
    const noise1 = laplaceNoise(epsilon);
    const noise2 = laplaceNoise(epsilon);
    
    // Noise should be different each time
    expect(noise1).not.toBe(noise2);
    
    // Noise should be finite
    expect(Number.isFinite(noise1)).toBe(true);
    expect(Number.isFinite(noise2)).toBe(true);
  });

  test('DP count application', () => {
    const originalCount = 100;
    const epsilon = 0.8;
    
    const dpResult1 = dpCount(originalCount, epsilon);
    const dpResult2 = dpCount(originalCount, epsilon);
    
    // Results should be different due to noise
    expect(dpResult1).not.toBe(dpResult2);
    
    // Results should be non-negative
    expect(dpResult1).toBeGreaterThanOrEqual(0);
    expect(dpResult2).toBeGreaterThanOrEqual(0);
  });

  test('epsilon budget tracking', () => {
    const pollId = 'test-poll';
    const epsilon = 0.1;
    
    // Track epsilon usage
    dpManager.trackEpsilonUsage(pollId, epsilon, 'test-operation');
    
    const status = dpManager.getBudgetStatus(pollId);
    expect(status.used).toBe(epsilon);
    expect(status.remaining).toBe(0.9);
    expect(status.operations).toHaveLength(1);
  });

  test('epsilon budget enforcement', () => {
    const pollId = 'test-poll';
    const epsilon = 1.5; // Exceeds default max of 1.0
    
    expect(() => {
      dpManager.trackEpsilonUsage(pollId, epsilon, 'test-operation');
    }).toThrow('Epsilon budget exceeded');
  });

  test('k-anonymity enforcement', () => {
    const groupSize = 25;
    const context = 'loggedIn';
    const totalCount = 1000;
    
    const result = dpManager.shouldShowBreakdown(groupSize, context, totalCount);
    
    expect(result.shouldShow).toBe(false);
    expect(result.reason).toContain('below k-anonymity threshold');
  });

  test('privacy-aware breakdown creation', () => {
    const pollId = 'test-poll';
    const data = [
      { category: 'A', count: 150 },
      { category: 'B', count: 25 },
      { category: 'C', count: 200 }
    ];
    
    const breakdown = dpManager.createPrivacyAwareBreakdown(data, pollId, 'public', 0.5);
    
    expect(breakdown.breakdown).toBeDefined();
    expect(breakdown.privacyConfig.context).toBe('public');
    expect(breakdown.metadata.suppressedGroups).toBeGreaterThan(0);
  });
});

// ============================================================================
// K-ANONYMITY TESTING
// ============================================================================

describe('K-Anonymity', () => {
  test('k-anonymity threshold enforcement', () => {
    expect(meetsKAnonymity(150, 'public')).toBe(true);
    expect(meetsKAnonymity(75, 'public')).toBe(false);
    expect(meetsKAnonymity(60, 'loggedIn')).toBe(true);
    expect(meetsKAnonymity(30, 'loggedIn')).toBe(false);
    expect(meetsKAnonymity(30, 'internal')).toBe(true);
    expect(meetsKAnonymity(20, 'internal')).toBe(false);
  });

  test('differential privacy application', () => {
    const count = 100;
    const epsilon = 0.8;
    
    const noisyCount1 = applyDifferentialPrivacy(count, epsilon);
    const noisyCount2 = applyDifferentialPrivacy(count, epsilon);
    
    expect(noisyCount1).not.toBe(noisyCount2);
    expect(noisyCount1).toBeGreaterThanOrEqual(0);
    expect(noisyCount2).toBeGreaterThanOrEqual(0);
  });

  test('bucket visibility with k-anonymity', () => {
    expect(showBucket(150, 100, 0.01, 1000)).toBe(true);
    expect(showBucket(75, 100, 0.01, 1000)).toBe(false);
    expect(showBucket(150, 100, 0.01, 5000)).toBe(true);
    expect(showBucket(25, 100, 0.01, 1000)).toBe(false);
  });
});

// ============================================================================
// LINDDUN THREAT MODELING TESTING
// ============================================================================

describe('LINDDUN Threat Modeling', () => {
  let threatManager: PrivacyThreatAssessmentManager;

  beforeEach(() => {
    threatManager = new PrivacyThreatAssessmentManager();
  });

  test('data flow creation', () => {
    const dataFlow = createDataFlow({
      id: 'test-flow',
      name: 'Test Data Flow',
      source: 'user',
      destination: 'database',
      dataTypes: ['personal', 'voting'],
      sensitivityScore: 0.8,
      processingComplexity: 0.6,
      retentionPeriod: 365 * 24 * 60 * 60 * 1000,
      accessControls: ['encryption', 'authentication'],
      encryption: true,
      anonymization: false
    });

    expect(dataFlow.id).toBe('test-flow');
    expect(dataFlow.encryption).toBe(true);
    expect(dataFlow.anonymization).toBe(false);
  });

  test('threat assessment', () => {
    const dataFlow = createDataFlow({
      id: 'high-risk-flow',
      name: 'High Risk Data Flow',
      source: 'user',
      destination: 'external-api',
      dataTypes: ['personal', 'sensitive'],
      sensitivityScore: 0.9,
      processingComplexity: 0.8,
      retentionPeriod: 2 * 365 * 24 * 60 * 60 * 1000,
      accessControls: [],
      encryption: false,
      anonymization: false
    });

    const assessment = threatManager.assessThreats(dataFlow);
    
    expect(assessment.overallRisk).toBeGreaterThan(0.5);
    expect(assessment.threats.length).toBeGreaterThan(0);
    expect(assessment.recommendations.length).toBeGreaterThan(0);
  });

  test('quick privacy assessment', () => {
    const dataFlow = createDataFlow({
      id: 'low-risk-flow',
      name: 'Low Risk Data Flow',
      source: 'user',
      destination: 'database',
      dataTypes: ['aggregated'],
      sensitivityScore: 0.2,
      processingComplexity: 0.3,
      retentionPeriod: 30 * 24 * 60 * 60 * 1000,
      accessControls: ['encryption', 'authentication', 'authorization'],
      encryption: true,
      anonymization: true
    });

    const assessment = quickPrivacyAssessment(dataFlow);
    
    expect(assessment.riskLevel).toBe('low');
    expect(assessment.recommendations.length).toBeGreaterThan(0);
  });

  test('retention policy management', () => {
    const policy = threatManager.getRetentionPolicy('ballots');
    
    expect(policy).toBeDefined();
    expect(policy?.dataType).toBe('ballots');
    expect(policy?.retentionPeriod).toBe(12 * 30 * 24 * 60 * 60 * 1000);
    expect(policy?.autoDelete).toBe(true);
  });

  test('data deletion check', () => {
    const oldDate = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000); // 2 years ago
    const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    expect(threatManager.shouldDeleteData('ballots', oldDate)).toBe(true);
    expect(threatManager.shouldDeleteData('ballots', recentDate)).toBe(false);
  });

  test('data anonymization check', () => {
    const oldDate = new Date(Date.now() - 8 * 30 * 24 * 60 * 60 * 1000); // 8 months ago
    const recentDate = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000); // 3 months ago
    
    expect(threatManager.shouldAnonymizeData('ballots', oldDate)).toBe(true);
    expect(threatManager.shouldAnonymizeData('ballots', recentDate)).toBe(false);
  });
});

// ============================================================================
// LEGAL COMPLIANCE TESTING
// ============================================================================

describe('Legal Compliance', () => {
  let complianceManager: CommunicationComplianceManager;

  beforeEach(() => {
    complianceManager = new CommunicationComplianceManager();
  });

  test('COPPA compliance check', () => {
    expect(requiresCOPPACompliance(12)).toBe(true);
    expect(requiresCOPPACompliance(15)).toBe(true);
    expect(requiresCOPPACompliance(16)).toBe(false);
    expect(requiresCOPPACompliance(18)).toBe(false);
  });

  test('COPPA requirements', () => {
    const requirements12 = getCOPPARequirements(12);
    expect(requirements12.parentalConsent).toBe(true);
    expect(requirements12.guardianConsent).toBe(false);
    expect(requirements12.dataRestrictions).toBe(true);
    expect(requirements12.marketingRestrictions).toBe(true);

    const requirements15 = getCOPPARequirements(15);
    expect(requirements15.parentalConsent).toBe(false);
    expect(requirements15.guardianConsent).toBe(true);
    expect(requirements15.dataRestrictions).toBe(false);
    expect(requirements15.marketingRestrictions).toBe(true);

    const requirements18 = getCOPPARequirements(18);
    expect(requirements18.parentalConsent).toBe(false);
    expect(requirements18.guardianConsent).toBe(false);
    expect(requirements18.dataRestrictions).toBe(false);
    expect(requirements18.marketingRestrictions).toBe(false);
  });

  test('consent recording', async () => {
    const userId = 'test-user';
    const type = 'email';
    
    await complianceManager.recordConsent(userId, type, true, {
      consentMethod: 'explicit',
      legalBasis: 'consent',
      purpose: 'communication'
    });
    
    const hasConsent = await complianceManager.hasConsent(userId, type);
    expect(hasConsent).toBe(true);
  });

  test('consent withdrawal', async () => {
    const userId = 'test-user';
    const type = 'email';
    
    // Grant consent
    await complianceManager.recordConsent(userId, type, true);
    expect(await complianceManager.hasConsent(userId, type)).toBe(true);
    
    // Withdraw consent
    await complianceManager.recordConsent(userId, type, false);
    expect(await complianceManager.hasConsent(userId, type)).toBe(false);
  });

  test('data subject rights', async () => {
    const userId = 'test-user';
    const rights = await complianceManager.getDataSubjectRights(userId);
    
    expect(rights.userId).toBe(userId);
    expect(rights.rights.access).toBe(true);
    expect(rights.rights.erasure).toBe(true);
    expect(rights.rights.portability).toBe(true);
  });

  test('compliance audit', async () => {
    const audit = await complianceManager.runComplianceAudit();
    
    expect(audit.timestamp).toBeDefined();
    expect(audit.complianceScore).toBeGreaterThanOrEqual(0);
    expect(audit.complianceScore).toBeLessThanOrEqual(100);
    expect(audit.recommendations).toBeDefined();
    expect(audit.nextAuditDate).toBeDefined();
  });
});

// ============================================================================
// SOCIAL DISCOVERY PRIVACY TESTING
// ============================================================================

describe('Social Discovery Privacy', () => {
  let socialDiscoveryManager: PrivacyAwareSocialDiscoveryManager;

  beforeEach(() => {
    socialDiscoveryManager = new PrivacyAwareSocialDiscoveryManager();
  });

  test('similar users with privacy protection', async () => {
    const userId = 'test-user';
    const userInterests = ['environment', 'education'];
    const pollId = 'test-poll';
    
    const similarUsers = await socialDiscoveryManager.findSimilarUsers(userId, userInterests, pollId);
    
    expect(similarUsers).toBeDefined();
    expect(Array.isArray(similarUsers)).toBe(true);
    
    // All results should be aggregated
    similarUsers.forEach(user => {
      expect(user.type).toBe('aggregated');
      expect(user.privacyMetadata.kAnonymity).toBe(true);
      expect(user.privacyMetadata.differentialPrivacy).toBe(true);
    });
  });

  test('cross-demographic insights', async () => {
    const userProfile = {
      id: 'test-user',
      age: 25,
      education: 'college',
      location: 'CA',
      interests: ['environment'],
      votingHistory: [],
      demographics: {
        ageGroup: '25-34',
        education: 'college',
        location: 'CA'
      }
    };
    
    const aggregatedInsights = {
      demographicBreakdowns: [
        {
          ageGroup: '35-50',
          education: 'graduate',
          topCandidate: { id: 'candidate1', name: 'Alice' },
          confidence: 0.8,
          userCount: 75
        }
      ]
    };
    
    const insights = await socialDiscoveryManager.getCrossDemographicInsights(userProfile, aggregatedInsights);
    
    expect(insights).toBeDefined();
    expect(Array.isArray(insights)).toBe(true);
    
    insights.forEach(insight => {
      expect(insight.privacyProtected).toBe(true);
      expect(insight.userCount).toBeGreaterThanOrEqual(50);
    });
  });

  test('local similarity computation', async () => {
    const userInterests = ['environment', 'education'];
    const pollId = 'test-poll';
    
    const clusterInsight = await socialDiscoveryManager.computeLocalSimilarity(userInterests, pollId);
    
    expect(clusterInsight).toBeDefined();
    expect(clusterInsight.privacyProtected).toBe(true);
    expect(clusterInsight.insights).toBeDefined();
    
    clusterInsight.insights.forEach(insight => {
      expect(insight.privacyProtected).toBe(true);
    });
  });

  test('public centroids system', () => {
    const centroids = socialDiscoveryManager.getPublicCentroids();
    
    expect(centroids).toBeDefined();
    expect(Array.isArray(centroids)).toBe(true);
    
    centroids.forEach(centroid => {
      expect(centroid.privacyMetadata.kAnonymity).toBe(true);
      expect(centroid.userCount).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// DATA RETENTION TESTING
// ============================================================================

describe('Data Retention', () => {
  let retentionManager: DataRetentionManager;

  beforeEach(() => {
    retentionManager = new DataRetentionManager(null); // Mock supabase client
  });

  test('retention policy retrieval', () => {
    const policy = retentionManager.getRetentionPolicy('ballots');
    
    expect(policy).toBeDefined();
    expect(policy?.dataType).toBe('ballots');
    expect(policy?.retentionPeriod).toBe(12 * 30 * 24 * 60 * 60 * 1000);
    expect(policy?.autoDelete).toBe(true);
  });

  test('data retention check', () => {
    const oldDate = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000); // 2 years ago
    const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    expect(retentionManager.shouldDeleteData('ballots', oldDate)).toBe(true);
    expect(retentionManager.shouldDeleteData('ballots', recentDate)).toBe(false);
  });

  test('data anonymization check', () => {
    const oldDate = new Date(Date.now() - 8 * 30 * 24 * 60 * 60 * 1000); // 8 months ago
    const recentDate = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000); // 3 months ago
    
    expect(retentionManager.shouldAnonymizeData('ballots', oldDate)).toBe(true);
    expect(retentionManager.shouldAnonymizeData('ballots', recentDate)).toBe(false);
  });

  test('exception handling', () => {
    const oldDate = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000); // 2 years ago
    const exceptions = ['legal_hold'];
    
    expect(retentionManager.shouldDeleteData('ballots', oldDate, exceptions)).toBe(false);
    expect(retentionManager.shouldAnonymizeData('ballots', oldDate, exceptions)).toBe(false);
  });

  test('data retention utility functions', () => {
    expect(shouldRetainData('ballots', ['legal_hold'])).toBe(true);
    expect(shouldRetainData('ballots', ['active_account'])).toBe(true);
    expect(shouldRetainData('ballots', ['normal_operation'])).toBe(false);
    
    const age = calculateDataAge(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    expect(age).toBe(30);
    
    const period = formatRetentionPeriod(365 * 24 * 60 * 60 * 1000);
    expect(period).toBe('1 year');
  });
});

// ============================================================================
// INTEGRATION TESTING
// ============================================================================

describe('Privacy Integration Tests', () => {
  test('end-to-end privacy protection', async () => {
    // Test complete privacy protection pipeline
    const dpManager = new DifferentialPrivacyManager();
    const socialDiscoveryManager = new PrivacyAwareSocialDiscoveryManager();
    const complianceManager = new CommunicationComplianceManager();
    
    // 1. Test differential privacy
    const pollId = 'integration-test';
    const data = [{ category: 'A', count: 150 }];
    const breakdown = dpManager.createPrivacyAwareBreakdown(data, pollId, 'public', 0.5);
    
    expect(breakdown.privacyConfig.context).toBe('public');
    expect(breakdown.metadata.privacyProtectedGroups).toBeGreaterThan(0);
    
    // 2. Test social discovery
    const similarUsers = await socialDiscoveryManager.findSimilarUsers('user1', ['environment'], pollId);
    expect(similarUsers.every(user => user.type === 'aggregated')).toBe(true);
    
    // 3. Test compliance
    await complianceManager.recordConsent('user1', 'email', true);
    const hasConsent = await complianceManager.hasConsent('user1', 'email');
    expect(hasConsent).toBe(true);
  });

  test('privacy budget management', () => {
    const dpManager = new DifferentialPrivacyManager();
    const pollId = 'budget-test';
    
    // Allocate epsilon budget
    const success1 = dpManager.allocateEpsilon(pollId, 0.3, 'breakdown-analysis');
    expect(success1).toBe(true);
    
    const success2 = dpManager.allocateEpsilon(pollId, 0.4, 'trend-analysis');
    expect(success2).toBe(true);
    
    // Try to exceed budget
    const success3 = dpManager.allocateEpsilon(pollId, 0.4, 'additional-analysis');
    expect(success3).toBe(false);
    
    const status = dpManager.getBudgetStatus(pollId);
    expect(status.remaining).toBe(0.3);
    expect(status.used).toBe(0.7);
  });
});

// ============================================================================
// PERFORMANCE TESTING
// ============================================================================

describe('Privacy Performance Tests', () => {
  test('differential privacy performance', () => {
    const dpManager = new DifferentialPrivacyManager();
    const startTime = performance.now();
    
    // Generate 1000 DP counts
    for (let i = 0; i < 1000; i++) {
      dpCount(100, 0.8);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(100); // Should complete in less than 100ms
  });

  test('k-anonymity performance', () => {
    const startTime = performance.now();
    
    // Test 1000 k-anonymity checks
    for (let i = 0; i < 1000; i++) {
      meetsKAnonymity(Math.floor(Math.random() * 200), 'public');
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(50); // Should complete in less than 50ms
  });
});

// ============================================================================
// EXPORTED TEST SUITE
// ============================================================================

export const PrivacyTestSuite = {
  differentialPrivacy: {
    laplaceNoise,
    dpCount,
    showBucket
  },
  kAnonymity: {
    meetsKAnonymity,
    applyDifferentialPrivacy
  },
  linddun: {
    createDataFlow,
    quickPrivacyAssessment
  },
  compliance: {
    requiresCOPPACompliance,
    getCOPPARequirements
  },
  retention: {
    shouldRetainData,
    calculateDataAge,
    formatRetentionPeriod
  }
};

export default PrivacyTestSuite;

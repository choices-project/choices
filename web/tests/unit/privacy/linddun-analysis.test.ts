/**
 * @jest-environment node
 */
import { PrivacyThreatAssessmentManager, type DataFlow } from '@/lib/privacy/linddun-analysis';

describe('PrivacyThreatAssessmentManager', () => {
  it('aggregates threats and assigns status without withOptional', () => {
    const mgr = new PrivacyThreatAssessmentManager();
    const flow: DataFlow = {
      id: 'df-1',
      name: 'Analytics Events',
      source: 'webapp',
      destination: 'analytics',
      dataTypes: ['interaction'],
      sensitivityScore: 0.9,
      processingComplexity: 0.9,
      retentionPeriod: 365 * 24 * 60 * 60 * 1000,
      accessControls: [],
      encryption: false,
      anonymization: false,
    };
    const assessment = mgr.assessThreats(flow);
    expect(Array.isArray(assessment.threats)).toBe(true);
    // high-risk flow should surface threats
    expect(assessment.threats.length).toBeGreaterThan(0);
    // status should be derived deterministically based on computed risk levels
    for (const t of assessment.threats) {
      expect(['requires_attention', 'mitigated', 'acceptable']).toContain(t.status);
      expect(t.riskLevel).toBeGreaterThanOrEqual(0);
      expect(t.riskLevel).toBeLessThanOrEqual(1);
    }
    // overall score bounded and recommendations present
    expect(assessment.overallRisk).toBeGreaterThanOrEqual(0);
    expect(assessment.overallRisk).toBeLessThanOrEqual(1);
    expect(Array.isArray(assessment.recommendations)).toBe(true);
  });
});



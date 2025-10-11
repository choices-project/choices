// ============================================================================
// PHASE 2: LINDDUN PRIVACY THREAT MODELING
// ============================================================================
// Agent A2 - Privacy Specialist
// 
// This module implements the LINDDUN privacy threat modeling framework
// for the Ranked Choice Democracy Revolution platform.
// 
// Features:
// - Comprehensive LINDDUN threat analysis
// - Privacy risk assessment and scoring
// - Mitigation strategy recommendations
// - Data flow privacy analysis
// - Retention policy enforcement

import { withOptional } from '@/lib/utils/objects';
// 
// Created: January 15, 2025
// Status: Phase 2 Implementation
// ============================================================================

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type LINDDUNThreat = {
  dimension: string;
  threat: string;
  mitigation: string;
  implementation: string;
  riskLevel: number;
  status: 'requires_attention' | 'mitigated' | 'acceptable';
}

export type DataFlow = {
  id: string;
  name: string;
  source: string;
  destination: string;
  dataTypes: string[];
  sensitivityScore: number;
  processingComplexity: number;
  retentionPeriod: number;
  accessControls: string[];
  encryption: boolean;
  anonymization: boolean;
}

export type ThreatAssessment = {
  overallRisk: number;
  threats: LINDDUNThreat[];
  recommendations: string[];
  complianceScore: number;
  mitigationStatus: {
    implemented: number;
    partial: number;
    missing: number;
  };
}

export type PrivacyRisk = {
  category: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  likelihood: number;
  mitigation: string;
  priority: number;
}

export type RetentionPolicy = {
  dataType: string;
  retentionPeriod: number; // milliseconds
  autoDelete: boolean;
  anonymizationAfter: number; // milliseconds
  legalBasis: string;
  purpose: string;
}

// ============================================================================
// LINDDUN THREAT MODEL
// ============================================================================

export const PRIVACY_THREAT_MODEL = {
  // Linkability: Can users be linked across sessions?
  linkability: {
    threat: "User tracking across polls and sessions",
    mitigation: "Ephemeral session tokens, no cross-poll correlation, session rotation",
    implementation: "Session token rotation, no persistent identifiers, poll isolation",
    riskLevel: 0.3
  },
  
  // Identifiability: Can users be identified?
  identifiability: {
    threat: "IP address + timing correlation, device fingerprinting",
    mitigation: "IP anonymization, timing jitter, k-anonymity gates, device diversity",
    implementation: "IP masking, random delays, group size thresholds, device rotation",
    riskLevel: 0.4
  },
  
  // Non-repudiation: Can users deny their actions?
  nonRepudiation: {
    threat: "Vote tampering claims, audit trail disputes",
    mitigation: "Merkle proofs, immutable audit logs, cryptographic signatures",
    implementation: "Cryptographic audit trails, tamper-evident logs, public verification",
    riskLevel: 0.2
  },
  
  // Detectability: Can actions be detected?
  detectability: {
    threat: "Vote pattern analysis, behavioral profiling",
    mitigation: "Differential privacy, noise injection, pattern obfuscation",
    implementation: "Laplace noise, epsilon budget management, aggregated insights only",
    riskLevel: 0.5
  },
  
  // Disclosure: Can data be disclosed?
  disclosure: {
    threat: "Data breach, subpoena, insider access",
    mitigation: "E2E encryption, minimal data retention, access controls",
    implementation: "Client-side encryption, automatic data purging, role-based access",
    riskLevel: 0.6
  },
  
  // Unawareness: Are users unaware of data collection?
  unawareness: {
    threat: "Hidden analytics, covert tracking, unclear consent",
    mitigation: "Transparent privacy policy, opt-in analytics, clear consent flows",
    implementation: "Clear consent flows, granular privacy controls, transparency dashboard",
    riskLevel: 0.3
  },
  
  // Non-compliance: Are privacy laws violated?
  nonCompliance: {
    threat: "GDPR, CCPA violations, regulatory penalties",
    mitigation: "Privacy by design, data minimization, user rights implementation",
    implementation: "Data subject rights, consent management, DPO, privacy impact assessments",
    riskLevel: 0.7
  }
};

// ============================================================================
// PRIVACY THREAT ASSESSMENT MANAGER
// ============================================================================

export class PrivacyThreatAssessmentManager {
  private retentionPolicies: Map<string, RetentionPolicy> = new Map();
  private dataFlows: Map<string, DataFlow> = new Map();

  constructor() {
    this.initializeDefaultRetentionPolicies();
  }

  // ============================================================================
  // LINDDUN THREAT ASSESSMENT
  // ============================================================================

  /**
   * Assess privacy threats using LINDDUN framework
   * @param dataFlow - Data flow to assess
   * @returns Comprehensive threat assessment
   */
  assessThreats(dataFlow: DataFlow): ThreatAssessment {
    const threats: LINDDUNThreat[] = [];
    
    // Assess each LINDDUN dimension
    for (const [dimension, model] of Object.entries(PRIVACY_THREAT_MODEL)) {
      const riskLevel = this.calculateRiskLevel(dataFlow, dimension);
      
      if (riskLevel > 0.3) {
        threats.push({
          dimension,
          threat: model.threat,
          mitigation: model.mitigation,
          implementation: model.implementation,
          riskLevel,
          status: riskLevel > 0.6 ? 'requires_attention' : 'acceptable'
        });
      }
    }
    
    const overallRisk = Math.max(...threats.map(t => t.riskLevel));
    const recommendations = this.generateRecommendations(threats);
    const complianceScore = this.calculateComplianceScore(threats);
    const mitigationStatus = this.calculateMitigationStatus(threats);
    
    return {
      overallRisk,
      threats,
      recommendations,
      complianceScore,
      mitigationStatus
    };
  }

  /**
   * Assess multiple data flows
   * @param dataFlows - Array of data flows to assess
   * @returns Aggregated threat assessment
   */
  assessMultipleDataFlows(dataFlows: DataFlow[]): ThreatAssessment {
    const allThreats: LINDDUNThreat[] = [];
    
    dataFlows.forEach(flow => {
      const assessment = this.assessThreats(flow);
      allThreats.push(...assessment.threats);
    });
    
    // Aggregate threats by dimension
    const aggregatedThreats = this.aggregateThreatsByDimension(allThreats);
    const overallRisk = Math.max(...aggregatedThreats.map(t => t.riskLevel));
    const recommendations = this.generateRecommendations(aggregatedThreats);
    const complianceScore = this.calculateComplianceScore(aggregatedThreats);
    const mitigationStatus = this.calculateMitigationStatus(aggregatedThreats);
    
    return {
      overallRisk,
      threats: aggregatedThreats,
      recommendations,
      complianceScore,
      mitigationStatus
    };
  }

  // ============================================================================
  // RISK CALCULATION
  // ============================================================================

  private calculateRiskLevel(dataFlow: DataFlow, dimension: string): number {
    const baseRisk = (PRIVACY_THREAT_MODEL as Record<string, any>)[dimension]?.riskLevel || 0;
    
    // Adjust risk based on data flow characteristics
    let adjustedRisk = baseRisk;
    
    // Higher sensitivity increases risk
    adjustedRisk += dataFlow.sensitivityScore * 0.2;
    
    // More complex processing increases risk
    adjustedRisk += dataFlow.processingComplexity * 0.1;
    
    // Longer retention increases risk
    adjustedRisk += Math.min(dataFlow.retentionPeriod / (365 * 24 * 60 * 60 * 1000), 2) * 0.1;
    
    // Encryption reduces risk
    if (dataFlow.encryption) {
      adjustedRisk -= 0.2;
    }
    
    // Anonymization reduces risk
    if (dataFlow.anonymization) {
      adjustedRisk -= 0.3;
    }
    
    // Access controls reduce risk
    adjustedRisk -= dataFlow.accessControls.length * 0.05;
    
    return Math.max(0, Math.min(1, adjustedRisk));
  }

  // ============================================================================
  // RECOMMENDATION GENERATION
  // ============================================================================

  private generateRecommendations(threats: LINDDUNThreat[]): string[] {
    const recommendations: string[] = [];
    
    // Group threats by priority
    const highPriorityThreats = threats.filter(t => t.riskLevel > 0.6);
    const mediumPriorityThreats = threats.filter(t => t.riskLevel > 0.3 && t.riskLevel <= 0.6);
    
    if (highPriorityThreats.length > 0) {
      recommendations.push("URGENT: Address high-priority privacy threats immediately");
      highPriorityThreats.forEach(threat => {
        recommendations.push(`- ${threat.dimension}: ${threat.mitigation}`);
      });
    }
    
    if (mediumPriorityThreats.length > 0) {
      recommendations.push("MEDIUM: Implement privacy mitigations for medium-priority threats");
      mediumPriorityThreats.forEach(threat => {
        recommendations.push(`- ${threat.dimension}: ${threat.mitigation}`);
      });
    }
    
    // General recommendations
    recommendations.push("Implement privacy by design principles");
    recommendations.push("Conduct regular privacy impact assessments");
    recommendations.push("Maintain comprehensive audit trails");
    recommendations.push("Implement data minimization practices");
    
    return recommendations;
  }

  // ============================================================================
  // COMPLIANCE SCORING
  // ============================================================================

  private calculateComplianceScore(threats: LINDDUNThreat[]): number {
    if (threats.length === 0) return 100;
    
    const totalRisk = threats.reduce((sum, threat) => sum + threat.riskLevel, 0);
    const averageRisk = totalRisk / threats.length;
    
    // Convert risk to compliance score (0-100)
    return Math.max(0, Math.round((1 - averageRisk) * 100));
  }

  private calculateMitigationStatus(threats: LINDDUNThreat[]): {
    implemented: number;
    partial: number;
    missing: number;
  } {
    let implemented = 0;
    let partial = 0;
    let missing = 0;
    
    threats.forEach(threat => {
      switch (threat.status) {
        case 'mitigated':
          implemented++;
          break;
        case 'acceptable':
          partial++;
          break;
        case 'requires_attention':
          missing++;
          break;
      }
    });
    
    return { implemented, partial, missing };
  }

  // ============================================================================
  // THREAT AGGREGATION
  // ============================================================================

  private aggregateThreatsByDimension(threats: LINDDUNThreat[]): LINDDUNThreat[] {
    const dimensionMap = new Map<string, LINDDUNThreat[]>();
    
    threats.forEach(threat => {
      if (!dimensionMap.has(threat.dimension)) {
        dimensionMap.set(threat.dimension, []);
      }
      dimensionMap.get(threat.dimension)!.push(threat);
    });
    
    const aggregated: LINDDUNThreat[] = [];
    
    dimensionMap.forEach((dimensionThreats, _dimension) => {
      const maxRisk = Math.max(...dimensionThreats.map(t => t.riskLevel));
      const representativeThreat = dimensionThreats.find(t => t.riskLevel === maxRisk)!;
      
      aggregated.push(withOptional(representativeThreat, {
        riskLevel: maxRisk,
        status: maxRisk > 0.6 ? 'requires_attention' : 'acceptable'
      }));
    });
    
    return aggregated;
  }

  // ============================================================================
  // DATA FLOW MANAGEMENT
  // ============================================================================

  /**
   * Register a data flow for assessment
   * @param dataFlow - Data flow to register
   */
  registerDataFlow(dataFlow: DataFlow): void {
    this.dataFlows.set(dataFlow.id, dataFlow);
  }

  /**
   * Get all registered data flows
   * @returns Array of all data flows
   */
  getAllDataFlows(): DataFlow[] {
    return Array.from(this.dataFlows.values());
  }

  /**
   * Assess all registered data flows
   * @returns Comprehensive threat assessment
   */
  assessAllDataFlows(): ThreatAssessment {
    const allFlows = this.getAllDataFlows();
    return this.assessMultipleDataFlows(allFlows);
  }

  // ============================================================================
  // RETENTION POLICY MANAGEMENT
  // ============================================================================

  private initializeDefaultRetentionPolicies(): void {
    const defaultPolicies: RetentionPolicy[] = [
      {
        dataType: 'ballots',
        retentionPeriod: 12 * 30 * 24 * 60 * 60 * 1000, // 12 months
        autoDelete: true,
        anonymizationAfter: 6 * 30 * 24 * 60 * 60 * 1000, // 6 months
        legalBasis: 'legitimate_interest',
        purpose: 'election_integrity'
      },
      {
        dataType: 'logs',
        retentionPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days
        autoDelete: true,
        anonymizationAfter: 30 * 24 * 60 * 60 * 1000, // 30 days
        legalBasis: 'legitimate_interest',
        purpose: 'security_monitoring'
      },
      {
        dataType: 'snapshots',
        retentionPeriod: 24 * 30 * 24 * 60 * 60 * 1000, // 24 months
        autoDelete: false,
        anonymizationAfter: 0, // Never anonymize
        legalBasis: 'legal_obligation',
        purpose: 'audit_trail'
      },
      {
        dataType: 'analytics',
        retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
        autoDelete: true,
        anonymizationAfter: 0, // Already aggregated
        legalBasis: 'consent',
        purpose: 'service_improvement'
      }
    ];

    defaultPolicies.forEach(policy => {
      this.retentionPolicies.set(policy.dataType, policy);
    });
  }

  /**
   * Get retention policy for a data type
   * @param dataType - Type of data
   * @returns Retention policy or null
   */
  getRetentionPolicy(dataType: string): RetentionPolicy | null {
    return this.retentionPolicies.get(dataType) || null;
  }

  /**
   * Check if data should be deleted based on retention policy
   * @param dataType - Type of data
   * @param createdAt - When the data was created
   * @returns Whether data should be deleted
   */
  shouldDeleteData(dataType: string, createdAt: Date): boolean {
    const policy = this.getRetentionPolicy(dataType);
    if (!policy || !policy.autoDelete) {
      return false;
    }

    const age = Date.now() - createdAt.getTime();
    return age > policy.retentionPeriod;
  }

  /**
   * Check if data should be anonymized based on retention policy
   * @param dataType - Type of data
   * @param createdAt - When the data was created
   * @returns Whether data should be anonymized
   */
  shouldAnonymizeData(dataType: string, createdAt: Date): boolean {
    const policy = this.getRetentionPolicy(dataType);
    if (!policy || policy.anonymizationAfter === 0) {
      return false;
    }

    const age = Date.now() - createdAt.getTime();
    return age > policy.anonymizationAfter;
  }
}

// ============================================================================
// EXPORTED UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a data flow for assessment
 * @param config - Data flow configuration
 * @returns Data flow object
 */
export function createDataFlow(config: {
  id: string;
  name: string;
  source: string;
  destination: string;
  dataTypes: string[];
  sensitivityScore: number;
  processingComplexity: number;
  retentionPeriod: number;
  accessControls?: string[];
  encryption?: boolean;
  anonymization?: boolean;
}): DataFlow {
  return {
    id: config.id,
    name: config.name,
    source: config.source,
    destination: config.destination,
    dataTypes: config.dataTypes,
    sensitivityScore: config.sensitivityScore,
    processingComplexity: config.processingComplexity,
    retentionPeriod: config.retentionPeriod,
    accessControls: config.accessControls || [],
    encryption: config.encryption || false,
    anonymization: config.anonymization || false
  };
}

/**
 * Quick privacy risk assessment
 * @param dataFlow - Data flow to assess
 * @returns Risk level and recommendations
 */
export function quickPrivacyAssessment(dataFlow: DataFlow): {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
} {
  const manager = new PrivacyThreatAssessmentManager();
  const assessment = manager.assessThreats(dataFlow);
  
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (assessment.overallRisk < 0.3) {
    riskLevel = 'low';
  } else if (assessment.overallRisk < 0.5) {
    riskLevel = 'medium';
  } else if (assessment.overallRisk < 0.7) {
    riskLevel = 'high';
  } else {
    riskLevel = 'critical';
  }
  
  return {
    riskLevel,
    recommendations: assessment.recommendations
  };
}

// ============================================================================
// EXPORTED CLASS
// ============================================================================

export default PrivacyThreatAssessmentManager;

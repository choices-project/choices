/**
 * Data Transformation Pipeline
 * 
 * Optimized data transformation pipeline focused on state and federal government data.
 * Transforms raw API responses into structured, normalized data for database storage.
 */

import { logger } from '@/lib/logger';
import type { 
  AddressLookupResult, 
  Representative,
  CandidateCardV1 
} from '@/features/civics/schemas';
import type { 
  TransformedRepresentative,
  TransformedCandidateCard 
} from '@/lib/integrations/google-civic/transformers';
import type { 
  TransformedProPublicaMember,
  TransformedProPublicaBill 
} from '@/lib/integrations/propublica/transformers';

export interface GovernmentLevel {
  level: 'federal' | 'state' | 'local';
  jurisdiction: string;
  offices: string[];
  priority: number;
}

export interface DataTarget {
  id: string;
  name: string;
  level: 'federal' | 'state' | 'local';
  jurisdiction: string;
  population: number;
  priority: number;
  dataSources: string[];
  estimatedRecords: number;
}

export interface TransformationResult {
  source: string;
  level: 'federal' | 'state' | 'local';
  recordsProcessed: number;
  recordsTransformed: number;
  recordsValid: number;
  errors: string[];
  quality: {
    completeness: number;
    accuracy: number;
    consistency: number;
  };
}

export interface NormalizedRepresentative {
  id: string;
  name: string;
  party: string;
  office: string;
  level: 'federal' | 'state' | 'local';
  jurisdiction: string;
  district?: string;
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  votingRecord?: {
    totalVotes: number;
    missedVotes: number;
    missedVotesPct: number;
    votesWithPartyPct: number;
    votesAgainstPartyPct: number;
  };
  recentVotes?: Array<{
    bill: string;
    vote: 'yes' | 'no' | 'abstain';
    date: string;
    result: string;
  }>;
  sources: string[];
  lastUpdated: string;
}

export interface NormalizedBill {
  id: string;
  title: string;
  shortTitle?: string;
  billNumber: string;
  billType: string;
  level: 'federal' | 'state' | 'local';
  jurisdiction: string;
  congress?: string;
  session?: string;
  introducedDate: string;
  sponsor: {
    name: string;
    party: string;
    jurisdiction: string;
  };
  summary?: string;
  status: string;
  lastAction: string;
  lastActionDate: string;
  cosponsors: number;
  cosponsorsByParty: {
    republican?: number;
    democrat?: number;
    independent?: number;
  };
  committees: string[];
  subjects: string[];
  sources: string[];
  lastUpdated: string;
}

/**
 * Government levels and their priority offices for data collection
 */
export const GOVERNMENT_LEVELS: GovernmentLevel[] = [
  {
    level: 'federal',
    jurisdiction: 'US',
    offices: [
      'President',
      'Vice President', 
      'U.S. Senate',
      'U.S. House of Representatives',
      'Supreme Court'
    ],
    priority: 1
  },
  {
    level: 'state',
    jurisdiction: 'State',
    offices: [
      'Governor',
      'Lieutenant Governor',
      'State Senate',
      'State House of Representatives',
      'Attorney General',
      'Secretary of State',
      'Treasurer',
      'Auditor'
    ],
    priority: 2
  },
  {
    level: 'local',
    jurisdiction: 'Local',
    offices: [
      'Mayor',
      'City Council',
      'County Executive',
      'County Council',
      'School Board',
      'Sheriff',
      'District Attorney'
    ],
    priority: 3
  }
];

/**
 * Priority states for initial data collection (by population and political importance)
 */
export const PRIORITY_STATES = [
  { code: 'CA', name: 'California', population: 39538223, priority: 1 },
  { code: 'TX', name: 'Texas', population: 29145505, priority: 2 },
  { code: 'FL', name: 'Florida', population: 21538187, priority: 3 },
  { code: 'NY', name: 'New York', population: 20201249, priority: 4 },
  { code: 'PA', name: 'Pennsylvania', population: 13002700, priority: 5 },
  { code: 'IL', name: 'Illinois', population: 12812508, priority: 6 },
  { code: 'OH', name: 'Ohio', population: 11799448, priority: 7 },
  { code: 'GA', name: 'Georgia', population: 10711908, priority: 8 },
  { code: 'NC', name: 'North Carolina', population: 10439388, priority: 9 },
  { code: 'MI', name: 'Michigan', population: 10037261, priority: 10 }
];

/**
 * Data transformation pipeline for government data
 */
export class DataTransformationPipeline {
  private targets: Map<string, DataTarget> = new Map();

  constructor() {
    this.initializeDataTargets();
  }

  /**
   * Initialize data collection targets
   */
  private initializeDataTargets(): void {
    // Federal targets
    this.targets.set('federal-congress', {
      id: 'federal-congress',
      name: 'US Congress',
      level: 'federal',
      jurisdiction: 'US',
      population: 331000000,
      priority: 1,
      dataSources: ['propublica', 'google-civic'],
      estimatedRecords: 535 // 435 House + 100 Senate
    });

    this.targets.set('federal-executive', {
      id: 'federal-executive',
      name: 'US Executive Branch',
      level: 'federal',
      jurisdiction: 'US',
      population: 331000000,
      priority: 1,
      dataSources: ['google-civic'],
      estimatedRecords: 2 // President + VP
    });

    // State targets for priority states
    for (const state of PRIORITY_STATES) {
      this.targets.set(`state-${state.code.toLowerCase()}`, {
        id: `state-${state.code.toLowerCase()}`,
        name: `${state.name} State Government`,
        level: 'state',
        jurisdiction: state.code,
        population: state.population,
        priority: state.priority,
        dataSources: ['google-civic', 'propublica'],
        estimatedRecords: this.estimateStateRecords(state.code)
      });
    }
  }

  /**
   * Estimate number of records for a state
   */
  private estimateStateRecords(stateCode: string): number {
    // Rough estimates based on typical state government structure
    const baseRecords = 50; // Governor, Lt Gov, AG, etc.
    const houseSeats = this.getEstimatedHouseSeats(stateCode);
    const senateSeats = this.getEstimatedSenateSeats(stateCode);
    
    return baseRecords + houseSeats + senateSeats;
  }

  /**
   * Get estimated house seats for a state
   */
  private getEstimatedHouseSeats(stateCode: string): number {
    // Rough estimates - in practice, you'd get this from actual data
    const estimates: Record<string, number> = {
      'CA': 80, 'TX': 150, 'FL': 120, 'NY': 150, 'PA': 203,
      'IL': 118, 'OH': 99, 'GA': 180, 'NC': 120, 'MI': 110
    };
    return estimates[stateCode] || 100;
  }

  /**
   * Get estimated senate seats for a state
   */
  private getEstimatedSenateSeats(stateCode: string): number {
    // Most states have around 30-50 senate seats
    return 40;
  }

  /**
   * Transform Google Civic data to normalized format
   */
  transformGoogleCivicData(
    data: AddressLookupResult,
    level: 'federal' | 'state' | 'local' = 'federal'
  ): TransformationResult {
    const errors: string[] = [];
    let recordsTransformed = 0;
    let recordsValid = 0;

    try {
      // Transform representatives
      const normalizedReps = data.representatives.map(rep => {
        recordsTransformed++;
        
        const normalized: NormalizedRepresentative = {
          id: rep.id,
          name: rep.name,
          party: rep.party,
          office: rep.office,
          level: this.determineLevel(rep.office),
          jurisdiction: data.state,
          district: rep.district,
          contact: rep.contact,
          socialMedia: rep.socialMedia,
          sources: ['google-civic'],
          lastUpdated: new Date().toISOString()
        };

        if (this.validateRepresentative(normalized)) {
          recordsValid++;
        } else {
          errors.push(`Invalid representative data: ${rep.name}`);
        }

        return normalized;
      });

      const completeness = recordsValid / recordsTransformed;
      const accuracy = this.calculateAccuracy(normalizedReps);
      const consistency = this.calculateConsistency(normalizedReps);

      return {
        source: 'google-civic',
        level,
        recordsProcessed: data.representatives.length,
        recordsTransformed,
        recordsValid,
        errors,
        quality: {
          completeness,
          accuracy,
          consistency
        }
      };
    } catch (error) {
      logger.error('Failed to transform Google Civic data', { error, data });
      return {
        source: 'google-civic',
        level,
        recordsProcessed: 0,
        recordsTransformed: 0,
        recordsValid: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        quality: { completeness: 0, accuracy: 0, consistency: 0 }
      };
    }
  }

  /**
   * Transform ProPublica data to normalized format
   */
  transformProPublicaData(
    members: TransformedProPublicaMember[],
    bills: TransformedProPublicaBill[],
    level: 'federal' | 'state' | 'local' = 'federal'
  ): TransformationResult {
    const errors: string[] = [];
    let recordsTransformed = 0;
    let recordsValid = 0;

    try {
      // Transform members
      const normalizedMembers = members.map(member => {
        recordsTransformed++;
        
        const normalized: NormalizedRepresentative = {
          id: member.id,
          name: member.name,
          party: member.party,
          office: member.office,
          level: this.determineLevel(member.office),
          jurisdiction: member.state,
          district: member.district,
          contact: member.contact,
          socialMedia: member.socialMedia,
          votingRecord: member.votingRecord,
          recentVotes: member.recentVotes,
          sources: ['propublica'],
          lastUpdated: new Date().toISOString()
        };

        if (this.validateRepresentative(normalized)) {
          recordsValid++;
        } else {
          errors.push(`Invalid member data: ${member.name}`);
        }

        return normalized;
      });

      // Transform bills
      const normalizedBills = bills.map(bill => {
        recordsTransformed++;
        
        const normalized: NormalizedBill = {
          id: bill.id,
          title: bill.title,
          shortTitle: bill.shortTitle,
          billNumber: bill.billNumber,
          billType: bill.billType,
          level: this.determineBillLevel(bill.billType),
          jurisdiction: 'US', // ProPublica is federal
          congress: bill.congress,
          introducedDate: bill.introducedDate,
          sponsor: {
            ...bill.sponsor,
            jurisdiction: 'US' // ProPublica is federal
          },
          summary: bill.summary,
          status: bill.status,
          lastAction: bill.lastAction,
          lastActionDate: bill.lastActionDate,
          cosponsors: bill.cosponsors,
          cosponsorsByParty: bill.cosponsorsByParty,
          committees: bill.committees,
          subjects: bill.subjects,
          sources: ['propublica'],
          lastUpdated: new Date().toISOString()
        };

        if (this.validateBill(normalized)) {
          recordsValid++;
        } else {
          errors.push(`Invalid bill data: ${bill.title}`);
        }

        return normalized;
      });

      const completeness = recordsValid / recordsTransformed;
      const accuracy = this.calculateAccuracy([...normalizedMembers, ...normalizedBills]);
      const consistency = this.calculateConsistency([...normalizedMembers, ...normalizedBills]);

      return {
        source: 'propublica',
        level,
        recordsProcessed: members.length + bills.length,
        recordsTransformed,
        recordsValid,
        errors,
        quality: {
          completeness,
          accuracy,
          consistency
        }
      };
    } catch (error) {
      logger.error('Failed to transform ProPublica data', { error, members, bills });
      return {
        source: 'propublica',
        level,
        recordsProcessed: 0,
        recordsTransformed: 0,
        recordsValid: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        quality: { completeness: 0, accuracy: 0, consistency: 0 }
      };
    }
  }

  /**
   * Determine government level from office name
   */
  private determineLevel(office: string): 'federal' | 'state' | 'local' {
    const officeLower = office.toLowerCase();
    
    if (officeLower.includes('u.s.') || officeLower.includes('united states') || 
        officeLower.includes('congress') || officeLower.includes('senate') ||
        officeLower.includes('house of representatives') || officeLower.includes('president')) {
      return 'federal';
    }
    
    if (officeLower.includes('state') || officeLower.includes('governor') ||
        officeLower.includes('state senate') || officeLower.includes('state house')) {
      return 'state';
    }
    
    return 'local';
  }

  /**
   * Determine bill level from bill type
   */
  private determineBillLevel(billType: string): 'federal' | 'state' | 'local' {
    // ProPublica bills are federal
    return 'federal';
  }

  /**
   * Validate representative data
   */
  private validateRepresentative(rep: NormalizedRepresentative): boolean {
    return !!(
      rep.id &&
      rep.name &&
      rep.party &&
      rep.office &&
      rep.level &&
      rep.jurisdiction
    );
  }

  /**
   * Validate bill data
   */
  private validateBill(bill: NormalizedBill): boolean {
    return !!(
      bill.id &&
      bill.title &&
      bill.billNumber &&
      bill.level &&
      bill.jurisdiction
    );
  }

  /**
   * Calculate data accuracy score
   */
  private calculateAccuracy(records: any[]): number {
    if (records.length === 0) return 0;
    
    let validFields = 0;
    let totalFields = 0;
    
    for (const record of records) {
      for (const [key, value] of Object.entries(record)) {
        totalFields++;
        if (value !== undefined && value !== null && value !== '') {
          validFields++;
        }
      }
    }
    
    return validFields / totalFields;
  }

  /**
   * Calculate data consistency score
   */
  private calculateConsistency(records: any[]): number {
    if (records.length === 0) return 0;
    
    // Check for consistent data formats, required fields, etc.
    let consistentRecords = 0;
    
    for (const record of records) {
      if (this.isRecordConsistent(record)) {
        consistentRecords++;
      }
    }
    
    return consistentRecords / records.length;
  }

  /**
   * Check if a record is consistent
   */
  private isRecordConsistent(record: any): boolean {
    // Check for required fields, proper formats, etc.
    return !!(
      record.id &&
      record.name &&
      record.lastUpdated &&
      typeof record.lastUpdated === 'string' &&
      !isNaN(Date.parse(record.lastUpdated))
    );
  }

  /**
   * Get data targets by priority
   */
  getDataTargetsByPriority(): DataTarget[] {
    return Array.from(this.targets.values())
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get data targets by level
   */
  getDataTargetsByLevel(level: 'federal' | 'state' | 'local'): DataTarget[] {
    return Array.from(this.targets.values())
      .filter(target => target.level === level)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get estimated total records for all targets
   */
  getEstimatedTotalRecords(): number {
    return Array.from(this.targets.values())
      .reduce((total, target) => total + target.estimatedRecords, 0);
  }

  /**
   * Get priority states for data collection
   */
  getPriorityStates(): typeof PRIORITY_STATES {
    return PRIORITY_STATES;
  }
}

/**
 * Create default data transformation pipeline
 */
export function createDataTransformationPipeline(): DataTransformationPipeline {
  return new DataTransformationPipeline();
}

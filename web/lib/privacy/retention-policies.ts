// ============================================================================
// PHASE 2: DATA RETENTION POLICIES IMPLEMENTATION
// ============================================================================

import { withOptional } from '../util/objects';
// Agent A2 - Privacy Specialist
// 
// This module implements data retention policies and automatic purging
// for the Ranked Choice Democracy Revolution platform.
// 
// Features:
// - Automated data retention policy enforcement
// - Scheduled data purging and anonymization
// - Retention period management
// - Legal basis tracking
// - Audit trail for data lifecycle
// 
// Created: January 15, 2025
// Status: Phase 2 Implementation
// ============================================================================

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type RetentionPolicy = {
  dataType: string;
  retentionPeriod: number; // milliseconds
  autoDelete: boolean;
  anonymizationAfter: number; // milliseconds
  legalBasis: 'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation';
  purpose: string;
  description: string;
  exceptions: string[];
  lastUpdated: Date;
  createdBy: string;
}

export type DataLifecycleEvent = {
  id: string;
  dataType: string;
  recordId: string;
  event: 'created' | 'accessed' | 'modified' | 'anonymized' | 'deleted' | 'retention_extended';
  timestamp: Date;
  userId?: string;
  reason: string;
  metadata: Record<string, any>;
}

export type RetentionAudit = {
  timestamp: Date;
  dataType: string;
  recordsProcessed: number;
  recordsDeleted: number;
  recordsAnonymized: number;
  errors: string[];
  duration: number;
  success: boolean;
}

export type DataRetentionStatus = {
  dataType: string;
  totalRecords: number;
  recordsToDelete: number;
  recordsToAnonymize: number;
  oldestRecord: Date;
  newestRecord: Date;
  nextCleanup: Date;
  lastCleanup?: Date;
  policy: RetentionPolicy;
}

export type PurgeResult = {
  success: boolean;
  recordsDeleted: number;
  recordsAnonymized: number;
  errors: string[];
  duration: number;
  dataType: string;
}

// ============================================================================
// DATA RETENTION MANAGER
// ============================================================================

export class DataRetentionManager {
  private policies: Map<string, RetentionPolicy> = new Map();
  private lifecycleEvents: DataLifecycleEvent[] = [];
  private supabaseClient: any; // Would be properly typed in production
  private cleanupSchedule: Map<string, NodeJS.Timeout> = new Map();

  constructor(supabaseClient: any) {
    this.supabaseClient = supabaseClient;
    this.initializeDefaultPolicies();
    this.scheduleCleanupTasks();
  }

  // ============================================================================
  // POLICY MANAGEMENT
  // ============================================================================

  /**
   * Initialize default retention policies
   */
  private initializeDefaultPolicies(): void {
    const defaultPolicies: RetentionPolicy[] = [
      {
        dataType: 'ballots',
        retentionPeriod: 12 * 30 * 24 * 60 * 60 * 1000, // 12 months
        autoDelete: true,
        anonymizationAfter: 6 * 30 * 24 * 60 * 60 * 1000, // 6 months
        legalBasis: 'legitimate_interest',
        purpose: 'election_integrity',
        description: 'Ballot data retained for election integrity and audit purposes',
        exceptions: ['legal_hold', 'ongoing_investigation'],
        lastUpdated: new Date(),
        createdBy: 'system'
      },
      {
        dataType: 'logs',
        retentionPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days
        autoDelete: true,
        anonymizationAfter: 30 * 24 * 60 * 60 * 1000, // 30 days
        legalBasis: 'legitimate_interest',
        purpose: 'security_monitoring',
        description: 'System logs retained for security monitoring and debugging',
        exceptions: ['security_incident', 'audit_requirement'],
        lastUpdated: new Date(),
        createdBy: 'system'
      },
      {
        dataType: 'snapshots',
        retentionPeriod: 24 * 30 * 24 * 60 * 60 * 1000, // 24 months
        autoDelete: false,
        anonymizationAfter: 0, // Never anonymize
        legalBasis: 'legal_obligation',
        purpose: 'audit_trail',
        description: 'Poll snapshots retained for audit trail and transparency',
        exceptions: ['legal_hold', 'regulatory_requirement'],
        lastUpdated: new Date(),
        createdBy: 'system'
      },
      {
        dataType: 'analytics',
        retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
        autoDelete: true,
        anonymizationAfter: 0, // Already aggregated
        legalBasis: 'consent',
        purpose: 'service_improvement',
        description: 'Analytics data retained for service improvement',
        exceptions: ['research_purpose', 'consent_extended'],
        lastUpdated: new Date(),
        createdBy: 'system'
      },
      {
        dataType: 'user_profiles',
        retentionPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
        autoDelete: true,
        anonymizationAfter: 180 * 24 * 60 * 60 * 1000, // 6 months
        legalBasis: 'consent',
        purpose: 'user_management',
        description: 'User profile data retained for account management',
        exceptions: ['active_account', 'legal_hold'],
        lastUpdated: new Date(),
        createdBy: 'system'
      }
    ];

    defaultPolicies.forEach(policy => {
      this.policies.set(policy.dataType, policy);
    });
  }

  /**
   * Get retention policy for a data type
   * @param dataType - Type of data
   * @returns Retention policy or null
   */
  getRetentionPolicy(dataType: string): RetentionPolicy | null {
    return this.policies.get(dataType) || null;
  }

  /**
   * Update retention policy
   * @param dataType - Type of data
   * @param policy - Updated policy
   */
  async updateRetentionPolicy(dataType: string, policy: Partial<RetentionPolicy>): Promise<void> {
    const existingPolicy = this.policies.get(dataType);
    if (!existingPolicy) {
      throw new Error(`Retention policy not found for data type: ${dataType}`);
    }

    const updatedPolicy: RetentionPolicy = withOptional(existingPolicy, Object.assign({}, policy, {
      lastUpdated: new Date()
    }));

    this.policies.set(dataType, updatedPolicy);
    
    // Log the policy update
    await this.logLifecycleEvent({
      dataType,
      recordId: 'policy',
      event: 'modified',
      reason: 'policy_update',
      metadata: { changes: policy }
    });
  }

  // ============================================================================
  // DATA LIFECYCLE MANAGEMENT
  // ============================================================================

  /**
   * Check if data should be deleted based on retention policy
   * @param dataType - Type of data
   * @param createdAt - When the data was created
   * @param exceptions - Any exceptions to the policy
   * @returns Whether data should be deleted
   */
  shouldDeleteData(
    dataType: string, 
    createdAt: Date, 
    exceptions: string[] = []
  ): boolean {
    const policy = this.getRetentionPolicy(dataType);
    if (!policy?.autoDelete) {
      return false;
    }

    // Check for exceptions
    if (exceptions.some(exception => policy.exceptions.includes(exception))) {
      return false;
    }

    const age = Date.now() - createdAt.getTime();
    return age > policy.retentionPeriod;
  }

  /**
   * Check if data should be anonymized based on retention policy
   * @param dataType - Type of data
   * @param createdAt - When the data was created
   * @param exceptions - Any exceptions to the policy
   * @returns Whether data should be anonymized
   */
  shouldAnonymizeData(
    dataType: string, 
    createdAt: Date, 
    exceptions: string[] = []
  ): boolean {
    const policy = this.getRetentionPolicy(dataType);
    if (!policy || policy.anonymizationAfter === 0) {
      return false;
    }

    // Check for exceptions
    if (exceptions.some(exception => policy.exceptions.includes(exception))) {
      return false;
    }

    const age = Date.now() - createdAt.getTime();
    return age > policy.anonymizationAfter;
  }

  /**
   * Get data retention status for a data type
   * @param dataType - Type of data
   * @returns Retention status
   */
  async getRetentionStatus(dataType: string): Promise<DataRetentionStatus | null> {
    const policy = this.getRetentionPolicy(dataType);
    if (!policy) {
      return null;
    }

    try {
      // Get data statistics from database
      const stats = await this.getDataStatistics(dataType);
      
      // Calculate records to delete and anonymize
      const recordsToDelete = await this.countRecordsToDelete(dataType);
      const recordsToAnonymize = await this.countRecordsToAnonymize(dataType);
      
      // Calculate next cleanup time
      const nextCleanup = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      return withOptional(
        {
          dataType,
          totalRecords: stats.totalRecords,
          recordsToDelete,
          recordsToAnonymize,
          oldestRecord: stats.oldestRecord,
          newestRecord: stats.newestRecord,
          nextCleanup,
          policy
        },
        {
          lastCleanup: stats.lastCleanup
        }
      );
    } catch (error) {
      console.error(`Error getting retention status for ${dataType}:`, error);
      return null;
    }
  }

  // ============================================================================
  // AUTOMATED CLEANUP
  // ============================================================================

  /**
   * Schedule cleanup tasks for all data types
   */
  private scheduleCleanupTasks(): void {
    // Schedule daily cleanup at 2 AM
    const cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours
    const initialDelay = this.getTimeUntilNextCleanup();
    
    setTimeout(() => {
      this.runScheduledCleanup();
      setInterval(() => this.runScheduledCleanup(), cleanupInterval);
    }, initialDelay);
  }

  /**
   * Run scheduled cleanup for all data types
   */
  private async runScheduledCleanup(): Promise<void> {
    console.log('Starting scheduled data retention cleanup...');
    
    const cleanupPromises = Array.from(this.policies.keys()).map(dataType => 
      this.scheduleDataPurge(dataType)
    );
    
    try {
      await Promise.all(cleanupPromises);
      console.log('Scheduled data retention cleanup completed');
    } catch (error) {
      console.error('Error during scheduled cleanup:', error);
    }
  }

  /**
   * Schedule data purge for a specific data type
   * @param dataType - Type of data to purge
   * @returns Promise<PurgeResult>
   */
  async scheduleDataPurge(dataType: string): Promise<PurgeResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let recordsDeleted = 0;
    let recordsAnonymized = 0;

    try {
      const policy = this.getRetentionPolicy(dataType);
      if (!policy) {
        throw new Error(`No retention policy found for data type: ${dataType}`);
      }

      // Anonymize data first
      if (policy.anonymizationAfter > 0) {
        recordsAnonymized = await this.anonymizeOldData(dataType);
      }

      // Delete old data
      if (policy.autoDelete) {
        recordsDeleted = await this.deleteOldData(dataType);
      }

      // Log the cleanup
      await this.logLifecycleEvent({
        dataType,
        recordId: 'cleanup',
        event: 'deleted',
        reason: 'retention_policy',
        metadata: { 
          recordsDeleted, 
          recordsAnonymized,
          policy: policy.dataType
        }
      });

      return {
        success: true,
        recordsDeleted,
        recordsAnonymized,
        errors,
        duration: Date.now() - startTime,
        dataType
      };

    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        success: false,
        recordsDeleted,
        recordsAnonymized,
        errors,
        duration: Date.now() - startTime,
        dataType
      };
    }
  }

  // ============================================================================
  // DATA OPERATIONS
  // ============================================================================

  /**
   * Delete old data based on retention policy
   * @param dataType - Type of data to delete
   * @returns Number of records deleted
   */
  private async deleteOldData(dataType: string): Promise<number> {
    const policy = this.getRetentionPolicy(dataType);
    if (!policy) {
      throw new Error(`No retention policy found for data type: ${dataType}`);
    }

    const cutoffDate = new Date(Date.now() - policy.retentionPeriod);
    
    try {
      // Delete old records
      const { data, error } = await this.supabaseClient
        .from(this.getTableName(dataType))
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        throw new Error(`Failed to delete old ${dataType} data: ${error.message}`);
      }

      return data?.length || 0;
    } catch (error) {
      console.error(`Error deleting old ${dataType} data:`, error);
      throw error;
    }
  }

  /**
   * Anonymize old data based on retention policy
   * @param dataType - Type of data to anonymize
   * @returns Number of records anonymized
   */
  private async anonymizeOldData(dataType: string): Promise<number> {
    const policy = this.getRetentionPolicy(dataType);
    if (!policy) {
      throw new Error(`No retention policy found for data type: ${dataType}`);
    }

    const cutoffDate = new Date(Date.now() - policy.anonymizationAfter);
    
    try {
      // Anonymize old records
      const { data, error } = await this.supabaseClient
        .from(this.getTableName(dataType))
        .update({ 
          anonymized: true,
          anonymized_at: new Date().toISOString()
        })
        .lt('created_at', cutoffDate.toISOString())
        .eq('anonymized', false);

      if (error) {
        throw new Error(`Failed to anonymize old ${dataType} data: ${error.message}`);
      }

      return data?.length || 0;
    } catch (error) {
      console.error(`Error anonymizing old ${dataType} data:`, error);
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private getTimeUntilNextCleanup(): number {
    const now = new Date();
    const nextCleanup = new Date(now);
    nextCleanup.setHours(2, 0, 0, 0); // 2 AM
    
    if (nextCleanup <= now) {
      nextCleanup.setDate(nextCleanup.getDate() + 1);
    }
    
    return nextCleanup.getTime() - now.getTime();
  }

  private getTableName(dataType: string): string {
    const tableMapping: Record<string, string> = {
      'ballots': 'votes',
      'logs': 'error_logs',
      'snapshots': 'poll_snapshots',
      'analytics': 'analytics_data',
      'user_profiles': 'user_profiles'
    };
    
    return tableMapping[dataType] || dataType;
  }

  private async getDataStatistics(dataType: string): Promise<{
    totalRecords: number;
    oldestRecord: Date;
    newestRecord: Date;
    lastCleanup?: Date;
  }> {
    try {
      const tableName = this.getTableName(dataType);
      
      const { data, error } = await this.supabaseClient
        .from(tableName)
        .select('created_at')
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to get statistics for ${dataType}: ${error.message}`);
      }

      return {
        totalRecords: data.length,
        oldestRecord: data.length > 0 ? new Date(data[0].created_at) : new Date(),
        newestRecord: data.length > 0 ? new Date(data[data.length - 1].created_at) : new Date()
      };
    } catch (error) {
      console.error(`Error getting statistics for ${dataType}:`, error);
      return {
        totalRecords: 0,
        oldestRecord: new Date(),
        newestRecord: new Date()
      };
    }
  }

  private async countRecordsToDelete(dataType: string): Promise<number> {
    const policy = this.getRetentionPolicy(dataType);
    if (!policy?.autoDelete) {
      return 0;
    }

    const cutoffDate = new Date(Date.now() - policy.retentionPeriod);
    
    try {
      const { count, error } = await this.supabaseClient
        .from(this.getTableName(dataType))
        .select('*', { count: 'exact', head: true })
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        throw new Error(`Failed to count records to delete for ${dataType}: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error(`Error counting records to delete for ${dataType}:`, error);
      return 0;
    }
  }

  private async countRecordsToAnonymize(dataType: string): Promise<number> {
    const policy = this.getRetentionPolicy(dataType);
    if (!policy || policy.anonymizationAfter === 0) {
      return 0;
    }

    const cutoffDate = new Date(Date.now() - policy.anonymizationAfter);
    
    try {
      const { count, error } = await this.supabaseClient
        .from(this.getTableName(dataType))
        .select('*', { count: 'exact', head: true })
        .lt('created_at', cutoffDate.toISOString())
        .eq('anonymized', false);

      if (error) {
        throw new Error(`Failed to count records to anonymize for ${dataType}: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error(`Error counting records to anonymize for ${dataType}:`, error);
      return 0;
    }
  }

  private async logLifecycleEvent(event: Omit<DataLifecycleEvent, 'id' | 'timestamp'>): Promise<void> {
    const lifecycleEvent: DataLifecycleEvent = Object.assign({
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    }, event);

    this.lifecycleEvents.push(lifecycleEvent);
    
    // In production, this would be stored in a database
    console.log('Data lifecycle event logged:', lifecycleEvent);
  }
}

// ============================================================================
// EXPORTED UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if data should be retained based on exceptions
 * @param dataType - Type of data
 * @param exceptions - List of exceptions
 * @returns Whether data should be retained
 */
export function shouldRetainData(dataType: string, exceptions: string[]): boolean {
  const retentionExceptions = [
    'legal_hold',
    'ongoing_investigation',
    'audit_requirement',
    'regulatory_requirement',
    'active_account',
    'security_incident'
  ];
  
  return exceptions.some(exception => retentionExceptions.includes(exception));
}

/**
 * Calculate data age in days
 * @param createdAt - Creation date
 * @returns Age in days
 */
export function calculateDataAge(createdAt: Date): number {
  const ageMs = Date.now() - createdAt.getTime();
  return Math.floor(ageMs / (24 * 60 * 60 * 1000));
}

/**
 * Format retention period for display
 * @param periodMs - Period in milliseconds
 * @returns Formatted period string
 */
export function formatRetentionPeriod(periodMs: number): string {
  const days = Math.floor(periodMs / (24 * 60 * 60 * 1000));
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);
  
  if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''}`;
  } else if (months > 0) {
    return `${months} month${months > 1 ? 's' : ''}`;
  } else {
    return `${days} day${days > 1 ? 's' : ''}`;
  }
}

// ============================================================================
// EXPORTED CLASS
// ============================================================================

export default DataRetentionManager;

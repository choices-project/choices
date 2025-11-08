/**
 * Canonical ID Service
 *
 * Central service for managing canonical IDs and crosswalk mappings
 * Prevents join failures and data inconsistencies across sources
 */
import type { IdCrosswalk, CanonicalIdMapping, EntityType, DataSource } from './types';
export declare class CanonicalIdService {
    private _supabase;
    private get supabase();
    /**
     * Generate a canonical ID for an entity
     */
    generateCanonicalId(entityType: EntityType, primaryData: Record<string, any>): string;
    /**
     * Create or update a crosswalk entry
     */
    upsertCrosswalkEntry(entityType: EntityType, canonicalId: string, source: DataSource, sourceId: string, attrs?: Record<string, any>): Promise<IdCrosswalk>;
    /**
     * Get all crosswalk entries for a canonical ID
     */
    getCrosswalkEntries(canonicalId: string): Promise<IdCrosswalk[]>;
    /**
     * Get canonical ID mapping for an entity
     */
    getCanonicalIdMapping(canonicalId: string): Promise<CanonicalIdMapping | null>;
    /**
     * Find canonical ID by source ID
     */
    findCanonicalIdBySource(source: DataSource, sourceId: string): Promise<string | null>;
    /**
     * Resolve entity from multiple sources
     */
    resolveEntity(entityType: EntityType, sourceData: Array<{
        source: DataSource;
        data: any;
        sourceId: string;
    }>): Promise<{
        canonicalId: string;
        crosswalkEntries: IdCrosswalk[];
    }>;
    /**
     * Get all sources for a canonical ID
     */
    getEntitySources(canonicalId: string): Promise<DataSource[]>;
    /**
     * Check if entity exists in crosswalk
     */
    entityExists(canonicalId: string): Promise<boolean>;
    /**
     * Get crosswalk statistics
     */
    getCrosswalkStats(): Promise<{
        total_entities: number;
        entities_by_type: Record<EntityType, number>;
        entities_by_source: Record<DataSource, number>;
        quality_distribution: {
            high: number;
            medium: number;
            low: number;
        };
    }>;
    /**
     * Clean up orphaned crosswalk entries
     */
    cleanupOrphanedEntries(): Promise<number>;
    /**
     * Calculate data quality score for source data
     */
    private calculateDataQuality;
}
export declare const canonicalIdService: CanonicalIdService;
//# sourceMappingURL=canonical-id-service.d.ts.map
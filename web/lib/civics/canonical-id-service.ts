/**
 * Canonical ID Service
 * 
 * Central service for managing canonical IDs and crosswalk mappings
 * Prevents join failures and data inconsistencies across sources
 */

import { createClient } from '@supabase/supabase-js';
import type {
  IdCrosswalk,
  CanonicalIdMapping,
  EntityType,
  DataSource,
  Candidate,
  Election,
  CampaignFinance,
  Contribution,
  VotingRecord
} from './types';

export class CanonicalIdService {
  private _supabase: any = null;

  private get supabase() {
    if (!this._supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      this._supabase = createClient(supabaseUrl, supabaseKey);
    }
    return this._supabase;
  }

  /**
   * Generate a canonical ID for an entity
   */
  generateCanonicalId(entityType: EntityType, primaryData: Record<string, any>): string {
    switch (entityType) {
      case 'person':
        // Use bioguide_id if available, otherwise generate from name + state + district
        if (primaryData.bioguide_id) {
          return `person_${primaryData.bioguide_id}`;
        }
        const nameSlug = primaryData.name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'unknown';
        const state = primaryData.state || 'unknown';
        const district = primaryData.district || 'unknown';
        return `person_${nameSlug}_${state}_${district}`;

      case 'committee':
        // Use FEC committee ID if available
        if (primaryData.fec_committee_id) {
          return `committee_${primaryData.fec_committee_id}`;
        }
        const committeeName = primaryData.name?.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'unknown';
        return `committee_${committeeName}`;

      case 'bill':
        // Use normalized bill ID format
        if (primaryData.congress && primaryData.bill_type && primaryData.number) {
          return `bill_${primaryData.congress}_${primaryData.bill_type}_${primaryData.number}`;
        }
        return `bill_${primaryData.bill_id || 'unknown'}`;

      case 'jurisdiction':
        // Use OCD Division ID
        return `jurisdiction_${primaryData.ocd_division_id || 'unknown'}`;

      case 'election':
        // Use election ID + date + jurisdiction
        const electionId = primaryData.election_id || 'unknown';
        const date = primaryData.election_date || 'unknown';
        const jurisdiction = primaryData.ocd_division_id || 'unknown';
        return `election_${electionId}_${date}_${jurisdiction}`;

      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * Create or update a crosswalk entry
   */
  async upsertCrosswalkEntry(
    entityType: EntityType,
    canonicalId: string,
    source: DataSource,
    sourceId: string,
    attrs: Record<string, any> = {}
  ): Promise<IdCrosswalk> {
    const { data, error } = await this.supabase
      .from('id_crosswalk')
      .upsert({
        entity_type: entityType,
        canonical_id: canonicalId,
        source,
        source_id: sourceId,
        attrs,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'source,source_id'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert crosswalk entry: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all crosswalk entries for a canonical ID
   */
  async getCrosswalkEntries(canonicalId: string): Promise<IdCrosswalk[]> {
    const { data, error } = await this.supabase
      .from('id_crosswalk')
      .select('*')
      .eq('canonical_id', canonicalId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get crosswalk entries: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get canonical ID mapping for an entity
   */
  async getCanonicalIdMapping(canonicalId: string): Promise<CanonicalIdMapping | null> {
    const entries = await this.getCrosswalkEntries(canonicalId);
    
    if (entries.length === 0) {
      return null;
    }

    const sources: Record<DataSource, string> = {} as Record<DataSource, string>;
    
    for (const entry of entries) {
      sources[entry.source as DataSource] = entry.source_id;
    }

    return {
      canonical_id: canonicalId,
      sources,
      entity_type: entries[0].entity_type
    };
  }

  /**
   * Find canonical ID by source ID
   */
  async findCanonicalIdBySource(source: DataSource, sourceId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('id_crosswalk')
      .select('canonical_id')
      .eq('source', source)
      .eq('source_id', sourceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to find canonical ID: ${error.message}`);
    }

    return data.canonical_id;
  }

  /**
   * Resolve entity from multiple sources
   */
  async resolveEntity(
    entityType: EntityType,
    sourceData: Array<{ source: DataSource; data: any; sourceId: string }>
  ): Promise<{ canonicalId: string; crosswalkEntries: IdCrosswalk[] }> {
    // Try to find existing canonical ID from any source
    let canonicalId: string | null = null;
    
    for (const { source, sourceId } of sourceData) {
      const existing = await this.findCanonicalIdBySource(source, sourceId);
      if (existing) {
        canonicalId = existing;
        break;
      }
    }

    // Generate new canonical ID if none found
    if (!canonicalId) {
      // Use the highest priority source for canonical ID generation
      const priorityOrder: DataSource[] = ['congress-gov', 'fec', 'open-states', 'opensecrets', 'govtrack', 'google-civic'];
      const primarySource = sourceData.find(s => priorityOrder.includes(s.source)) || sourceData[0];
      canonicalId = this.generateCanonicalId(entityType, primarySource.data);
    }

    // Create/update crosswalk entries for all sources
    const crosswalkEntries: IdCrosswalk[] = [];
    
    for (const { source, data, sourceId } of sourceData) {
      const entry = await this.upsertCrosswalkEntry(
        entityType,
        canonicalId,
        source,
        sourceId,
        { quality_score: this.calculateDataQuality(data) }
      );
      crosswalkEntries.push(entry);
    }

    return { canonicalId, crosswalkEntries };
  }

  /**
   * Get all sources for a canonical ID
   */
  async getEntitySources(canonicalId: string): Promise<DataSource[]> {
    const entries = await this.getCrosswalkEntries(canonicalId);
    return entries.map(entry => entry.source as DataSource);
  }

  /**
   * Check if entity exists in crosswalk
   */
  async entityExists(canonicalId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('id_crosswalk')
      .select('canonical_id')
      .eq('canonical_id', canonicalId)
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false; // No rows found
      }
      throw new Error(`Failed to check entity existence: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Get crosswalk statistics
   */
  async getCrosswalkStats(): Promise<{
    total_entities: number;
    entities_by_type: Record<EntityType, number>;
    entities_by_source: Record<DataSource, number>;
    quality_distribution: { high: number; medium: number; low: number };
  }> {
    const { data, error } = await this.supabase
      .from('id_crosswalk')
      .select('entity_type, source, attrs');

    if (error) {
      throw new Error(`Failed to get crosswalk stats: ${error.message}`);
    }

    const stats = {
      total_entities: 0,
      entities_by_type: {} as Record<EntityType, number>,
      entities_by_source: {} as Record<DataSource, number>,
      quality_distribution: { high: 0, medium: 0, low: 0 }
    };

    const seenEntities = new Set<string>();

    for (const entry of data || []) {
      // Count unique entities
      if (!seenEntities.has(entry.canonical_id)) {
        seenEntities.add(entry.canonical_id);
        stats.total_entities++;
      }

      // Count by entity type
      const entityType = entry.entity_type as EntityType;
      stats.entities_by_type[entityType] = (stats.entities_by_type[entityType] || 0) + 1;

      // Count by source
      const source = entry.source as DataSource;
      stats.entities_by_source[source] = (stats.entities_by_source[source] || 0) + 1;

      // Count by quality
      const qualityScore = entry.attrs?.quality_score || 0;
      if (qualityScore >= 0.8) {
        stats.quality_distribution.high++;
      } else if (qualityScore >= 0.6) {
        stats.quality_distribution.medium++;
      } else {
        stats.quality_distribution.low++;
      }
    }

    return stats;
  }

  /**
   * Clean up orphaned crosswalk entries
   */
  async cleanupOrphanedEntries(): Promise<number> {
    // This would need to be implemented based on specific cleanup rules
    // For now, return 0 as a placeholder
    return 0;
  }

  /**
   * Calculate data quality score for source data
   */
  private calculateDataQuality(data: any): number {
    const requiredFields = ['name', 'state'];
    const optionalFields = ['email', 'phone', 'website', 'photo_url'];
    
    let score = 0;
    let totalFields = requiredFields.length + optionalFields.length;
    
    // Check required fields
    for (const field of requiredFields) {
      if (data[field] && data[field].toString().trim()) {
        score += 1;
      }
    }
    
    // Check optional fields
    for (const field of optionalFields) {
      if (data[field] && data[field].toString().trim()) {
        score += 0.5;
      }
    }
    
    return Math.min(score / totalFields, 1);
  }
}

// Export singleton instance
export const canonicalIdService = new CanonicalIdService();

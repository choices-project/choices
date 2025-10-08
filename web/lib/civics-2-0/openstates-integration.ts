/**
 * OpenStates People Database Integration
 * Integrates 25,000+ YAML files with current electorate filtering
 * 
 * Created: October 8, 2025
 * Updated: October 8, 2025
 */

// Node.js imports - only available in server environment
// import { readFileSync, readdirSync, statSync } from 'fs';
// import { join, extname } from 'path';
// import { load } from 'js-yaml';
import { CurrentElectorateVerifier } from './current-electorate-verifier';

export interface OpenStatesPerson {
  id: string;
  name: string;
  given_name?: string;
  family_name?: string;
  middle_name?: string;
  suffix?: string;
  nickname?: string;
  birth_date?: string;
  death_date?: string;
  image?: string;
  gender?: string;
  biography?: string;
  party?: string;
  roles?: Array<{
    type: string;
    title: string;
    jurisdiction: string;
    start_date?: string;
    end_date?: string;
    district?: string;
    division?: string;
  }>;
  contact_details?: Array<{
    type: string;
    value: string;
    note?: string;
  }>;
  links?: Array<{
    url: string;
    note?: string;
  }>;
  sources?: Array<{
    url: string;
    note?: string;
  }>;
  other_identifiers?: Array<{
    scheme: string;
    identifier: string;
  }>;
  extras?: Record<string, any>;
}

export interface OpenStatesIntegrationConfig {
  dataPath: string;
  currentDate: Date;
}

export default class OpenStatesIntegration {
  private dataPath: string;
  private currentDate: Date;
  private verifier: CurrentElectorateVerifier;

  constructor(config: OpenStatesIntegrationConfig) {
    this.dataPath = config.dataPath;
    this.currentDate = config.currentDate;
    this.verifier = new CurrentElectorateVerifier();
  }

  /**
   * Check if a person is currently in office
   */
  private isCurrentPerson(person: OpenStatesPerson): boolean {
    const check = this.verifier.verifyCurrentRepresentative(person);
    return check.isCurrent;
  }

  /**
   * Check if a person is known to be non-current (retired, deceased, etc.)
   */
  private isKnownNonCurrent(person: OpenStatesPerson): boolean {
    const check = this.verifier.verifyCurrentRepresentative(person);
    return !check.isCurrent;
  }

  /**
   * Process state data and return only current representatives
   */
  async processStateData(stateCode: string): Promise<OpenStatesPerson[]> {
    console.log(`🔍 Processing OpenStates People data for ${stateCode}...`);
    console.log(`   System Date: ${this.currentDate.toISOString()}`);
    
    // Check if we're running in a browser environment
    if (typeof window !== 'undefined') {
      console.log('⚠️  OpenStates integration requires server-side execution');
      console.log('   This should be called from API routes, not client-side code');
      return [];
    }
    
    // Server-side execution - Node.js modules are available
    try {
      const fs = await import('fs');
      const path = await import('path');
      const yaml = await import('js-yaml');
      
      const statePath = path.join(this.dataPath, stateCode);
      const currentPeople: OpenStatesPerson[] = [];
      
      if (!fs.existsSync(statePath)) {
        console.log(`State path not found: ${statePath}`);
        return currentPeople;
      }
      
      // Process legislature data
      const legislaturePath = path.join(statePath, 'legislature');
      if (fs.existsSync(legislaturePath)) {
        const files = fs.readdirSync(legislaturePath);
        console.log(`   Found ${files.length} legislature files`);
        
        for (const file of files) {
          if (file.endsWith('.yml')) {
            try {
              const content = fs.readFileSync(path.join(legislaturePath, file), 'utf8');
              const person = yaml.load(content) as OpenStatesPerson;
              
              // Apply current electorate filtering using system date
              if (this.isCurrentPerson(person) && !this.isKnownNonCurrent(person)) {
                currentPeople.push(person);
                console.log(`   ✅ Current: ${person.name} (${person.roles?.[0]?.type})`);
              } else {
                console.log(`   ❌ Non-current: ${person.name} (${person.roles?.[0]?.type})`);
              }
            } catch (error) {
              console.error(`   ⚠️  Error processing ${file}:`, error);
            }
          }
        }
      }
      
      console.log(`✅ Processed ${currentPeople.length} current representatives for ${stateCode}`);
      return currentPeople;
    } catch (error) {
      console.error('❌ Error in OpenStates integration:', error);
      return [];
    }
  }

  /**
   * Get all current representatives for a state
   */
  async getCurrentRepresentatives(stateCode: string): Promise<OpenStatesPerson[]> {
    return this.processStateData(stateCode);
  }

  /**
   * Get representatives by role type
   */
  async getRepresentativesByRole(stateCode: string, roleType: string): Promise<OpenStatesPerson[]> {
    const allRepresentatives = await this.getCurrentRepresentatives(stateCode);
    return allRepresentatives.filter(person => 
      person.roles?.some(role => role.type === roleType)
    );
  }

  /**
   * Get representatives by district
   */
  async getRepresentativesByDistrict(stateCode: string, district: string): Promise<OpenStatesPerson[]> {
    const allRepresentatives = await this.getCurrentRepresentatives(stateCode);
    return allRepresentatives.filter(person => 
      person.roles?.some(role => role.district === district)
    );
  }

  /**
   * Get representatives by party
   */
  async getRepresentativesByParty(stateCode: string, party: string): Promise<OpenStatesPerson[]> {
    const allRepresentatives = await this.getCurrentRepresentatives(stateCode);
    return allRepresentatives.filter(person => person.party === party);
  }

  /**
   * Search representatives by name
   */
  async searchRepresentatives(stateCode: string, query: string): Promise<OpenStatesPerson[]> {
    const allRepresentatives = await this.getCurrentRepresentatives(stateCode);
    const searchQuery = query.toLowerCase();
    
    return allRepresentatives.filter(person => 
      person.name.toLowerCase().includes(searchQuery) ||
      person.given_name?.toLowerCase().includes(searchQuery) ||
      person.family_name?.toLowerCase().includes(searchQuery) ||
      person.nickname?.toLowerCase().includes(searchQuery)
    );
  }

  /**
   * Get representative by ID
   */
  async getRepresentativeById(stateCode: string, id: string): Promise<OpenStatesPerson | null> {
    const allRepresentatives = await this.getCurrentRepresentatives(stateCode);
    return allRepresentatives.find(person => person.id === id) || null;
  }

  /**
   * Get contact information for a representative
   */
  getContactInfo(person: OpenStatesPerson): Array<{type: string; value: string; note?: string}> {
    return person.contact_details || [];
  }

  /**
   * Get social media links for a representative
   */
  getSocialMediaLinks(person: OpenStatesPerson): Array<{url: string; note?: string}> {
    return person.links?.filter(link => 
      link.url.includes('twitter.com') || 
      link.url.includes('facebook.com') || 
      link.url.includes('instagram.com') ||
      link.url.includes('linkedin.com')
    ) || [];
  }

  /**
   * Get official sources for a representative
   */
  getOfficialSources(person: OpenStatesPerson): Array<{url: string; note?: string}> {
    return person.sources || [];
  }

  /**
   * Get current roles for a representative
   */
  getCurrentRoles(person: OpenStatesPerson): Array<{
    type: string;
    title: string;
    jurisdiction: string;
    start_date?: string;
    end_date?: string;
    district?: string;
    division?: string;
  }> {
    // For now, return all roles - this would need more sophisticated logic
    return person.roles || [];
  }

  /**
   * Get all available states
   */
  async getAvailableStates(): Promise<string[]> {
    // TODO: This would need to read the filesystem to get available states
    // For now, return a hardcoded list of common states
    return [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];
  }

  /**
   * Get statistics for a state
   */
  async getStateStatistics(stateCode: string): Promise<{
    totalRepresentatives: number;
    byParty: Record<string, number>;
    byRole: Record<string, number>;
    byDistrict: Record<string, number>;
  }> {
    const representatives = await this.getCurrentRepresentatives(stateCode);
    
    const byParty: Record<string, number> = {};
    const byRole: Record<string, number> = {};
    const byDistrict: Record<string, number> = {};
    
    representatives.forEach(person => {
      // Count by party
      const party = person.party || 'Unknown';
      byParty[party] = (byParty[party] || 0) + 1;
      
      // Count by role
      person.roles?.forEach(role => {
        byRole[role.type] = (byRole[role.type] || 0) + 1;
      });
      
      // Count by district
      person.roles?.forEach(role => {
        if (role.district) {
          byDistrict[role.district] = (byDistrict[role.district] || 0) + 1;
        }
      });
    });
    
    return {
      totalRepresentatives: representatives.length,
      byParty,
      byRole,
      byDistrict
    };
  }
}
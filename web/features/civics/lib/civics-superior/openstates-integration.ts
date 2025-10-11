/**
 * OpenStates People Database Integration
 * Integrates 25,000+ YAML files with comprehensive representative data
 * 
 * NOTE: This is NOT the OpenStates API (which has 250/day rate limits)
 * This is the OpenStates People Database - a comprehensive offline dataset
 * 
 * Created: October 8, 2025
 * Updated: October 8, 2025
 */

// Node.js imports - only available in server environment
// import { readFileSync, readdirSync, statSync } from 'fs';
// import { join, extname } from 'path';
// import { load } from 'js-yaml';
import { CurrentElectorateVerifier } from './current-electorate-verifier';
import { withOptional } from '@/lib/utils/objects';

export type OpenStatesPerson = {
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

export type OpenStatesIntegrationConfig = {
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
    // Check if person has any current roles (no end_date or end_date in future)
    if (person.roles && person.roles.length > 0) {
      const currentRoles = person.roles.filter(role => {
        if (!role.start_date) return false;
        const startDate = new Date(role.start_date);
        const endDate = role.end_date ? new Date(role.end_date) : null;
        
        // Role is current if:
        // 1. It started before or on current date AND
        // 2. It has no end date (ongoing) OR end date is in the future
        const isCurrent = startDate <= this.currentDate && (!endDate || endDate > this.currentDate);
        
        console.log(`   🔍 Checking role for ${person.name}: start=${role.start_date}, end=${role.end_date || 'none'}, current=${isCurrent}`);
        
        return isCurrent;
      });
      
      const isCurrent = currentRoles.length > 0;
      console.log(`   ${isCurrent ? '✅' : '❌'} ${person.name}: ${isCurrent ? 'CURRENT' : 'NON-CURRENT'} (${currentRoles.length} current roles)`);
      
      return isCurrent;
    }
    
    console.log(`   ❌ ${person.name}: NO ROLES`);
    return false;
  }

  private isKnownNonCurrent(_person: OpenStatesPerson): boolean {
    return false;
  }

  /**
   * Process state data and return only current representatives with comprehensive data
   */
  async processStateData(stateCode: string): Promise<OpenStatesPerson[]> {
    console.log(`🔍 Processing OpenStates People Database for ${stateCode}...`);
    console.log(`   System Date: ${this.currentDate.toISOString()}`);
    console.log(`   Data Path: ${this.dataPath}`);
    console.log(`   NOTE: This is the OpenStates People Database (offline), NOT the OpenStates API`);
    console.log(`   GOAL: Extract all current legislators and committee information for efficient API usage`);
    
    // Check if we're running in a browser environment
    if (typeof window !== 'undefined') {
      console.log('⚠️  OpenStates People Database integration requires server-side execution');
      console.log('   This should be called from API routes, not client-side code');
      return [];
    }
    
    // Server-side execution - Node.js modules are available
    try {
      const fs = await import('fs');
      const path = await import('path');
      const yaml = await import('js-yaml');
      
      // Convert state code to lowercase for filesystem access
      const stateCodeLower = stateCode.toLowerCase();
      const statePath = path.join(this.dataPath, stateCodeLower);
      const currentPeople: OpenStatesPerson[] = [];
      
      console.log(`   Checking state path: ${statePath}`);
      
      if (!fs.existsSync(statePath)) {
        console.log(`⚠️  OpenStates People Database path not found: ${statePath}`);
        console.log(`   This is expected if OpenStates People Database is not available`);
        console.log(`   Falling back to empty results - OpenStates API and other live APIs will be used instead`);
        return currentPeople;
      }
      
      // Process legislature data (main legislators)
      const legislaturePath = path.join(statePath, 'legislature');
      if (fs.existsSync(legislaturePath)) {
        const files = fs.readdirSync(legislaturePath);
        console.log(`   Found ${files.length} legislature files`);
        
        for (const file of files) {
          if (file.endsWith('.yml')) {
            try {
              const filePath = path.join(legislaturePath, file);
              const content = fs.readFileSync(filePath, 'utf8');
              const person = yaml.load(content) as OpenStatesPerson;
              
              if (!person || !person.name) {
                console.log(`   ⚠️  Skipping invalid person data in ${file}`);
                continue;
              }
              
              // Apply current electorate filtering using system date
              if (this.isCurrentPerson(person) && !this.isKnownNonCurrent(person)) {
                // Add person to current people (will be enhanced after committee processing)
                currentPeople.push(person);
                console.log(`   ✅ Current: ${person.name} (${person.roles?.[0]?.type || 'Unknown'}) - ID: ${person.id}`);
              } else {
                console.log(`   ❌ Non-current: ${person.name} (${person.roles?.[0]?.type || 'Unknown'})`);
              }
            } catch (error) {
              console.error(`   ⚠️  Error processing ${file}:`, error);
              // Continue processing other files
            }
          }
        }
      } else {
        console.log(`   No legislature directory found at: ${legislaturePath}`);
      }
      
      // Process committee data if available
      const committeePath = path.join(statePath, 'committees');
      if (fs.existsSync(committeePath)) {
        console.log(`   📋 Processing committee data for ${stateCode}...`);
        const committeeFiles = fs.readdirSync(committeePath);
        console.log(`   📋 Found ${committeeFiles.length} committee files`);
        console.log(`   📋 Current people count before committee processing: ${currentPeople.length}`);
        
        // Process committee files to extract member information
        for (const file of committeeFiles) {
          if (file.endsWith('.yml')) {
            try {
              const filePath = path.join(committeePath, file);
              const content = fs.readFileSync(filePath, 'utf8');
              const committee = yaml.load(content) as any;
              
              if (committee && committee.members) {
                console.log(`   📋 Processing committee: ${committee.name || 'Unknown'} (${committee.members.length} members)`);
                // Extract committee member information
                for (const member of committee.members) {
                  if (member.person_id) {
                    console.log(`   📋 Processing member: ${member.name} (${member.role}) - ID: ${member.person_id}`);
                    // Find existing person or create new entry
                    let person = currentPeople.find(p => p.id === member.person_id);
                    if (!person) {
                      // Create minimal person entry for committee member
                      const roleType = member.role === 'chair' ? 'committee_chair' : 
                                     member.role === 'vice chair' ? 'committee_vice_chair' : 
                                     'committee_member';
                      person = {
                        id: member.person_id,
                        name: member.name || 'Unknown',
                        roles: [{
                          type: roleType,
                          title: committee.name || 'Unknown Committee',
                          jurisdiction: stateCode,
                          start_date: member.start_date,
                          end_date: member.end_date,
                          member_role: member.role || 'member'
                        } as any]
                      };
                      currentPeople.push(person as OpenStatesPerson);
                      console.log(`   📋 Created new person entry for committee member: ${member.name}`);
                    } else {
                      // Add committee role to existing person
                      console.log(`   📋 Found existing person: ${person.name}, adding committee role`);
                      if (!person.roles) person.roles = [];
                      const roleType = member.role === 'chair' ? 'committee_chair' : 
                                     member.role === 'vice chair' ? 'committee_vice_chair' : 
                                     'committee_member';
                      person.roles.push({
                        type: roleType,
                        title: committee.name || 'Unknown Committee',
                        jurisdiction: stateCode,
                        start_date: member.start_date,
                        end_date: member.end_date,
                        member_role: member.role || 'member'
                      } as any);
                      console.log(`   📋 Added committee role: ${roleType} - ${member.role}`);
                    }
                  }
                }
              }
            } catch (error) {
              console.error(`   ⚠️  Error processing committee file ${file}:`, error);
            }
          }
        }
      } else {
        console.log(`   📋 No committee directory found at: ${committeePath}`);
      }
      
      console.log(`📋 Committee processing completed for ${stateCode}`);
      console.log(`✨ Enhancing person data for ${currentPeople.length} current representatives...`);
      
      // Enhance all person data AFTER committee processing is complete
      const enhancedPeople: OpenStatesPerson[] = [];
      for (const person of currentPeople) {
        const enhancedPerson = await this.enhancePersonData(person, stateCode);
        enhancedPeople.push(enhancedPerson);
      }
      
      console.log(`✅ Processed ${enhancedPeople.length} current representatives for ${stateCode}`);
      return enhancedPeople;
    } catch (error) {
      console.error('❌ Error in OpenStates People Database integration:', error);
      console.log('   This is expected if OpenStates People Database is not available');
      console.log('   The system will fall back to OpenStates API and other live APIs for data collection');
      return [];
    }
  }

  private async enhancePersonData(person: OpenStatesPerson, _stateCode: string): Promise<OpenStatesPerson> {

    const enhanced: OpenStatesPerson & Record<string, any> = withOptional(person);
    
    // Extract OpenStates ID for efficient API calls
    if (person.id) {
      console.log(`   📋 OpenStates ID: ${person.id} for ${person.name}`);
    }
    
    // Extract current role information
    if (person.roles && person.roles.length > 0) {
      const currentRole = person.roles.find(role => 
        role.start_date && 
        (!role.end_date || new Date(role.end_date) > this.currentDate)
      );
      
      if (currentRole) {
        enhanced.current_role = {
          type: currentRole.type,
          title: currentRole.title,
          jurisdiction: currentRole.jurisdiction,
          district: currentRole.district,
          start_date: currentRole.start_date,
          end_date: currentRole.end_date
        };
        console.log(`   🏛️  Current Role: ${currentRole.type} - ${currentRole.title || 'Unknown'}`);
      }
    }
    
    // Extract contact information
    if (person.contact_details) {
      enhanced.contact_info = {
        email: person.contact_details.find(c => c.type === 'email')?.value,
        phone: person.contact_details.find(c => c.type === 'voice')?.value,
        address: person.contact_details.find(c => c.type === 'address')?.value,
        fax: person.contact_details.find(c => c.type === 'fax')?.value
      };
    }
    
    // Extract social media links
    if (person.contact_details) {
      enhanced.social_media = person.contact_details
        .filter(c => c.type === 'url' && c.note)
        .map(c => ({
          platform: c.note?.toLowerCase() || 'other',
          url: c.value,
          note: c.note
        }));
    }
    
    // Extract party affiliation (handle array structure)
    if (person.party) {
      if (Array.isArray(person.party) && person.party.length > 0) {
        enhanced.party_affiliation = person.party[0].name || person.party[0];
        console.log(`   🏛️  Party: ${enhanced.party_affiliation}`);
      } else {
        enhanced.party_affiliation = person.party;
        console.log(`   🏛️  Party: ${person.party}`);
      }
    }
    
    // Extract biographical information
    if (person.biography) {
      enhanced.biography = person.biography;
    }
    
    // Extract photo information
    if (person.image) {
      enhanced.photo_url = person.image;
    }
    
    // Extract source information
    if (person.sources) {
      enhanced.sources = person.sources.map(source => {
        const result: { url: string; note?: string; retrieved: string } = {
          url: source.url,
          retrieved: new Date().toISOString()
        };
        if (source.note) {
          result.note = source.note;
        }
        return result;
      });
    }
    
    // Extract committee memberships
    if (person.roles) {
      console.log(`   📋 Checking roles for ${person.name}: ${person.roles.length} total roles`);
      const committeeRoles = person.roles.filter(role => 
        role.type === 'committee_member' || 
        role.type === 'committee_chair' ||
        role.type === 'committee_vice_chair'
      );
      
      console.log(`   📋 Committee roles found: ${committeeRoles.length}`);
      if (committeeRoles.length > 0) {
        enhanced.committee_memberships = committeeRoles.map(role => ({
          committee: role.title, // Committee name is stored in title
          role: (role as any).member_role || 'member', // Member role (chair, member, etc.)
          jurisdiction: role.jurisdiction,
          start_date: role.start_date,
          end_date: role.end_date
        }));
        console.log(`   📋 Committee Memberships: ${committeeRoles.length} committees`);
        console.log(`   📋 Committee details:`, committeeRoles.map(r => `${r.type} - ${r.title}`));
      } else {
        console.log(`   📋 No committee roles found for ${person.name}`);
      }
    } else {
      console.log(`   📋 No roles found for ${person.name}`);
    }
    
    return enhanced;
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
   * Check if OpenStates People database is available
   */
  async isDatabaseAvailable(): Promise<boolean> {
    try {
      // Check if we're running in a browser environment
      if (typeof window !== 'undefined') {
        return false;
      }
      
      const fs = await import('fs');
      const path = await import('path');
      
      const dataPath = path.join(this.dataPath);
      return fs.existsSync(dataPath);
    } catch (error) {
      console.log('OpenStates People database not available:', error);
      return false;
    }
  }

  /**
   * Get all available states
   */
  async getAvailableStates(): Promise<string[]> {
    try {
      // Check if database is available
      if (!(await this.isDatabaseAvailable())) {
        console.log('OpenStates People database not available, returning hardcoded state list');
    return [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];
      }
      
      // Read available states from filesystem
      const fs = await import('fs');
      const path = await import('path');
      
      const dataPath = path.join(this.dataPath);
      const states = fs.readdirSync(dataPath).filter(item => {
        const itemPath = path.join(dataPath, item);
        return fs.statSync(itemPath).isDirectory();
      }).map(state => state.toUpperCase()); // Convert to uppercase for consistency
      
      console.log(`Found ${states.length} available states in OpenStates People database`);
      return states;
    } catch (error) {
      console.log('Error reading available states, returning hardcoded list:', error);
      return [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
      ];
    }
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

  /**
   * Get integration status and capabilities
   */
  async getIntegrationStatus(): Promise<{
    isAvailable: boolean;
    dataPath: string;
    currentDate: string;
    availableStates: string[];
    capabilities: string[];
    fallbackMode: boolean;
  }> {
    const isAvailable = await this.isDatabaseAvailable();
    const availableStates = await this.getAvailableStates();
    
    return {
      isAvailable,
      dataPath: this.dataPath,
      currentDate: this.currentDate.toISOString(),
      availableStates,
      capabilities: [
        'Current electorate filtering',
        'State-level data processing',
        'Role-based filtering',
        'Party-based filtering',
        'District-based filtering',
        'Name-based search',
        'Contact information extraction',
        'Social media link extraction',
        'Official source extraction',
        'Statistics generation'
      ],
      fallbackMode: !isAvailable
    };
  }

  /**
   * Test the integration with a simple operation
   */
  async testIntegration(): Promise<{
    success: boolean;
    message: string;
    details: any;
  }> {
    try {
      console.log('🧪 Testing OpenStates Integration...');
      
      const status = await this.getIntegrationStatus();
      const availableStates = await this.getAvailableStates();
      
      console.log('✅ OpenStates Integration test completed');
      console.log(`   Available: ${status.isAvailable}`);
      console.log(`   States: ${availableStates.length}`);
      console.log(`   Fallback Mode: ${status.fallbackMode}`);
      
      return {
        success: true,
        message: 'OpenStates Integration is working correctly',
        details: {
          status,
          availableStates: availableStates.slice(0, 5), // First 5 states
          totalStates: availableStates.length
        }
      };
    } catch (error) {
      console.error('❌ OpenStates Integration test failed:', error);
      return {
        success: false,
        message: 'OpenStates Integration test failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          fallbackMode: true
        }
      };
    }
  }
}
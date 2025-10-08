#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = '/Users/alaughingkitsune/src/Choices/web/.env.local';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key] = valueParts.join('=');
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class ComprehensiveOpenStatesProcessor {
  constructor() {
    this.dataPath = '/Users/alaughingkitsune/src/Choices/scratch/agent-b/openstates-people/data';
  }

  // Process a single state with comprehensive data extraction
  async processState(stateCode) {
    console.log(`\n🏛️  PROCESSING STATE: ${stateCode.toUpperCase()}`);
    console.log('=' .repeat(50));
    
    const stateStartTime = Date.now();
    let peopleProcessed = 0;
    let peopleSkipped = 0;
    let committeesProcessed = 0;
    let committeesSkipped = 0;
    let errors = 0;
    
    try {
      // Get all YAML files for this state (INCLUDING committees)
      const yamlFiles = this.getAllYamlFiles(stateCode);
      console.log(`  📁 Found ${yamlFiles.length} YAML files`);
      
      if (yamlFiles.length === 0) {
        console.log(`  ⚠️  No YAML files found for ${stateCode}`);
        return { processed: 0, skipped: 0, errors: 0 };
      }
      
      // Process each file with comprehensive analysis
      for (const filePath of yamlFiles) {
        try {
          const result = await this.processFile(filePath, stateCode);
          if (result.success) {
            if (result.type === 'person') {
              peopleProcessed++;
            } else if (result.type === 'committee') {
              committeesProcessed++;
            }
          } else {
            if (result.type === 'person') {
              peopleSkipped++;
            } else if (result.type === 'committee') {
              committeesSkipped++;
            }
          }
        } catch (error) {
          console.log(`    ❌ Error processing file ${path.basename(filePath)}: ${error.message}`);
          errors++;
        }
      }
      
      // CRITICAL: Verify data was actually inserted
      const verificationResult = await this.verifyStateProcessing(stateCode, peopleProcessed);
      if (!verificationResult.success) {
        console.log(`  ❌ VERIFICATION FAILED: ${verificationResult.error}`);
        return { processed: 0, skipped: 0, errors: errors + 1 };
      }
      
      const stateDuration = ((Date.now() - stateStartTime) / 1000).toFixed(1);
      console.log(`  ✅ ${stateCode.toUpperCase()} COMPLETED AND VERIFIED`);
      console.log(`  📊 People: ${peopleProcessed} processed, ${peopleSkipped} skipped`);
      console.log(`  📊 Committees: ${committeesProcessed} processed, ${committeesSkipped} skipped`);
      console.log(`  ❌ Errors: ${errors}`);
      console.log(`  ⏱️  Duration: ${stateDuration}s`);
      
      return { 
        processed: peopleProcessed + committeesProcessed, 
        skipped: peopleSkipped + committeesSkipped, 
        errors: errors 
      };
      
    } catch (error) {
      console.log(`  ❌ CRITICAL ERROR processing ${stateCode}: ${error.message}`);
      return { processed: 0, skipped: 0, errors: 1 };
    }
  }

  // Verify state processing was successful
  async verifyStateProcessing(stateCode, expectedCount) {
    try {
      const { count, error } = await supabase
        .from('representatives_optimal')
        .select('*', { count: 'exact', head: true })
        .eq('state', stateCode.toUpperCase());
      
      if (error) {
        return { success: false, error: `Database error: ${error.message}` };
      }
      
      if (count !== expectedCount) {
        return { success: false, error: `Count mismatch: expected ${expectedCount}, got ${count}` };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: `Verification error: ${error.message}` };
    }
  }

  // Get all YAML files for a state (INCLUDING committees)
  getAllYamlFiles(stateCode) {
    const files = [];
    const statePath = path.join(this.dataPath, stateCode);
    
    if (!fs.existsSync(statePath)) {
      return files;
    }
    
    const processDirectory = (dirPath) => {
      if (fs.existsSync(dirPath)) {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const item of items) {
          const fullPath = path.join(dirPath, item.name);
          if (item.isDirectory()) {
            // INCLUDE committees directory - it contains valuable data
            processDirectory(fullPath);
          } else if (item.isFile() && (item.name.endsWith('.yml') || item.name.endsWith('.yaml'))) {
            files.push(fullPath);
          }
        }
      }
    };
    
    // Process all subdirectories INCLUDING committees
    processDirectory(statePath);
    return files;
  }

  // Process a single file with comprehensive analysis
  async processFile(filePath, stateCode) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = yaml.load(content);
      
      if (!data || !data.id) {
        return { success: false, reason: 'Invalid data', type: 'unknown' };
      }
      
      // Determine if this is a person or committee
      const isCommittee = this.isCommittee(data);
      
      if (isCommittee) {
        // Process committee data
        const result = await this.processCommittee(data, stateCode);
        return { success: result.success, reason: result.reason, type: 'committee' };
      } else {
        // Process person data
        if (!this.isActuallyCurrentPerson(data)) {
          return { success: false, reason: 'Not actually current representative', type: 'person' };
        }
        
        const result = await this.processPerson(data, stateCode);
        return { success: result.success, reason: result.reason, type: 'person' };
      }
      
    } catch (error) {
      return { success: false, reason: `File processing error: ${error.message}`, type: 'unknown' };
    }
  }

  // Determine if data is a committee
  isCommittee(data) {
    // Committees typically have these characteristics:
    // - No name field (or name is committee name, not person name)
    // - Has members array
    // - Has jurisdiction
    // - No roles array (or roles are committee roles, not person roles)
    
    if (data.members && Array.isArray(data.members) && data.members.length > 0) {
      return true;
    }
    
    if (data.jurisdiction && !data.roles) {
      return true;
    }
    
    if (data.name && (
      data.name.includes('Committee') ||
      data.name.includes('Commission') ||
      data.name.includes('Board') ||
      data.name.includes('Authority')
    )) {
      return true;
    }
    
    return false;
  }

  // Process committee data
  async processCommittee(committee, stateCode) {
    try {
      // Extract committee members and their roles
      if (committee.members && committee.members.length > 0) {
        console.log(`    📋 Committee: ${committee.name} (${committee.members.length} members)`);
        
        // Process each committee member
        for (const member of committee.members) {
          if (member.person_id) {
            // Look up the person by their OpenStates person ID
            const personResult = await this.findPersonByOpenStatesId(member.person_id);
            if (personResult.success) {
              // Add committee role to the person
              await this.addCommitteeRoleToPerson(personResult.personId, committee, member);
            }
          }
        }
        
        return { success: true, reason: 'Committee processed successfully' };
      } else {
        console.log(`    📋 Committee: ${committee.name} (no members)`);
        return { success: false, reason: 'Committee has no members' };
      }
    } catch (error) {
      return { success: false, reason: `Committee processing error: ${error.message}` };
    }
  }

  // Find person by OpenStates person ID
  async findPersonByOpenStatesId(openstatesPersonId) {
    try {
      const { data, error } = await supabase
        .from('representatives_optimal')
        .select('id')
        .eq('openstates_person_id', openstatesPersonId)
        .single();
      
      if (error || !data) {
        return { success: false, reason: 'Person not found in database' };
      }
      
      return { success: true, personId: data.id };
    } catch (error) {
      return { success: false, reason: `Database error: ${error.message}` };
    }
  }

  // Add committee role to person
  async addCommitteeRoleToPerson(personId, committee, member) {
    try {
      // Insert committee role into representative_roles_optimal
      const committeeRole = {
        representative_id: personId,
        role_type: 'committee_member', // Now valid enum value
        jurisdiction: committee.jurisdiction,
        district: null,
        start_date: null,
        end_date: null,
        end_reason: null,
        is_current: true,
        source: 'openstates-people',
        committee: committee.name,
        title: member.role
      };
      
      const { error } = await supabase
        .from('representative_roles_optimal')
        .insert(committeeRole);
      
      if (error) {
        console.log(`    ⚠️  Could not add committee role: ${error.message}`);
      }
    } catch (error) {
      console.log(`    ⚠️  Committee role error: ${error.message}`);
    }
  }

  // Check if person is actually current
  isActuallyCurrentPerson(person, currentDate = new Date()) {
    // Skip if dead
    if (person.death_date) {
      const deathDate = new Date(person.death_date);
      if (deathDate <= currentDate) {
        return false;
      }
    }
    
    // Must have roles
    if (!person.roles || person.roles.length === 0) {
      return false;
    }
    
    // Check if ANY role is actually current
    return person.roles.some(role => this.isActuallyCurrentRole(role, currentDate));
  }

  // Check if role is actually current
  isActuallyCurrentRole(role, currentDate = new Date()) {
    const startDate = role.start_date ? new Date(role.start_date) : null;
    const endDate = role.end_date ? new Date(role.end_date) : null;
    
    // Must have a start date
    if (!startDate) {
      return false;
    }
    
    // Start date must be in the past (role has started)
    if (currentDate < startDate) {
      return false;
    }
    
    // If no end date, consider it current (elected officials often have no end date)
    if (!endDate) {
      return true;
    }
    
    // If end date exists, check if it's in the future
    return currentDate < endDate;
  }

  // Process a single person with complete error handling
  async processPerson(person, stateCode) {
    try {
      // Check for duplicates
      const { data: existing } = await supabase
        .from('representatives_optimal')
        .select('id')
        .eq('openstates_person_id', person.id)
        .single();
      
      if (existing) {
        return { success: false, reason: 'Duplicate person' };
      }
      
      // Determine metadata
      const metadata = this.determinePersonMetadata(person, stateCode);
      
      // Insert representative with complete error handling
      const representativeId = await this.insertRepresentative(person, metadata);
      
      // Insert related data with complete error handling
      await this.insertOffices(representativeId, person);
      await this.insertSocialMedia(representativeId, person);
      await this.insertRoles(representativeId, person);
      await this.insertPhotos(representativeId, person);
      await this.insertContacts(representativeId, person);
      await this.insertJurisdiction(metadata);
      
      return { success: true, reason: 'Successfully processed' };
      
    } catch (error) {
      console.log(`    ❌ Person processing error: ${error.message}`);
      return { success: false, reason: `Person processing error: ${error.message}` };
    }
  }

  // Determine person metadata
  determinePersonMetadata(person, stateCode) {
    const currentRoles = person.roles.filter(role => this.isActuallyCurrentRole(role));
    const primaryRole = currentRoles[0] || person.roles[0];
    
    let governmentLevel = 'state';
    let representativeType = 'state_representative';
    
    if (primaryRole) {
      // Map OpenStates role types to correct enum values
      const roleMapping = this.getRoleTypeMapping();
      representativeType = roleMapping[primaryRole.type] || 'state_representative';
      
      // Determine government level
      if (representativeType === 'mayor' || representativeType === 'city_councilmember') {
        governmentLevel = 'municipal';
      } else if (representativeType === 'county_commissioner' || representativeType === 'county_sheriff') {
        governmentLevel = 'county';
      } else {
        governmentLevel = 'state';
      }
    }
    
    const dataQualityScore = this.calculateDataQualityScore(person);
    
    return {
      state: stateCode.toUpperCase(),
      governmentLevel,
      representativeType,
      primaryRole,
      dataQualityScore,
      jurisdiction: primaryRole?.jurisdiction || `ocd-jurisdiction/country:us/state:${stateCode.toLowerCase()}`
    };
  }

  // Get role type mapping
  getRoleTypeMapping() {
    return {
      'governor': 'governor',
      'lt_governor': 'lieutenant_governor',
      'upper': 'state_senator',
      'lower': 'state_representative',
      'mayor': 'mayor',
      'councilmember': 'city_councilmember',
      'secretary of state': 'secretary_of_state',
      'attorney general': 'attorney_general',
      'treasurer': 'treasurer',
      'auditor': 'auditor'
    };
  }

  // Calculate data quality score
  calculateDataQualityScore(person) {
    let score = 0;
    
    if (person.name) score += 10;
    if (person.email) score += 15;
    if (person.image) score += 10;
    if (person.offices && person.offices.length > 0) score += 15;
    if (person.roles && person.roles.length > 0) score += 20;
    if (person.links && person.links.length > 0) score += 10;
    if (person.contact_details && person.contact_details.length > 0) score += 10;
    if (person.other_identifiers && person.other_identifiers.length > 0) score += 10;
    
    return Math.min(score, 100);
  }

  // Insert representative with complete error handling
  async insertRepresentative(person, metadata) {
    try {
      const { data, error } = await supabase
        .from('representatives_optimal')
        .insert({
          openstates_person_id: person.id,
          name: person.name,
          given_name: person.given_name,
          family_name: person.family_name,
          gender: person.gender,
          birth_date: person.birth_date,
          level: metadata.governmentLevel,
          state: metadata.state,
          district: metadata.primaryRole?.district,
          jurisdiction: metadata.jurisdiction,
          party: person.party?.[0]?.name,
          party_history: person.party || [],
          primary_email: person.email,
          primary_phone: person.offices?.[0]?.voice,
          primary_website: person.links?.[0]?.url,
          primary_photo_url: person.image,
          current_term_start: metadata.primaryRole?.start_date,
          current_term_end: metadata.primaryRole?.end_date,
          data_quality_score: metadata.dataQualityScore,
          data_quality_level: metadata.dataQualityScore >= 90 ? 'excellent' :
                             metadata.dataQualityScore >= 75 ? 'good' :
                             metadata.dataQualityScore >= 50 ? 'fair' :
                             metadata.dataQualityScore >= 25 ? 'poor' : 'unknown',
          active: true,
          data_sources: ['openstates-people'],
          openstates_raw_data: person
        })
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      return data.id;
    } catch (error) {
      console.log(`    ❌ Insert representative error: ${error.message}`);
      throw error;
    }
  }

  // Insert offices with complete error handling
  async insertOffices(representativeId, person) {
    if (!person.offices || person.offices.length === 0) return;
    
    try {
      const offices = person.offices.map(office => ({
        representative_id: representativeId,
        office_type: office.classification || 'unknown',
        name: null,
        address: office.address,
        phone: office.voice,
        email: null,
        is_primary: office.classification === 'primary',
        is_current: true,
        source: 'openstates-people'
      }));
      
      const { error } = await supabase
        .from('representative_offices_optimal')
        .insert(offices);
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
    } catch (error) {
      console.log(`    ❌ Insert offices error: ${error.message}`);
      throw error;
    }
  }

  // Insert social media with complete error handling
  async insertSocialMedia(representativeId, person) {
    if (!person.links || person.links.length === 0) return;
    
    try {
      const socialMedia = person.links
        .filter(link => link.url && (
          link.url.includes('twitter.com') ||
          link.url.includes('facebook.com') ||
          link.url.includes('instagram.com') ||
          link.url.includes('youtube.com') ||
          link.url.includes('linkedin.com')
        ))
        .map(link => {
          let platform = 'unknown';
          if (link.url.includes('twitter.com')) platform = 'twitter';
          else if (link.url.includes('facebook.com')) platform = 'facebook';
          else if (link.url.includes('instagram.com')) platform = 'instagram';
          else if (link.url.includes('youtube.com')) platform = 'youtube';
          else if (link.url.includes('linkedin.com')) platform = 'linkedin';
          
          return {
            representative_id: representativeId,
            platform,
            handle: this.extractHandle(link.url, platform),
            url: link.url,
            is_verified: false,
            source: 'openstates-people'
          };
        });
      
      if (socialMedia.length > 0) {
        const { error } = await supabase
          .from('representative_social_media_optimal')
          .insert(socialMedia);
        
        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`    ❌ Insert social media error: ${error.message}`);
      throw error;
    }
  }

  // Extract handle from URL
  extractHandle(url, platform) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      if (platform === 'twitter') {
        return pathname.split('/')[1] || '';
      } else if (platform === 'facebook') {
        return pathname.split('/')[1] || '';
      } else if (platform === 'instagram') {
        return pathname.split('/')[1] || '';
      } else if (platform === 'youtube') {
        return pathname.split('/')[1] || '';
      } else if (platform === 'linkedin') {
        return pathname.split('/')[1] || '';
      }
      
      return '';
    } catch {
      return '';
    }
  }

  // Insert roles with complete error handling
  async insertRoles(representativeId, person) {
    if (!person.roles || person.roles.length === 0) return;
    
    try {
      const roleMapping = this.getRoleTypeMapping();
      
      const roles = person.roles.map(role => ({
        representative_id: representativeId,
        role_type: roleMapping[role.type] || 'state_representative',
        jurisdiction: role.jurisdiction,
        district: role.district,
        start_date: role.start_date,
        end_date: role.end_date,
        end_reason: role.end_reason,
        is_current: this.isActuallyCurrentRole(role),
        source: 'openstates-people'
      }));
      
      const { error } = await supabase
        .from('representative_roles_optimal')
        .insert(roles);
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
    } catch (error) {
      console.log(`    ❌ Insert roles error: ${error.message}`);
      throw error;
    }
  }

  // Insert photos with complete error handling
  async insertPhotos(representativeId, person) {
    if (!person.image) return;
    
    try {
      const photo = {
        representative_id: representativeId,
        url: person.image,
        quality: 'good',
        is_primary: true,
        source: 'openstates-people'
      };
      
      const { error } = await supabase
        .from('representative_photos_optimal')
        .insert(photo);
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
    } catch (error) {
      console.log(`    ❌ Insert photos error: ${error.message}`);
      throw error;
    }
  }

  // Insert contacts with complete error handling
  async insertContacts(representativeId, person) {
    try {
      const contacts = [];
      
      if (person.email) {
        contacts.push({
          representative_id: representativeId,
          contact_type: 'email',
          value: person.email,
          source: 'openstates-people'
        });
      }
      
      if (person.offices && person.offices.length > 0) {
        person.offices.forEach(office => {
          if (office.voice) {
            contacts.push({
              representative_id: representativeId,
              contact_type: 'phone',
              value: office.voice,
              source: 'openstates-people'
            });
          }
        });
      }
      
      if (contacts.length > 0) {
        const { error } = await supabase
          .from('representative_contacts_optimal')
          .insert(contacts);
        
        if (error) {
          throw new Error(`Supabase error: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`    ❌ Insert contacts error: ${error.message}`);
      throw error;
    }
  }

  // Insert jurisdiction with complete error handling
  async insertJurisdiction(metadata) {
    if (!metadata.jurisdiction) return;
    
    try {
      const jurisdiction = {
        ocd_division_id: metadata.jurisdiction,
        name: metadata.jurisdiction,
        level: metadata.governmentLevel,
        state: metadata.state,
        source: 'openstates-people'
      };
      
      const { error } = await supabase
        .from('jurisdictions_optimal')
        .upsert(jurisdiction, { onConflict: 'ocd_division_id' });
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }
    } catch (error) {
      console.log(`    ❌ Insert jurisdiction error: ${error.message}`);
      throw error;
    }
  }
}

// Run the processor for a single state
async function main() {
  const stateCode = process.argv[2];
  
  if (!stateCode) {
    console.log('Usage: node COMPREHENSIVE_OPENSTATES_PROCESSOR.js <state_code>');
    console.log('Example: node COMPREHENSIVE_OPENSTATES_PROCESSOR.js ca');
    process.exit(1);
  }
  
  const processor = new ComprehensiveOpenStatesProcessor();
  const result = await processor.processState(stateCode);
  
  console.log('\n🎯 FINAL RESULTS');
  console.log('=' .repeat(50));
  console.log(`📊 Processed: ${result.processed}`);
  console.log(`⏭️  Skipped: ${result.skipped}`);
  console.log(`❌ Errors: ${result.errors}`);
  
  if (result.errors > 0) {
    console.log('\n❌ PROCESSING FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ PROCESSING SUCCESSFUL');
  }
}

main().catch(console.error);

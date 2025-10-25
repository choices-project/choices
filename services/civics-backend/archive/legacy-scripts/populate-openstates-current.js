#!/usr/bin/env node

/**
 * Populate Database with Current OpenStates Representatives
 * 
 * This script processes the OpenStates YAML files and populates the database
 * with ONLY current representatives (no retired/historical data).
 * 
 * Created: January 27, 2025
 * Purpose: Process 25,000+ YAML files and populate database with current reps only
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const OPENSTATES_DATA_PATH = '/Users/alaughingkitsune/src/Choices/services/civics-backend/data/openstates-people/data';
const SUPABASE_URL = process.env.SUPABASE_URL || 'your-supabase-url';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Statistics tracking
let stats = {
  totalFiles: 0,
  processedFiles: 0,
  currentRepresentatives: 0,
  skippedRetired: 0,
  errors: 0,
  states: {}
};

/**
 * Check if a person has current roles (not retired)
 */
function hasCurrentRoles(person) {
  if (!person.roles || !Array.isArray(person.roles)) {
    return false;
  }

  const currentDate = new Date();
  
  return person.roles.some(role => {
    // Must be a legislative or executive role
    if (!['upper', 'lower', 'legislature', 'governor', 'lt_governor', 'mayor'].includes(role.type)) {
      return false;
    }

    // Check if role is current (no end_date or end_date in future)
    const hasStartDate = role.start_date;
    const hasEndDate = role.end_date;
    
    if (!hasStartDate) return false;
    
    // If no end_date, it's current
    if (!hasEndDate) return true;
    
    // If end_date is in the future, it's current
    const endDate = new Date(role.end_date);
    return endDate > currentDate;
  });
}

/**
 * Extract state code from jurisdiction
 */
function extractStateCode(jurisdiction) {
  if (!jurisdiction) return 'US';
  
  const stateMatch = jurisdiction.match(/state:([a-z]{2})/);
  if (stateMatch) {
    return stateMatch[1].toUpperCase();
  }
  
  return 'US';
}

/**
 * Determine office level from role type
 */
function getOfficeLevel(roleType, jurisdiction) {
  if (jurisdiction && jurisdiction.includes('country:us/government')) {
    return 'federal';
  }
  
  if (jurisdiction && jurisdiction.includes('state:')) {
    return 'state';
  }
  
  return 'local';
}

/**
 * Get office title from role type
 */
function getOfficeTitle(roleType) {
  const titles = {
    'upper': 'State Senator',
    'lower': 'State Representative', 
    'legislature': 'Legislator',
    'governor': 'Governor',
    'lt_governor': 'Lieutenant Governor',
    'mayor': 'Mayor'
  };
  
  return titles[roleType] || 'Legislator';
}

/**
 * Process a single YAML file
 */
async function processYamlFile(filePath, stateCode) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const person = yaml.load(fileContent);
    
    if (!person || !person.id) {
      console.log(`⚠️  Skipping invalid file: ${filePath}`);
      return null;
    }

    // Check if person has current roles
    if (!hasCurrentRoles(person)) {
      stats.skippedRetired++;
      return null;
    }

    console.log(`✅ Processing current representative: ${person.name} (${stateCode})`);
    
    // Insert into openstates_people_data
    const { data: personData, error: personError } = await supabase
      .from('openstates_people_data')
      .insert({
        openstates_id: person.id,
        name: person.name,
        given_name: person.given_name,
        family_name: person.family_name,
        middle_name: person.middle_name,
        suffix: person.suffix,
        nickname: person.nickname,
        birth_date: person.birth_date,
        death_date: person.death_date,
        image_url: person.image,
        gender: person.gender,
        biography: person.biography,
        party: person.party?.[0]?.name || person.party,
        current_party: !!person.party,
        extras: person.extras || {}
      })
      .select()
      .single();

    if (personError) {
      console.error(`❌ Error inserting person ${person.name}:`, personError);
      stats.errors++;
      return null;
    }

    stats.currentRepresentatives++;

    // Insert current roles only
    if (person.roles && Array.isArray(person.roles)) {
      for (const role of person.roles) {
        if (['upper', 'lower', 'legislature', 'governor', 'lt_governor', 'mayor'].includes(role.type)) {
          const isCurrent = !role.end_date || new Date(role.end_date) > new Date();
          
          if (isCurrent) {
            await supabase
              .from('openstates_people_roles')
              .insert({
                openstates_person_id: personData.id,
                role_type: role.type,
                title: role.title,
                jurisdiction: role.jurisdiction,
                start_date: role.start_date,
                end_date: role.end_date,
                end_reason: role.end_reason,
                district: role.district,
                division: role.division,
                member_role: role.member_role,
                is_current: true
              });
          }
        }
      }
    }

    // Insert contact details
    if (person.contact_details && Array.isArray(person.contact_details)) {
      for (const contact of person.contact_details) {
        await supabase
          .from('openstates_people_contacts')
          .insert({
            openstates_person_id: personData.id,
            contact_type: contact.type,
            value: contact.value,
            note: contact.note
          });
      }
    }

    // Insert social media
    if (person.ids) {
      for (const [platform, username] of Object.entries(person.ids)) {
        if (username) {
          await supabase
            .from('openstates_people_social_media')
            .insert({
              openstates_person_id: personData.id,
              platform: platform,
              username: username
            });
        }
      }
    }

    // Insert sources
    if (person.sources && Array.isArray(person.sources)) {
      for (const source of person.sources) {
        await supabase
          .from('openstates_people_sources')
          .insert({
            openstates_person_id: personData.id,
            source_type: source.note || 'official',
            url: source.url,
            note: source.note
          });
      }
    }

    // Insert identifiers
    if (person.other_identifiers && Array.isArray(person.other_identifiers)) {
      for (const identifier of person.other_identifiers) {
        await supabase
          .from('openstates_people_identifiers')
          .insert({
            openstates_person_id: personData.id,
            scheme: identifier.scheme,
            identifier: identifier.identifier,
            start_date: identifier.start_date,
            end_date: identifier.end_date
          });
      }
    }

    // Insert other names
    if (person.other_names && Array.isArray(person.other_names)) {
      for (const name of person.other_names) {
        await supabase
          .from('openstates_people_other_names')
          .insert({
            openstates_person_id: personData.id,
            name: name.name,
            start_date: name.start_date,
            end_date: name.end_date
          });
      }
    }

    return personData;

  } catch (error) {
    console.error(`❌ Error processing file ${filePath}:`, error.message);
    stats.errors++;
    return null;
  }
}

/**
 * Process all YAML files in a directory
 */
async function processDirectory(dirPath, stateCode) {
  const files = fs.readdirSync(dirPath);
  const yamlFiles = files.filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
  
  console.log(`\n📁 Processing ${yamlFiles.length} files in ${stateCode}...`);
  
  for (const file of yamlFiles) {
    const filePath = path.join(dirPath, file);
    stats.totalFiles++;
    
    try {
      await processYamlFile(filePath, stateCode);
      stats.processedFiles++;
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
      stats.errors++;
    }
  }
  
  stats.states[stateCode] = yamlFiles.length;
}

/**
 * Populate representatives_core table
 */
async function populateRepresentativesCore() {
  console.log('\n🔄 Populating representatives_core table...');
  
  const { data: people, error } = await supabase
    .from('openstates_people_data')
    .select(`
      id,
      openstates_id,
      name,
      party,
      openstates_people_roles (
        role_type,
        jurisdiction,
        district,
        is_current
      )
    `);

  if (error) {
    console.error('❌ Error fetching people:', error);
    return;
  }

  for (const person of people) {
    const currentRoles = person.openstates_people_roles.filter(role => role.is_current);
    
    for (const role of currentRoles) {
      const stateCode = extractStateCode(role.jurisdiction);
      const level = getOfficeLevel(role.role_type, role.jurisdiction);
      const office = getOfficeTitle(role.role_type);
      const canonicalId = `canonical-${person.id}`;
      
      await supabase
        .from('representatives_core')
        .insert({
          name: person.name,
          office: office,
          level: level,
          state: stateCode,
          party: person.party,
          district: role.district,
          openstates_id: person.openstates_id,
          canonical_id: canonicalId,
          is_active: true
        });
    }
  }
}

/**
 * Populate ID crosswalk
 */
async function populateIdCrosswalk() {
  console.log('\n🔄 Populating ID crosswalk...');
  
  const { data: representatives, error } = await supabase
    .from('representatives_core')
    .select('id, canonical_id, openstates_id');

  if (error) {
    console.error('❌ Error fetching representatives:', error);
    return;
  }

  for (const rep of representatives) {
    await supabase
      .from('id_crosswalk')
      .insert({
        entity_type: 'person',
        canonical_id: rep.canonical_id,
        source: 'open-states',
        source_id: rep.openstates_id,
        attrs: {
          quality_score: 0.95,
          source_confidence: 'high',
          last_verified: new Date().toISOString()
        }
      });
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting OpenStates Current Representatives Population...\n');
  
  try {
    // Check if data directory exists
    if (!fs.existsSync(OPENSTATES_DATA_PATH)) {
      console.error(`❌ OpenStates data directory not found: ${OPENSTATES_DATA_PATH}`);
      process.exit(1);
    }

    // Process each state directory
    const stateDirs = fs.readdirSync(OPENSTATES_DATA_PATH);
    
    for (const stateDir of stateDirs) {
      const statePath = path.join(OPENSTATES_DATA_PATH, stateDir);
      
      if (fs.statSync(statePath).isDirectory()) {
        // Process legislature directory (current representatives)
        const legislaturePath = path.join(statePath, 'legislature');
        if (fs.existsSync(legislaturePath)) {
          await processDirectory(legislaturePath, stateDir.toUpperCase());
        }
        
        // Process executive directory (governors, etc.)
        const executivePath = path.join(statePath, 'executive');
        if (fs.existsSync(executivePath)) {
          await processDirectory(executivePath, stateDir.toUpperCase());
        }
      }
    }

    // Populate derived tables
    await populateRepresentativesCore();
    await populateIdCrosswalk();

    // Print final statistics
    console.log('\n📊 FINAL STATISTICS:');
    console.log('==================');
    console.log(`Total files processed: ${stats.processedFiles}/${stats.totalFiles}`);
    console.log(`Current representatives: ${stats.currentRepresentatives}`);
    console.log(`Skipped retired: ${stats.skippedRetired}`);
    console.log(`Errors: ${stats.errors}`);
    console.log('\nStates processed:');
    for (const [state, count] of Object.entries(stats.states)) {
      console.log(`  ${state}: ${count} files`);
    }

    console.log('\n✅ Database population complete!');
    console.log('🎯 Ready for superior ingest pipeline optimization!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, processYamlFile, hasCurrentRoles };

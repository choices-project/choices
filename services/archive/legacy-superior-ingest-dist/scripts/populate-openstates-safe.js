"use strict";
const path = require('path');
const fs = require('fs').promises;
const yaml = require('js-yaml');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
// Enhanced logging and error tracking
const log = {
    info: (msg) => console.log(`ℹ️  ${new Date().toISOString()} - ${msg}`),
    success: (msg) => console.log(`✅ ${new Date().toISOString()} - ${msg}`),
    warning: (msg) => console.log(`⚠️  ${new Date().toISOString()} - ${msg}`),
    error: (msg) => console.log(`❌ ${new Date().toISOString()} - ${msg}`),
    debug: (msg) => console.log(`🔍 ${new Date().toISOString()} - ${msg}`)
};
// Error tracking
let errors = [];
let warnings = [];
// Configuration
const OPENSTATES_DATA_PATH = path.resolve(__dirname, '../../data/openstates-people/data');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        persistSession: false,
    },
});
// Statistics tracking
let totalFilesProcessed = 0;
let totalCurrentRepresentatives = 0;
let totalPeopleInserted = 0;
let totalPeopleUpdated = 0;
let totalRolesInserted = 0;
let totalRolesUpdated = 0;
let totalContactsInserted = 0;
let totalContactsUpdated = 0;
let totalSocialMediaInserted = 0;
let totalSocialMediaUpdated = 0;
let totalSourcesInserted = 0;
let totalSourcesUpdated = 0;
let totalIdentifiersInserted = 0;
let totalIdentifiersUpdated = 0;
let totalOtherNamesInserted = 0;
let totalOtherNamesUpdated = 0;
let totalRepresentativesCoreInserted = 0;
let totalRepresentativesCoreUpdated = 0;
let totalIdCrosswalkInserted = 0;
let totalIdCrosswalkUpdated = 0;
let totalRepContactsInserted = 0;
let totalRepContactsUpdated = 0;
let totalRepSocialMediaInserted = 0;
let totalRepSocialMediaUpdated = 0;
let totalRepCommitteesInserted = 0;
let totalRepCommitteesUpdated = 0;
// Current date for filtering active roles
const CURRENT_DATE = new Date();
async function clearExistingData(openstatesPersonId) {
    // Clear existing related data to avoid duplicates
    await supabase.from('openstates_people_roles').delete().eq('openstates_person_id', openstatesPersonId);
    await supabase.from('openstates_people_contacts').delete().eq('openstates_person_id', openstatesPersonId);
    await supabase.from('openstates_people_social_media').delete().eq('openstates_person_id', openstatesPersonId);
    await supabase.from('openstates_people_sources').delete().eq('openstates_person_id', openstatesPersonId);
    await supabase.from('openstates_people_identifiers').delete().eq('openstates_person_id', openstatesPersonId);
    await supabase.from('openstates_people_other_names').delete().eq('openstates_person_id', openstatesPersonId);
}
async function clearRepresentativeData(representativeId) {
    // Clear existing representative data
    await supabase.from('representative_contacts').delete().eq('representative_id', representativeId);
    await supabase.from('representative_social_media').delete().eq('representative_id', representativeId);
    await supabase.from('representative_committees').delete().eq('representative_id', representativeId);
}
async function processPersonFile(filePath, stateCode) {
    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const personData = yaml.load(fileContent);
        // Validate required fields
        if (!personData.id || !personData.name) {
            warnings.push(`Skipping file ${filePath}: Missing required fields (id or name)`);
            return;
        }
        // Filter for current representatives only
        const isCurrentLegislator = personData.roles && personData.roles.some(role => ['upper', 'lower', 'legislature', 'governor', 'lt_governor', 'mayor'].includes(role.type) &&
            (!role.end_date || new Date(role.end_date) > new Date()));
        if (!isCurrentLegislator) {
            return; // Skip if not a current legislator
        }
        totalCurrentRepresentatives++;
        log.success(`Processing current representative: ${personData.name} (${stateCode})`);
        // 1. Insert/Update into openstates_people_data
        const { data: insertedPerson, error: personError } = await supabase
            .from('openstates_people_data')
            .upsert({
            openstates_id: personData.id,
            name: personData.name,
            given_name: personData.given_name,
            family_name: personData.family_name,
            middle_name: personData.middle_name,
            suffix: personData.suffix,
            nickname: personData.other_names?.[0]?.name,
            birth_date: personData.birth_date,
            death_date: personData.death_date,
            image_url: personData.image,
            gender: personData.gender,
            biography: personData.biography,
            party: personData.party?.[0]?.name,
            current_party: personData.party && personData.party.length > 0,
            extras: personData.extras || {},
        }, { onConflict: 'openstates_id' })
            .select();
        if (personError) {
            const errorMsg = `Error inserting person ${personData.name}: ${personError.message}`;
            log.error(errorMsg);
            errors.push(errorMsg);
            return;
        }
        // Check if this was an insert or update
        const wasInserted = insertedPerson[0].created_at === insertedPerson[0].updated_at;
        if (wasInserted) {
            totalPeopleInserted++;
        }
        else {
            totalPeopleUpdated++;
        }
        const openstatesPersonId = insertedPerson[0].id;
        // Clear existing data to avoid duplicates
        await clearExistingData(openstatesPersonId);
        // 2. Insert into openstates_people_roles
        if (personData.roles) {
            for (const role of personData.roles) {
                const { error: roleError } = await supabase
                    .from('openstates_people_roles')
                    .insert({
                    openstates_person_id: openstatesPersonId,
                    role_type: role.type,
                    title: role.title,
                    jurisdiction: role.jurisdiction,
                    start_date: role.start_date,
                    end_date: role.end_date,
                    end_reason: role.end_reason,
                    district: role.district,
                    division: role.division,
                    member_role: role.role,
                    is_current: !role.end_date || new Date(role.end_date) > CURRENT_DATE,
                });
                if (roleError) {
                    const errorMsg = `Error inserting role for ${personData.name}: ${roleError.message}`;
                    log.error(errorMsg);
                    errors.push(errorMsg);
                }
                else {
                    totalRolesInserted++;
                }
            }
        }
        // 3. Insert into openstates_people_contacts
        if (personData.contact_details) {
            for (const contact of personData.contact_details) {
                const { error: contactError } = await supabase
                    .from('openstates_people_contacts')
                    .insert({
                    openstates_person_id: openstatesPersonId,
                    contact_type: contact.type,
                    value: contact.value,
                    note: contact.note,
                });
                if (contactError) {
                    const errorMsg = `Error inserting contact for ${personData.name}: ${contactError.message}`;
                    log.error(errorMsg);
                    errors.push(errorMsg);
                }
                else {
                    totalContactsInserted++;
                }
            }
        }
        // 4. Insert into openstates_people_social_media (from 'ids' field in YAML)
        if (personData.ids) {
            for (const platform in personData.ids) {
                if (['twitter', 'youtube', 'instagram', 'facebook'].includes(platform)) {
                    const { error: socialError } = await supabase
                        .from('openstates_people_social_media')
                        .insert({
                        openstates_person_id: openstatesPersonId,
                        platform: platform,
                        username: personData.ids[platform],
                    });
                    if (socialError) {
                        const errorMsg = `Error inserting social media for ${personData.name} (${platform}): ${socialError.message}`;
                        log.error(errorMsg);
                        errors.push(errorMsg);
                    }
                    else {
                        totalSocialMediaInserted++;
                    }
                }
            }
        }
        // 5. Insert into openstates_people_sources
        if (personData.sources) {
            for (const source of personData.sources) {
                const { error: sourceError } = await supabase
                    .from('openstates_people_sources')
                    .insert({
                    openstates_person_id: openstatesPersonId,
                    source_type: source.note || 'unknown',
                    url: source.url,
                    note: source.note,
                });
                if (sourceError) {
                    const errorMsg = `Error inserting source for ${personData.name}: ${sourceError.message}`;
                    log.error(errorMsg);
                    errors.push(errorMsg);
                }
                else {
                    totalSourcesInserted++;
                }
            }
        }
        // 6. Insert into openstates_people_identifiers
        if (personData.other_identifiers) {
            for (const identifier of personData.other_identifiers) {
                const { error: identifierError } = await supabase
                    .from('openstates_people_identifiers')
                    .insert({
                    openstates_person_id: openstatesPersonId,
                    scheme: identifier.scheme,
                    identifier: identifier.identifier,
                    start_date: identifier.start_date,
                    end_date: identifier.end_date,
                });
                if (identifierError) {
                    const errorMsg = `Error inserting identifier for ${personData.name}: ${identifierError.message}`;
                    log.error(errorMsg);
                    errors.push(errorMsg);
                }
                else {
                    totalIdentifiersInserted++;
                }
            }
        }
        // 7. Insert into openstates_people_other_names
        if (personData.other_names) {
            for (const otherName of personData.other_names) {
                const { error: otherNameError } = await supabase
                    .from('openstates_people_other_names')
                    .insert({
                    openstates_person_id: openstatesPersonId,
                    name: otherName.name,
                    start_date: otherName.start_date,
                    end_date: otherName.end_date,
                });
                if (otherNameError) {
                    const errorMsg = `Error inserting other name for ${personData.name}: ${otherNameError.message}`;
                    log.error(errorMsg);
                    errors.push(errorMsg);
                }
                else {
                    totalOtherNamesInserted++;
                }
            }
        }
        // 8. Insert/Update into representatives_core
        const currentRelevantRole = personData.roles?.find(role => ['upper', 'lower', 'governor', 'lt_governor', 'mayor'].includes(role.type) &&
            (!role.end_date || new Date(role.end_date) > new Date()));
        if (currentRelevantRole) {
            const office = currentRelevantRole.title || (currentRelevantRole.type === 'upper' ? 'State Senator' : 'State Representative');
            const level = currentRelevantRole.jurisdiction.includes('country:us/state:') ? 'state' : 'local';
            const state = currentRelevantRole.jurisdiction.split('state:')[1]?.substring(0, 2).toUpperCase() || 'US';
            const { data: insertedRepCore, error: repCoreError } = await supabase
                .from('representatives_core')
                .upsert({
                name: personData.name,
                office: office,
                level: level,
                state: state,
                party: personData.party?.[0]?.name,
                district: currentRelevantRole.district,
                openstates_id: personData.id,
                canonical_id: `canonical-${personData.id}`,
                is_active: true,
            }, { onConflict: 'openstates_id' })
                .select();
            if (repCoreError) {
                const errorMsg = `Error inserting into representatives_core for ${personData.name}: ${repCoreError.message}`;
                log.error(errorMsg);
                errors.push(errorMsg);
            }
            else {
                // Check if this was an insert or update
                const wasRepInserted = insertedRepCore[0].created_at === insertedRepCore[0].updated_at;
                if (wasRepInserted) {
                    totalRepresentativesCoreInserted++;
                }
                else {
                    totalRepresentativesCoreUpdated++;
                }
                const representativeId = insertedRepCore[0].id;
                // Clear existing representative data
                await clearRepresentativeData(representativeId);
                // 9. Insert/Update into id_crosswalk
                const { data: crosswalkData, error: crosswalkError } = await supabase
                    .from('id_crosswalk')
                    .upsert({
                    entity_type: 'person',
                    canonical_id: `canonical-${personData.id}`,
                    source: 'open-states',
                    source_id: personData.id,
                    attrs: {
                        quality_score: 0.95,
                        source_confidence: 'high',
                        last_verified: new Date().toISOString()
                    },
                }, { onConflict: ['source', 'source_id'] })
                    .select();
                if (crosswalkError) {
                    const errorMsg = `Error inserting into id_crosswalk for ${personData.name}: ${crosswalkError.message}`;
                    log.error(errorMsg);
                    errors.push(errorMsg);
                }
                else {
                    const wasCrosswalkInserted = crosswalkData[0].created_at === crosswalkData[0].updated_at;
                    if (wasCrosswalkInserted) {
                        totalIdCrosswalkInserted++;
                    }
                    else {
                        totalIdCrosswalkUpdated++;
                    }
                }
                // 10. Populate representative_contacts
                if (personData.contact_details) {
                    for (const contact of personData.contact_details) {
                        const { error: repContactError } = await supabase
                            .from('representative_contacts')
                            .insert({
                            representative_id: representativeId,
                            contact_type: contact.type,
                            value: contact.value,
                            is_primary: contact.note?.toLowerCase().includes('primary') || false,
                            is_verified: true,
                            source: 'openstates',
                        });
                        if (repContactError) {
                            const errorMsg = `Error inserting rep contact for ${personData.name}: ${repContactError.message}`;
                            log.error(errorMsg);
                            errors.push(errorMsg);
                        }
                        else {
                            totalRepContactsInserted++;
                        }
                    }
                }
                // 11. Populate representative_social_media
                if (personData.ids) {
                    for (const platform in personData.ids) {
                        if (['twitter', 'youtube', 'instagram', 'facebook'].includes(platform)) {
                            const { error: repSocialError } = await supabase
                                .from('representative_social_media')
                                .insert({
                                representative_id: representativeId,
                                platform: platform,
                                handle: personData.ids[platform],
                                is_primary: false,
                                is_verified: true,
                            });
                            if (repSocialError) {
                                const errorMsg = `Error inserting rep social media for ${personData.name} (${platform}): ${repSocialError.message}`;
                                log.error(errorMsg);
                                errors.push(errorMsg);
                            }
                            else {
                                totalRepSocialMediaInserted++;
                            }
                        }
                    }
                }
                // 12. Populate representative_committees
                if (personData.roles) {
                    for (const role of personData.roles) {
                        if (role.type === 'committee_member' || role.type === 'committee_chair') {
                            const { error: repCommitteeError } = await supabase
                                .from('representative_committees')
                                .insert({
                                representative_id: representativeId,
                                committee_name: role.title || 'Unknown Committee',
                                role: role.role || 'member',
                                start_date: role.start_date,
                                end_date: role.end_date,
                                is_current: !role.end_date || new Date(role.end_date) > CURRENT_DATE,
                            });
                            if (repCommitteeError) {
                                const errorMsg = `Error inserting rep committee for ${personData.name}: ${repCommitteeError.message}`;
                                log.error(errorMsg);
                                errors.push(errorMsg);
                            }
                            else {
                                totalRepCommitteesInserted++;
                            }
                        }
                    }
                }
            }
        }
    }
    catch (error) {
        const errorMsg = `Error processing file ${filePath}: ${error.message}`;
        log.error(errorMsg);
        errors.push(errorMsg);
    }
}
async function processDirectory(directoryPath, stateCode) {
    try {
        const files = await fs.readdir(directoryPath);
        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            const stat = await fs.stat(filePath);
            if (stat.isDirectory()) {
                // Recursively process subdirectories (e.g., legislature, executive, municipalities)
                await processDirectory(filePath, stateCode);
            }
            else if (file.endsWith('.yml') || file.endsWith('.yaml')) {
                totalFilesProcessed++;
                await processPersonFile(filePath, stateCode);
            }
        }
    }
    catch (error) {
        const errorMsg = `Error reading directory ${directoryPath}: ${error.message}`;
        log.error(errorMsg);
        errors.push(errorMsg);
    }
}
async function main() {
    log.info('Starting SAFE OpenStates People data population (no duplicates, updates existing)...');
    log.info(`Supabase URL: ${SUPABASE_URL ? 'Configured' : 'NOT CONFIGURED'}`);
    log.info(`Supabase Service Key: ${SUPABASE_SERVICE_KEY ? 'Configured' : 'NOT CONFIGURED'}`);
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        log.error('Environment variables SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
        return;
    }
    try {
        const stateDirs = await fs.readdir(OPENSTATES_DATA_PATH);
        for (const stateCode of stateDirs) {
            const stateDirPath = path.join(OPENSTATES_DATA_PATH, stateCode);
            const stat = await fs.stat(stateDirPath);
            if (stat.isDirectory()) {
                log.info(`Processing files in ${stateCode.toUpperCase()}...`);
                await processDirectory(stateDirPath, stateCode.toUpperCase());
            }
        }
        log.info('--- SAFE Population Summary ---');
        log.info(`Total YAML files processed: ${totalFilesProcessed}`);
        log.info(`Total current representatives found: ${totalCurrentRepresentatives}`);
        log.info(`\n📊 OpenStates People Data:`);
        log.info(`  Inserted: ${totalPeopleInserted}`);
        log.info(`  Updated: ${totalPeopleUpdated}`);
        log.info(`\n📊 Representatives Core:`);
        log.info(`  Inserted: ${totalRepresentativesCoreInserted}`);
        log.info(`  Updated: ${totalRepresentativesCoreUpdated}`);
        log.info(`\n📊 ID Crosswalk:`);
        log.info(`  Inserted: ${totalIdCrosswalkInserted}`);
        log.info(`  Updated: ${totalIdCrosswalkUpdated}`);
        log.info(`\n📊 Related Data:`);
        log.info(`  Roles: ${totalRolesInserted}`);
        log.info(`  Contacts: ${totalContactsInserted}`);
        log.info(`  Social Media: ${totalSocialMediaInserted}`);
        log.info(`  Sources: ${totalSourcesInserted}`);
        log.info(`  Identifiers: ${totalIdentifiersInserted}`);
        log.info(`  Other Names: ${totalOtherNamesInserted}`);
        log.info(`  Rep Contacts: ${totalRepContactsInserted}`);
        log.info(`  Rep Social Media: ${totalRepSocialMediaInserted}`);
        log.info(`  Rep Committees: ${totalRepCommitteesInserted}`);
        // Error and warning summary
        if (errors.length > 0) {
            log.error(`\n❌ Errors encountered: ${errors.length}`);
            errors.slice(0, 10).forEach(error => log.error(`  - ${error}`));
            if (errors.length > 10) {
                log.error(`  ... and ${errors.length - 10} more errors`);
            }
        }
        if (warnings.length > 0) {
            log.warning(`\n⚠️  Warnings: ${warnings.length}`);
            warnings.slice(0, 5).forEach(warning => log.warning(`  - ${warning}`));
            if (warnings.length > 5) {
                log.warning(`  ... and ${warnings.length - 5} more warnings`);
            }
        }
        log.success('SAFE OpenStates People data population complete!');
        log.success('No duplicates created - existing data was updated!');
    }
    catch (error) {
        log.error(`An error occurred during the main process: ${error.message}`);
        errors.push(`Main process error: ${error.message}`);
    }
}
main();
//# sourceMappingURL=populate-openstates-safe.js.map
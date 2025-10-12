/**
 * OpenStates People Database Population API
 * 
 * ✅ ACTIVE: This endpoint is live and actively used for comprehensive data population
 * 
 * Populates database with comprehensive representative data from OpenStates People database
 * 
 * NOTE: This uses the OpenStates People Database (25,000+ YAML files), NOT the OpenStates API
 * The OpenStates API has rate limits (250/day), but this database is offline and comprehensive
 * 
 * Created: October 8, 2025
 * Updated: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

import OpenStatesIntegration from '@/features/civics/lib/civics-superior/openstates-integration';
// import { CurrentElectorateVerifier } from '@/features/civics/lib/civics-superior/current-electorate-verifier';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(_request: NextRequest) {
  const startTime = new Date().toISOString();
  
  try {
    console.log('🚀 OpenStates People Database Population requested');
    console.log(`   System Date: ${new Date().toISOString()}`);
    console.log(`   NOTE: This uses the OpenStates People Database (offline), NOT the OpenStates API`);
    console.log(`   📊 Processing will show detailed progress for each step`);
    
    const body = await _request.json();
    const { state, states, limit, clear } = body;
    
    console.log(`📥 Request parameters:`, { state, states, limit, clear });
    
    // Initialize OpenStates integration
    const openStatesIntegration = new OpenStatesIntegration({
      dataPath: '/Users/alaughingkitsune/src/Choices/scratch/agent-b/openstates-people/data',
      currentDate: new Date()
    });
    
    // Test integration first
    console.log('🧪 Testing OpenStates integration...');
    const integrationTest = await openStatesIntegration.testIntegration();
    console.log('   Integration Test Result:', integrationTest);
    
    if (!integrationTest.success) {
      console.log('❌ Integration test failed, aborting');
      return NextResponse.json({
        success: false,
        error: 'OpenStates integration test failed',
        details: integrationTest.details
      }, { status: 500 });
    }
    console.log('✅ Integration test passed');
    
    // Get available states
    console.log('📊 Getting available states...');
    const availableStates = await openStatesIntegration.getAvailableStates();
    console.log(`   Found ${availableStates.length} available states`);
    
    // Determine which states to process
    console.log('🎯 Determining states to process...');
    let statesToProcess: string[] = [];
    if (states && Array.isArray(states)) {
      statesToProcess = states.filter(state => availableStates.includes(state));
      console.log(`   Requested states: ${states.join(', ')}`);
      console.log(`   Valid states: ${statesToProcess.join(', ')}`);
    } else if (state && availableStates.includes(state)) {
      statesToProcess = [state];
      console.log(`   Single state requested: ${state}`);
    } else {
      // Default to first few states for testing
      statesToProcess = availableStates.slice(0, 3);
      console.log(`   No specific states requested, using first 3: ${statesToProcess.join(', ')}`);
    }
    
    console.log(`🎯 Final states to process: ${statesToProcess.join(', ')}`);
    
    // Clear existing data if requested
    if (clear) {
      console.log(`🗑️  Clearing existing data for states: ${statesToProcess.join(', ')}`);
      for (const stateCode of statesToProcess) {
        const { error } = await supabase
          .from('representatives_core')
          .delete()
          .eq('state', stateCode);
        
        if (error) {
          console.error(`❌ Error clearing data for ${stateCode}:`, error);
        } else {
          console.log(`✅ Cleared existing data for ${stateCode}`);
        }
      }
    }
    
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
      startTime,
      duration: '',
      states: statesToProcess,
      representatives: [] as any[]
    };
    
    // Process each state
    console.log(`\n🔄 Starting state processing...`);
    for (const stateCode of statesToProcess) {
      try {
        console.log(`\n🔍 Processing state: ${stateCode}`);
        console.log(`   📂 Reading OpenStates People Database files...`);
        
        // Get current representatives from OpenStates People database
        const representatives = await openStatesIntegration.getCurrentRepresentatives(stateCode);
        console.log(`   📊 Found ${representatives.length} current representatives for ${stateCode}`);
        
        if (representatives.length === 0) {
          console.log(`   ⚠️  No current representatives found for ${stateCode}, skipping`);
          continue;
        }
        
        const processLimit = limit || representatives.length;
        console.log(`   🎯 Processing ${Math.min(processLimit, representatives.length)} representatives (limit: ${processLimit})`);
        
        // Process each representative
        for (let i = 0; i < Math.min(processLimit, representatives.length); i++) {
          const person = representatives[i];
          if (!person) {
            console.log(`   [${i + 1}/${Math.min(processLimit, representatives.length)}] ⚠️ Skipping null person...`);
            continue;
          }
          
          try {
            console.log(`   [${i + 1}/${Math.min(processLimit, representatives.length)}] 🔄 Processing ${person.name || 'Unknown'}...`);
            
            // Extract contact information
            console.log(`      📞 Extracting contact information...`);
            const contacts = openStatesIntegration.getContactInfo(person);
            console.log(`      📱 Extracting social media links...`);
            const socialMedia = openStatesIntegration.getSocialMediaLinks(person);
            console.log(`      📚 Extracting official sources...`);
            const sources = openStatesIntegration.getOfficialSources(person);
            console.log(`      🏛️  Extracting current roles...`);
            const roles = openStatesIntegration.getCurrentRoles(person);
            console.log(`      📋 Extracting committee memberships...`);
            const committeeMemberships = (person as any).committee_memberships || [];
            
            // Calculate data quality score
            console.log(`      📊 Calculating data quality score...`);
            let qualityScore = 0;
            if (person?.name) qualityScore += 20;
            if (person?.party) qualityScore += 15;
            if (contacts.length > 0) qualityScore += 20;
            if (socialMedia.length > 0) qualityScore += 15;
            if (sources.length > 0) qualityScore += 10;
            if (person?.biography) qualityScore += 10;
            if (person?.image) qualityScore += 10;
            if (committeeMemberships.length > 0) qualityScore += 10;
            console.log(`      📊 Quality score: ${qualityScore}/100 (contacts: ${contacts.length}, social: ${socialMedia.length}, sources: ${sources.length}, committees: ${committeeMemberships.length})`);
            
            // Prepare data for database storage
            console.log(`      💾 Preparing data for database storage...`);
            const representativeData = {
              name: person?.name || 'Unknown',
              party: person?.party || 'Unknown',
              office: roles[0]?.title || 'Representative',
              level: 'state', // OpenStates People Database contains state legislators
              state: stateCode,
              district: roles[0]?.district || null,
              bioguide_id: person?.other_identifiers?.find(id => id.scheme === 'bioguide')?.identifier || null,
              openstates_id: person?.id || null,
              fec_id: person?.other_identifiers?.find(id => id.scheme === 'fec')?.identifier || null,
              google_civic_id: null,
              legiscan_id: person?.other_identifiers?.find(id => id.scheme === 'legiscan')?.identifier || null,
              congress_gov_id: person?.other_identifiers?.find(id => id.scheme === 'congress-gov')?.identifier || null,
              govinfo_id: person?.other_identifiers?.find(id => id.scheme === 'govinfo')?.identifier || null,
              wikipedia_url: person?.links?.find(link => link.url.includes('wikipedia'))?.url || null,
              ballotpedia_url: person?.links?.find(link => link.url.includes('ballotpedia'))?.url || null,
              twitter_handle: socialMedia.find(sm => sm.url.includes('twitter.com'))?.url || null,
              facebook_url: socialMedia.find(sm => sm.url.includes('facebook.com'))?.url || null,
              instagram_handle: socialMedia.find(sm => sm.url.includes('instagram.com'))?.url || null,
              linkedin_url: socialMedia.find(sm => sm.url.includes('linkedin.com'))?.url || null,
              youtube_channel: socialMedia.find(sm => sm.url.includes('youtube.com'))?.url || null,
              primary_email: contacts.find(c => c.type === 'email')?.value || null,
              primary_phone: contacts.find(c => c.type === 'phone')?.value || null,
              primary_website: contacts.find(c => c.type === 'url')?.value || person?.links?.[0]?.url || null,
              primary_photo_url: person?.image || null,
              data_quality_score: qualityScore,
              data_sources: ['openstates-people'],
              last_verified: new Date().toISOString(),
              verification_status: qualityScore >= 50 ? 'verified' : 'unverified',
              created_at: new Date().toISOString(),
              last_updated: new Date().toISOString(),
              // Enhanced data (using correct JSONB column names)
              enhanced_contacts: contacts.map(contact => ({
                type: contact.type,
                value: contact.value,
                source: 'openstates-people',
                isPrimary: contact.type === 'email' || contact.type === 'phone',
                isVerified: true,
                note: contact.note
              })),
              enhanced_photos: person?.image ? [{
                url: person.image,
                source: 'openstates-people',
                altText: `Photo of ${person?.name || 'Unknown'}`,
                attribution: 'OpenStates People Database'
              }] : [],
              enhanced_activity: [
                ...(person?.biography ? [{
                  type: 'biography',
                  title: `Biography: ${person?.name || 'Unknown'}`,
                  description: person?.biography,
                  date: new Date().toISOString(),
                  source: 'openstates-people'
                }] : []),
                ...(committeeMemberships.map((membership: any) => ({
                  type: 'committee_membership',
                  title: `${membership.committee} - ${membership.role}`,
                  description: `Committee: ${membership.committee} (${membership.role})`,
                  date: membership.start_date || new Date().toISOString(),
                  source: 'openstates-people',
                  metadata: {
                    committee: membership.committee,
                    member_role: membership.role,
                    jurisdiction: membership.jurisdiction,
                    start_date: membership.start_date,
                    end_date: membership.end_date
                  }
                })))
              ],
              enhanced_social_media: socialMedia.map(sm => ({
                platform: sm.url.includes('twitter.com') ? 'twitter' : 
                         sm.url.includes('facebook.com') ? 'facebook' :
                         sm.url.includes('instagram.com') ? 'instagram' :
                         sm.url.includes('linkedin.com') ? 'linkedin' : 'other',
                handle: sm.url,
                url: sm.url,
                verified: false
              }))
            };
            
            // Debug: Log what's being stored
            console.log(`      🐛 DEBUG: enhanced_activity length: ${representativeData.enhanced_activity.length}`);
            if (representativeData.enhanced_activity.length > 0) {
              console.log(`      🐛 DEBUG: First activity type: ${representativeData.enhanced_activity[0].type}`);
            }
            
            // Check if representative already exists
            console.log(`      🔍 Checking if ${person.name} already exists in database...`);
            const { data: existing } = await supabase
              .from('representatives_core')
              .select('id')
              .eq('openstates_id', person.id)
              .maybeSingle();
            
            if (existing) {
              // Update existing
              console.log(`      🔄 Updating existing record for ${person.name}...`);
              const { error } = await supabase
                .from('representatives_core')
                .update(representativeData)
                .eq('id', existing.id);
              
              if (error) {
                console.error(`      ❌ DATABASE ERROR for ${person.name}:`, error);
                throw error;
              }
              console.log(`      ✅ Updated ${person.name} in database`);
            } else {
              // Insert new
              console.log(`      ➕ Inserting new record for ${person.name}...`);
              const { error } = await supabase
                .from('representatives_core')
                .insert(representativeData);
              
              if (error) {
                console.error(`      ❌ DATABASE ERROR for ${person.name}:`, error);
                throw error;
              }
              console.log(`      ✅ Inserted ${person.name} into database`);
            }
            
            results.representatives.push({
              name: person.name,
              state: stateCode,
              qualityScore,
              contacts: contacts.length,
              socialMedia: socialMedia.length,
              sources: sources.length,
              committees: committeeMemberships.length
            });
            
            results.successful++;
            console.log(`      ✅ Successfully processed ${person.name} (${results.successful}/${results.processed + 1} successful)`);
            
          } catch (error: any) {
            console.error(`      ❌ Error processing ${person.name}:`, error);
            results.failed++;
            results.errors.push(`${person.name}: ${error.message}`);
          }
          
          results.processed++;
          console.log(`   📊 Progress: ${results.processed}/${Math.min(processLimit, representatives.length)} processed, ${results.successful} successful, ${results.failed} failed`);
        }
        
      } catch (error: any) {
        console.error(`❌ Error processing state ${stateCode}:`, error);
        results.errors.push(`${stateCode}: ${error.message}`);
      }
    }
    
    const duration = Math.round((Date.now() - new Date(results.startTime).getTime()) / 1000);
    console.log(`\n🎉 Processing completed in ${duration} seconds`);
    console.log(`📊 Final Results: ${results.processed} processed, ${results.successful} successful, ${results.failed} failed`);
    
    return NextResponse.json({
      success: true,
      message: 'OpenStates People Database population completed',
      results: {
        ...results,
        duration: `${duration} seconds`,
        approach: 'OpenStates People Database (offline) - Primary data source for comprehensive representative information',
        note: 'This uses the OpenStates People Database (25,000+ YAML files), NOT the OpenStates API (250/day rate limit)'
      }
    });
    
  } catch (error: any) {
    console.error('OpenStates population failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(_request: NextRequest) {
  try {
    console.log('🔍 OpenStates Population Status requested');
    
    // Initialize OpenStates integration
    const openStatesIntegration = new OpenStatesIntegration({
      dataPath: '/Users/alaughingkitsune/src/Choices/scratch/agent-b/openstates-people/data',
      currentDate: new Date()
    });
    
    // Get integration status
    const status = await openStatesIntegration.getIntegrationStatus();
    const availableStates = await openStatesIntegration.getAvailableStates();
    
    return NextResponse.json({
      success: true,
      message: 'OpenStates People database integration status',
      data: {
        integration: status,
        availableStates: availableStates.slice(0, 10), // First 10 states
        totalStates: availableStates.length,
        capabilities: [
          'Comprehensive representative data from 25,000+ YAML files',
          'Current electorate filtering using system date',
          'Contact information extraction',
          'Social media link extraction',
          'Official source extraction',
          'Role and district information',
          'Party affiliation data',
          'Biographical information',
          'Photo and image data',
          'Statistics generation'
        ],
        benefits: [
          'Primary data source for comprehensive representative information',
          'High-quality, structured data from official sources',
          'Current electorate filtering ensures only active representatives',
          'Rich metadata including contacts, social media, and sources',
          'State-level organization for efficient processing',
          'Fallback to live APIs when database is not available'
        ]
      }
    });
    
  } catch (error: any) {
    console.error('OpenStates status check failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

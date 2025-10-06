import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { FreeAPIsPipeline } from '@/lib/civics-2-0/free-apis-pipeline';
import { createClient } from '@supabase/supabase-js';
import { requireServiceKey } from '@/lib/service-auth';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    // Log the request for debugging
    console.log('Maximized API ingestion requested from:', request.headers.get('user-agent'));
    
    // Require service key authentication
    const serviceCheck = await requireServiceKey();
    if (serviceCheck) return serviceCheck;
    
    // Parse the request body to get representatives to process
    const body = await request.json();
    const { representatives } = body;
    
    if (!representatives || !Array.isArray(representatives) || representatives.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No representatives provided in request body'
      });
    }
    
    const pipeline = new FreeAPIsPipeline();
    
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      apiStats: {
        openStates: { called: 0, successful: 0, rateLimited: false },
        congressGov: { called: 0, successful: 0, rateLimited: false },
        fec: { called: 0, successful: 0, rateLimited: false },
        googleCivic: { called: 0, successful: 0, rateLimited: false },
        legiscan: { called: 0, successful: 0, rateLimited: false }
      },
      dataCollected: {
        contacts: 0,
        socialMedia: 0,
        photos: 0,
        activity: 0,
        committees: 0,
        bills: 0,
        campaignFinance: 0
      },
      errors: [] as string[],
      startTime: new Date().toISOString(),
      debugInfo: [] as any[]
    };
    
    console.log('🚀 Starting MAXIMIZED API ingestion...');
    console.log('⏰ Start time:', results.startTime);
    console.log('🎯 Goal: Maximize data collection from all functional APIs');
    console.log(`📊 Processing ${representatives.length} representatives with MAXIMIZED API approach`);
    
    for (const rep of representatives) {
      try {
        console.log(`\n👤 Processing ${rep.name} (${rep.office}, ${rep.state})...`);
        
        // Process representative through pipeline with comprehensive data collection
        const enrichedRep = await pipeline.processRepresentative({
          name: rep.name,
          state: rep.state,
          office: rep.office,
          level: rep.level as 'federal' | 'state' | 'local',
          district: rep.district,
          bioguideId: rep.bioguide_id,
          openstatesId: rep.openstates_id,
          fecId: rep.fec_id,
          googleCivicId: rep.google_civic_id,
          contacts: [],
          socialMedia: [],
          photos: [],
          activity: [],
          dataSources: [],
          qualityScore: 0,
          lastUpdated: new Date()
        });
        
        if (enrichedRep) {
          // Debug: Log what the pipeline returned
          console.log(`🔍 Pipeline returned for ${rep.name}:`);
          console.log(`  - Contacts: ${enrichedRep.contacts?.length || 0}`);
          console.log(`  - Social Media: ${enrichedRep.socialMedia?.length || 0}`);
          console.log(`  - Photos: ${enrichedRep.photos?.length || 0}`);
          console.log(`  - Activity: ${enrichedRep.activity?.length || 0}`);
          console.log(`  - Data Sources: ${enrichedRep.dataSources?.join(', ') || 'none'}`);
          
          // Add debug info to results
          if (!results.debugInfo) {
            results.debugInfo = [];
          }
          results.debugInfo.push({
            representative: rep.name,
            contacts: enrichedRep.contacts?.length || 0,
            socialMedia: enrichedRep.socialMedia?.length || 0,
            photos: enrichedRep.photos?.length || 0,
            activity: enrichedRep.activity?.length || 0,
            dataSources: enrichedRep.dataSources || [],
            sampleContacts: enrichedRep.contacts?.slice(0, 2) || [],
            sampleSocialMedia: enrichedRep.socialMedia?.slice(0, 2) || [],
            samplePhotos: enrichedRep.photos?.slice(0, 2) || [],
            sampleActivity: enrichedRep.activity?.slice(0, 3) || [],
            activityDebug: {
              exists: !!enrichedRep.activity,
              length: enrichedRep.activity?.length || 0,
              type: typeof enrichedRep.activity,
              isArray: Array.isArray(enrichedRep.activity)
            }
          });
          
          // Track which APIs were used based on data sources
          if (enrichedRep.dataSources?.includes('openstates')) {
            results.apiStats.openStates.called++;
            results.apiStats.openStates.successful++;
          }
          if (enrichedRep.dataSources?.includes('congress-gov')) {
            results.apiStats.congressGov.called++;
            results.apiStats.congressGov.successful++;
          }
          if (enrichedRep.dataSources?.includes('fec')) {
            results.apiStats.fec.called++;
            results.apiStats.fec.successful++;
          }
          if (enrichedRep.dataSources?.includes('google-civic') || enrichedRep.dataSources?.includes('google-civic-elections')) {
            results.apiStats.googleCivic.called++;
            results.apiStats.googleCivic.successful++;
          }
          if (enrichedRep.dataSources?.includes('legiscan')) {
            results.apiStats.legiscan.called++;
            results.apiStats.legiscan.successful++;
          }
          
          // Extract primary contact information
          const primaryEmail = enrichedRep.contacts?.find((c: any) => c.type === 'email')?.value;
          const primaryPhone = enrichedRep.contacts?.find((c: any) => c.type === 'phone')?.value;
          const primaryWebsite = enrichedRep.contacts?.find((c: any) => c.type === 'website')?.value;
          const primaryPhoto = enrichedRep.photos?.[0]?.url;
          
          // 1. Create or update primary data in representatives_core
          const coreData = {
            name: rep.name,
            party: rep.party,
            office: rep.office,
            level: rep.level,
            state: rep.state,
            district: rep.district,
            bioguide_id: rep.bioguide_id || enrichedRep.bioguideId,
            openstates_id: rep.openstates_id || enrichedRep.openstatesId,
            fec_id: rep.fec_id || enrichedRep.fecId,
            google_civic_id: rep.google_civic_id || enrichedRep.googleCivicId,
            legiscan_id: enrichedRep.legiscanId,
            congress_gov_id: enrichedRep.congressGovId,
            govinfo_id: enrichedRep.govinfoId,
            wikipedia_url: enrichedRep.wikipediaUrl,
            ballotpedia_url: enrichedRep.ballotpediaUrl,
              primary_email: primaryEmail,
              primary_phone: primaryPhone,
              primary_website: primaryWebsite,
              primary_photo_url: primaryPhoto,
              twitter_handle: enrichedRep.twitterHandle,
              facebook_url: enrichedRep.facebookUrl,
              instagram_handle: enrichedRep.instagramHandle,
              linkedin_url: enrichedRep.linkedinUrl,
              youtube_channel: enrichedRep.youtubeChannel,
            data_quality_score: enrichedRep.qualityScore || 0,
            data_sources: enrichedRep.dataSources || [],
            last_verified: new Date().toISOString(),
            verification_status: 'verified',
            updated_at: new Date().toISOString()
          };

          // Try to insert first, if it fails due to duplicate, then update
          const { data: insertData, error: insertError } = await supabase
            .from('representatives_core')
            .insert(coreData)
            .select('id')
            .single();

          let repId;
          if (insertError && insertError.code === '23505') {
            // Duplicate key error, try to update instead
            const { data: updateData, error: updateError } = await supabase
              .from('representatives_core')
              .update(coreData)
              .eq('name', rep.name)
              .eq('state', rep.state)
              .eq('office', rep.office)
              .select('id')
              .single();
            
            if (updateError) {
              console.error(`❌ Core update error for ${rep.name}:`, updateError);
              results.errors.push(`Core update error for ${rep.name}: ${updateError.message}`);
              results.failed++;
              continue;
            }
            repId = updateData?.id;
          } else if (insertError) {
            console.error(`❌ Core insert error for ${rep.name}:`, insertError);
            results.errors.push(`Core insert error for ${rep.name}: ${insertError.message}`);
            results.failed++;
            continue;
          } else {
            repId = insertData?.id;
          }
          
          if (!repId) {
            console.error(`❌ No ID returned for ${rep.name}`);
            results.errors.push(`No ID returned for ${rep.name}`);
            results.failed++;
            continue;
          }
          
          console.log(`✅ Representative ID for ${rep.name}: ${repId}`);
          
          // Debug: Check what data we have in enrichedRep
          console.log(`🔍 EnrichedRep data for ${rep.name}:`);
          console.log(`  - Contacts: ${enrichedRep.contacts?.length || 0}`);
          console.log(`  - Social Media: ${enrichedRep.socialMedia?.length || 0}`);
          console.log(`  - Photos: ${enrichedRep.photos?.length || 0}`);
          console.log(`  - Activity: ${enrichedRep.activity?.length || 0}`);
          console.log(`  - Data Sources: ${enrichedRep.dataSources?.join(', ') || 'none'}`);
          
          // Debug: Check photos specifically
          if (enrichedRep.photos && enrichedRep.photos.length > 0) {
            console.log(`📸 Photos found in enrichedRep: ${enrichedRep.photos.length}`);
            enrichedRep.photos.forEach((photo, index) => {
              console.log(`  ${index + 1}. ${photo.url} (${photo.source})`);
            });
          } else {
            console.log(`📸 No photos found in enrichedRep`);
          }
          
          // Debug: Check activity specifically
          if (enrichedRep.activity && enrichedRep.activity.length > 0) {
            console.log(`📈 Activity found in enrichedRep: ${enrichedRep.activity.length}`);
            enrichedRep.activity.forEach((activity, index) => {
              console.log(`  ${index + 1}. ${activity.title} (${activity.type})`);
            });
          } else {
            console.log(`📈 No activity found in enrichedRep`);
          }
          
          // 2. Store detailed contacts
          if (enrichedRep.contacts && enrichedRep.contacts.length > 0) {
            console.log(`📞 Storing ${enrichedRep.contacts.length} contacts for ${rep.name}`);
            console.log(`📞 Contact data:`, JSON.stringify(enrichedRep.contacts, null, 2));
            
            const contactInserts = enrichedRep.contacts.map((contact: any) => ({
              representative_id: repId,
              type: contact.type,
              value: contact.value,
              label: contact.label || null,
              is_primary: contact.isPrimary || false,
              is_verified: contact.isVerified || false,
              source: contact.source || 'pipeline',
              last_verified: contact.isVerified ? new Date().toISOString() : null
            }));
            
            console.log(`📞 Using repId: ${repId} for contact inserts`);
            
            console.log(`📞 Contact inserts:`, JSON.stringify(contactInserts, null, 2));
            
            const { error: contactsError } = await supabase
              .from('representative_contacts')
              .insert(contactInserts);
            
            if (contactsError) {
              console.error(`❌ Contacts error for ${rep.name}:`, contactsError);
              results.errors.push(`Contacts error for ${rep.name}: ${contactsError.message}`);
            } else {
              results.dataCollected.contacts += contactInserts.length;
              console.log(`✅ Stored ${contactInserts.length} contacts for ${rep.name}`);
            }
          } else {
            console.log(`📞 No contacts found for ${rep.name}`);
          }
          
          // 3. Store detailed social media
          if (enrichedRep.socialMedia && enrichedRep.socialMedia.length > 0) {
            const socialInserts = enrichedRep.socialMedia.map((social: any) => ({
              representative_id: repId,
              platform: social.platform,
              handle: social.handle,
              url: social.url || null,
              followers_count: social.followersCount || 0,
              is_verified: social.isVerified || false,
              source: social.source || 'pipeline'
            }));
            
            const { error: socialError } = await supabase
              .from('representative_social_media')
              .insert(socialInserts);
            
            if (!socialError) {
              results.dataCollected.socialMedia += socialInserts.length;
            }
          }
          
          // 4. Store detailed photos (top 2 only)
          if (enrichedRep.photos && enrichedRep.photos.length > 0) {
            console.log(`📸 Storing ${enrichedRep.photos.length} photos for ${rep.name}`);
            console.log(`📸 Photo data:`, JSON.stringify(enrichedRep.photos, null, 2));
            
            const topPhotos = enrichedRep.photos.slice(0, 2);
            const photoInserts = topPhotos.map((photo: any, index: number) => ({
              representative_id: repId,
              url: photo.url,
              source: photo.source,
              ranking: index + 1,
              quality: photo.quality || 'medium',
              alt_text: photo.altText,
              caption: photo.caption,
              photographer: photo.photographer,
              usage_rights: photo.usageRights,
              width: photo.width,
              height: photo.height
            }));
            
            console.log(`📸 Photo inserts:`, JSON.stringify(photoInserts, null, 2));
            
            const { error: photosError } = await supabase
              .from('representative_photos')
              .insert(photoInserts);
            
            if (photosError) {
              console.error(`❌ Photos error for ${rep.name}:`, photosError);
              results.errors.push(`Photos error for ${rep.name}: ${photosError.message}`);
            } else {
              results.dataCollected.photos += photoInserts.length;
              console.log(`✅ Stored ${photoInserts.length} photos for ${rep.name}`);
            }
          } else {
            console.log(`📸 No photos found for ${rep.name}`);
          }
          
          // 5. Store detailed activity
          console.log(`🔍 DEBUG: About to check activity storage for ${rep.name}`);
          console.log(`🔍 DEBUG: enrichedRep.activity exists: ${!!enrichedRep.activity}`);
          console.log(`🔍 DEBUG: enrichedRep.activity length: ${enrichedRep.activity?.length || 0}`);
          console.log(`🔍 DEBUG: enrichedRep.activity content:`, JSON.stringify(enrichedRep.activity, null, 2));
          
          // Add debug info to results for activity storage
          if (!results.debugInfo) {
            results.debugInfo = [];
          }
          const currentDebugInfo = results.debugInfo.find(info => info.representative === rep.name);
          if (currentDebugInfo) {
            currentDebugInfo.activityStorageDebug = {
              exists: !!enrichedRep.activity,
              length: enrichedRep.activity?.length || 0,
              type: typeof enrichedRep.activity,
              isArray: Array.isArray(enrichedRep.activity),
              content: enrichedRep.activity?.slice(0, 2) || []
            };
          }
          
          if (enrichedRep.activity && enrichedRep.activity.length > 0) {
            console.log(`📈 Storing ${enrichedRep.activity.length} activity items for ${rep.name}`);
            console.log(`📈 Activity data:`, JSON.stringify(enrichedRep.activity, null, 2));
            
            const activityInserts = enrichedRep.activity.map((activity: any) => ({
              representative_id: repId,
              activity_type: activity.type || 'general',
              title: activity.title,
              description: activity.description,
              url: activity.url,
              date: activity.date instanceof Date ? activity.date.toISOString() : 
                    typeof activity.date === 'string' ? new Date(activity.date).toISOString() : 
                    new Date().toISOString(),
              metadata: activity.metadata,
              source: activity.source
            }));
            
            console.log(`📈 Activity inserts:`, JSON.stringify(activityInserts, null, 2));
            
            const { error: activityError } = await supabase
              .from('representative_activity')
              .insert(activityInserts);
            
            if (activityError) {
              console.error(`❌ Activity error for ${rep.name}:`, activityError);
              results.errors.push(`Activity error for ${rep.name}: ${activityError.message}`);
            } else {
              results.dataCollected.activity += activityInserts.length;
              console.log(`✅ Stored ${activityInserts.length} activity items for ${rep.name}`);
            }
          } else {
            console.log(`📈 No activity found for ${rep.name}`);
          }
          
          results.successful++;
          console.log(`✅ Successfully processed ${rep.name}`);
        } else {
          console.log(`⚠️ No enriched data for ${rep.name}`);
          results.failed++;
        }
        
        results.processed++;
        
      } catch (error) {
        console.error(`❌ Error processing ${rep.name}:`, error);
        results.errors.push(`Error processing ${rep.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        results.failed++;
      }
    }
    
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - new Date(results.startTime).getTime()) / 1000);
    
    console.log('\n🎉 MAXIMIZED API ingestion completed!');
    console.log(`📊 Results: ${results.successful} successful, ${results.failed} failed`);
    console.log(`⏱️ Duration: ${duration} seconds`);
    
    return NextResponse.json({
      success: true,
      message: 'MAXIMIZED API ingestion completed',
      results,
      duration: `${duration} seconds`,
      approach: 'Comprehensive - All functional APIs maximized for maximum data collection',
      benefits: [
        'Single Congress.gov call per representative (no over-collection)',
        'FEC data for federal representatives only',
        'OpenStates for state representatives when available',
        'Google Civic for election data',
        'LegiScan for legislation data',
        'Hybrid storage - primary data in main table, detailed data in separate tables',
        'Top 2 photos per person',
        'Comprehensive contact and social media data',
        'Activity and campaign finance tracking'
      ],
      apiEfficiency: {
        congressGov: `${results.apiStats.congressGov.successful}/${results.apiStats.congressGov.called} calls successful`,
        fec: `${results.apiStats.fec.successful}/${results.apiStats.fec.called} calls successful`,
        openStates: `${results.apiStats.openStates.successful}/${results.apiStats.openStates.called} calls successful`,
        googleCivic: `${results.apiStats.googleCivic.successful}/${results.apiStats.googleCivic.called} calls successful`,
        legiscan: `${results.apiStats.legiscan.successful}/${results.apiStats.legiscan.called} calls successful`
      }
    });
    
  } catch (error) {
    console.error('❌ MAXIMIZED API ingestion failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: 'MAXIMIZED API ingestion failed'
    }, { status: 500 });
  }
}

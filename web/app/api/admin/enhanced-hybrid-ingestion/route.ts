import { NextRequest, NextResponse } from 'next/server';
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
    // Require service key authentication
    const serviceCheck = await requireServiceKey();
    if (serviceCheck) return serviceCheck;
    
    const pipeline = new FreeAPIsPipeline();
    
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      detailedRecords: {
        contacts: 0,
        socialMedia: 0,
        photos: 0,
        activity: 0,
        committees: 0,
        bills: 0,
        speeches: 0,
        accountability: 0
      },
      errors: [] as string[],
      startTime: new Date().toISOString()
    };
    
    console.log('🚀 Starting enhanced hybrid ingestion...');
    console.log('⏰ Start time:', results.startTime);
    
    // Get a sample of representatives to process
    const { data: representatives, error: fetchError } = await supabase
      .from('representatives_core')
      .select('id, name, state, office, level, district, bioguide_id, openstates_id, fec_id, google_civic_id')
      .limit(5); // Process 5 representatives for testing
    
    if (fetchError) {
      throw new Error(`Failed to fetch representatives: ${fetchError.message}`);
    }
    
    if (!representatives || representatives.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No representatives found to process'
      });
    }
    
    console.log(`📊 Processing ${representatives.length} representatives with hybrid approach`);
    
    for (const rep of representatives) {
      try {
        console.log(`\n👤 Processing ${rep.name} (${rep.office}, ${rep.state})...`);
        
        // Process representative through pipeline
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
          campaignFinance: undefined,
          dataSources: [],
          qualityScore: 0,
          lastUpdated: new Date()
        });
        
        if (enrichedRep) {
          // Extract primary contact information
          const primaryEmail = enrichedRep.contacts?.find((c: any) => c.type === 'email' && c.isVerified)?.value;
          const primaryPhone = enrichedRep.contacts?.find((c: any) => c.type === 'phone' && c.isVerified)?.value;
          const primaryWebsite = enrichedRep.contacts?.find((c: any) => c.type === 'website' && c.isVerified)?.value;
          const primaryPhoto = enrichedRep.photos?.[0]?.url;
          
          // 1. Update primary data in representatives_core
          const { error: coreError } = await supabase
            .from('representatives_core')
            .update({
              primary_email: primaryEmail,
              primary_phone: primaryPhone,
              primary_website: primaryWebsite,
              primary_photo_url: primaryPhoto,
              data_quality_score: enrichedRep.qualityScore || 0,
              data_sources: enrichedRep.dataSources || [],
              last_verified: new Date().toISOString(),
              verification_status: 'verified'
            })
            .eq('id', rep.id);
          
          if (coreError) {
            console.error(`❌ Core update error for ${rep.name}:`, coreError);
            results.failed++;
            results.errors.push(`Core update error for ${rep.name}: ${coreError.message}`);
            continue;
          }
          
          // 2. Store detailed contacts
          if (enrichedRep.contacts && enrichedRep.contacts.length > 0) {
            const contactInserts = enrichedRep.contacts.map((contact: any) => ({
              representative_id: rep.id,
              type: contact.type,
              value: contact.value,
              label: contact.label || null,
              is_primary: contact.isPrimary || false,
              is_verified: contact.isVerified || false,
              source: contact.source || 'pipeline',
              last_verified: contact.isVerified ? new Date().toISOString() : null
            }));
            
            const { error: contactsError } = await supabase
              .from('representative_contacts')
              .upsert(contactInserts, { onConflict: 'representative_id,type,value' });
            
            if (contactsError) {
              console.error(`❌ Contacts error for ${rep.name}:`, contactsError);
            } else {
              results.detailedRecords.contacts += contactInserts.length;
              console.log(`✅ Stored ${contactInserts.length} contacts for ${rep.name}`);
            }
          }
          
          // 3. Store detailed social media
          if (enrichedRep.socialMedia && enrichedRep.socialMedia.length > 0) {
            const socialInserts = enrichedRep.socialMedia.map((social: any) => ({
              representative_id: rep.id,
              platform: social.platform,
              handle: social.handle,
              url: social.url || null,
              followers_count: social.followersCount || 0,
              is_verified: social.isVerified || false,
              source: social.source || 'pipeline'
            }));
            
            const { error: socialError } = await supabase
              .from('representative_social_media')
              .upsert(socialInserts, { onConflict: 'representative_id,platform,handle' });
            
            if (socialError) {
              console.error(`❌ Social media error for ${rep.name}:`, socialError);
            } else {
              results.detailedRecords.socialMedia += socialInserts.length;
              console.log(`✅ Stored ${socialInserts.length} social media for ${rep.name}`);
            }
          }
          
          // 4. Store detailed photos (limit to top 2 per person)
          if (enrichedRep.photos && enrichedRep.photos.length > 0) {
            const topPhotos = enrichedRep.photos.slice(0, 2); // Ensure max 2 photos
            const photoInserts = topPhotos.map((photo: any, index: number) => ({
              representative_id: rep.id,
              url: photo.url,
              source: photo.source || 'pipeline',
              quality: photo.quality || 'medium',
              is_primary: index === 0, // First photo is primary
              width: photo.width || null,
              height: photo.height || null,
              alt_text: null // PhotoInfo doesn't have altText field
            }));
            
            const { error: photosError } = await supabase
              .from('representative_photos')
              .upsert(photoInserts, { onConflict: 'representative_id' });
            
            if (photosError) {
              console.error(`❌ Photos error for ${rep.name}:`, photosError);
            } else {
              results.detailedRecords.photos += photoInserts.length;
              console.log(`✅ Stored ${photoInserts.length} photos (max 2) for ${rep.name}`);
            }
          }
          
          // 5. Store activity data
          if (enrichedRep.activity && enrichedRep.activity.length > 0) {
            const activityInserts = enrichedRep.activity.map((activity: any) => ({
              representative_id: rep.id,
              type: activity.type,
              title: activity.title,
              description: activity.description || null,
              date: activity.date,
              source: activity.source || 'pipeline',
              url: activity.url || null,
              metadata: activity.metadata || null
            }));
            
            const { error: activityError } = await supabase
              .from('representative_activity')
              .upsert(activityInserts, { onConflict: 'representative_id,type,title,date' });
            
            if (activityError) {
              console.error(`❌ Activity error for ${rep.name}:`, activityError);
            } else {
              results.detailedRecords.activity += activityInserts.length;
              console.log(`✅ Stored ${activityInserts.length} activity records for ${rep.name}`);
            }
          }
          
          console.log(`✅ Successfully processed ${rep.name} with hybrid approach`);
          results.successful++;
        }
        
        results.processed++;
        
        // Small delay between representatives
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (repError) {
        console.error(`❌ Error processing ${rep.name}:`, repError);
        results.failed++;
        results.errors.push(`Error processing ${rep.name}: ${repError}`);
      }
    }
    
    // Calculate completion time
    const endTime = new Date();
    const startTime = new Date(results.startTime);
    const duration = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.round(duration / 60000);
    
    console.log(`\n🚀 Enhanced hybrid ingestion completed!`);
    console.log(`⏰ Duration: ${durationMinutes} minutes`);
    console.log(`📊 Results: ${results.successful}/${results.processed} successful`);
    console.log(`📋 Detailed records stored:`, results.detailedRecords);
    
    return NextResponse.json({
      success: true,
      message: 'Enhanced hybrid ingestion completed',
      results,
      duration: `${durationMinutes} minutes`,
      approach: 'Hybrid - Primary data in main table, detailed data in separate tables',
      benefits: [
        'Fast queries on primary data',
        'Rich detailed information available',
        'Normalized data structure',
        'Future-proof schema'
      ]
    });
    
  } catch (error) {
    console.error('Enhanced hybrid ingestion failed:', error);
    return NextResponse.json({
      success: false,
      error: `Enhanced hybrid ingestion failed: ${error}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

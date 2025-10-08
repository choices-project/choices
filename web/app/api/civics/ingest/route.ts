/**
 * Simple Civics Data Ingestion API
 * Clean, reliable data ingestion with enhanced Google Civic integration
 * 
 * Created: October 6, 2025
 * Updated: October 6, 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Rate limiting configuration
const RATE_LIMITS = {
  'congress-gov': { requestsPerDay: 5000, requestsPerHour: 200, requestsPerMinute: 10 },
  'openstates': { requestsPerDay: 250, requestsPerHour: 10, requestsPerMinute: 1 },
  'wikipedia': { requestsPerDay: 10000, requestsPerHour: 500, requestsPerMinute: 20 },
  'google-civic': { requestsPerDay: 25000, requestsPerHour: 1000, requestsPerMinute: 50 }
};

const rateLimitCounters = new Map<string, { count: number; lastReset: number }>();

function checkRateLimit(apiName: string): boolean {
  const limit = RATE_LIMITS[apiName as keyof typeof RATE_LIMITS];
  if (!limit) return true;

  const now = Date.now();
  const counter = rateLimitCounters.get(apiName) || { count: 0, lastReset: now };

  // Reset counter if it's been more than an hour
  if (now - counter.lastReset > 3600000) {
    counter.count = 0;
    counter.lastReset = now;
  }

  if (counter.count >= limit.requestsPerMinute) {
    console.log(`⚠️ Rate limit reached for ${apiName}: ${counter.count}/${limit.requestsPerMinute} per minute`);
    return false;
  }

  counter.count++;
  rateLimitCounters.set(apiName, counter);
  return true;
}

export async function POST(request: NextRequest) {
  const startTime = new Date().toISOString();
  
  try {
    const body = await request.json();
    const { representatives } = body;

    if (!representatives || !Array.isArray(representatives) || representatives.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No representatives provided"
      }, { status: 400 });
    }

    console.log(`🚀 Processing ${representatives.length} representatives with enhanced Google Civic integration`);

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
      startTime,
      duration: '',
      approach: 'Simple - Direct API calls to JSONB storage with enhanced Google Civic'
    };

    for (const rep of representatives) {
      try {
        console.log(`🔄 Processing ${rep.name}...`);

        // Call Congress.gov API (for federal legislators)
        let congressData = null;
        if (rep.bioguide_id && checkRateLimit('congress-gov')) {
          try {
            const response = await fetch(
              `https://api.congress.gov/v3/member/${rep.bioguide_id}?format=json&api_key=${process.env.CONGRESS_GOV_API_KEY}`,
              { headers: { 'User-Agent': 'Choices-Civics-Platform/1.0' } }
            );
            if (response.ok) {
              congressData = await response.json();
              console.log(`✅ Congress.gov API success for ${rep.name}`);
            }
          } catch (error) {
            console.log(`⚠️ Congress.gov API error for ${rep.name}:`, error);
          }
        } else if (rep.bioguide_id) {
          console.log(`⚠️ Rate limit reached for Congress.gov API, skipping ${rep.name}`);
        }

        // Call Wikipedia API
        let wikipediaData = null;
        if (checkRateLimit('wikipedia')) {
          try {
            const response = await fetch(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(rep.name)}`,
              { headers: { 'User-Agent': 'Choices-Civics-Platform/1.0' } }
            );
            if (response.ok) {
              wikipediaData = await response.json();
              console.log(`✅ Wikipedia API success for ${rep.name}`);
            }
          } catch (error) {
            console.log(`⚠️ Wikipedia API error for ${rep.name}:`, error);
          }
        } else {
          console.log(`⚠️ Rate limit reached for Wikipedia API, skipping ${rep.name}`);
        }

        // Call OpenStates API v3 (for state legislators) - VERY LIMITED: 250/day!
        let openStatesData = null;
        if (rep.level === 'state' && rep.openstates_id && checkRateLimit('openstates')) {
          try {
            const response = await fetch(
              `https://v3.openstates.org/people/${rep.openstates_id}`,
              { headers: { 'Content-Type': 'application/json' } }
            );
            if (response.ok) {
              openStatesData = await response.json();
              console.log(`✅ OpenStates API v3 success for ${rep.name}`);
            }
          } catch (error) {
            console.log(`⚠️ OpenStates API v3 error for ${rep.name}:`, error);
          }
        } else if (rep.level === 'state' && rep.openstates_id) {
          console.log(`⚠️ Rate limit reached for OpenStates API v3 (250/day limit!), skipping ${rep.name}`);
        }

        // Call Google Civic API (for elections, events, and civic engagement)
        let googleCivicData = null;
        let googleCivicElections = null;
        let googleCivicVoterInfo = null;
        
        if (checkRateLimit('google-civic')) {
          try {
            // Get representatives by state
            const address = `${rep.state}, USA`;
            const representativesResponse = await fetch(
              `https://www.googleapis.com/civicinfo/v2/representatives?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_CIVIC_API_KEY}`,
              { headers: { 'Content-Type': 'application/json' } }
            );
            if (representativesResponse.ok) {
              googleCivicData = await representativesResponse.json();
            }
            
            // Get election information
            const electionsResponse = await fetch(
              `https://www.googleapis.com/civicinfo/v2/elections?key=${process.env.GOOGLE_CIVIC_API_KEY}`,
              { headers: { 'Content-Type': 'application/json' } }
            );
            if (electionsResponse.ok) {
              googleCivicElections = await electionsResponse.json();
            }
            
            // Get voter information for the state
            const voterInfoResponse = await fetch(
              `https://www.googleapis.com/civicinfo/v2/voterinfo?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_CIVIC_API_KEY}`,
              { headers: { 'Content-Type': 'application/json' } }
            );
            if (voterInfoResponse.ok) {
              googleCivicVoterInfo = await voterInfoResponse.json();
            }
            
            console.log(`✅ Google Civic API success for ${rep.name} (representatives, elections, voter info)`);
          } catch (error) {
            console.log(`⚠️ Google Civic API error for ${rep.name}:`, error);
          }
        } else {
          console.log(`⚠️ Rate limit reached for Google Civic API, skipping ${rep.name}`);
        }

        // Extract contacts from multiple sources
        const contacts = [];
        
        // Congress.gov contacts (federal)
        if (congressData?.member?.officialWebsiteUrl) {
          contacts.push({
            type: 'website',
            value: congressData.member.officialWebsiteUrl,
            source: 'congress-gov',
            isPrimary: true,
            isVerified: true
          });
        }
        if (congressData?.member?.addressInformation?.officeAddress) {
          contacts.push({
            type: 'address',
            value: congressData.member.addressInformation.officeAddress,
            source: 'congress-gov',
            isPrimary: false,
            isVerified: true
          });
        }
        if (congressData?.member?.addressInformation?.phoneNumber) {
          contacts.push({
            type: 'phone',
            value: congressData.member.addressInformation.phoneNumber,
            source: 'congress-gov',
            isPrimary: false,
            isVerified: true
          });
        }
        
        // OpenStates contacts (state)
        if (openStatesData?.url) {
          contacts.push({
            type: 'website',
            value: openStatesData.url,
            source: 'openstates',
            isPrimary: true,
            isVerified: true
          });
        }
        if (openStatesData?.email) {
          contacts.push({
            type: 'email',
            value: openStatesData.email,
            source: 'openstates',
            isPrimary: true,
            isVerified: true
          });
        }
        
        // Google Civic contacts (additional)
        if (googleCivicData?.officials) {
          googleCivicData.officials.forEach((official: any) => {
            // Match official to representative
            if (official.name && official.name.toLowerCase().includes(rep.name.toLowerCase().split(' ')[0])) {
              // Official URLs
              if (official.urls) {
                official.urls.forEach((url: any) => {
                  contacts.push({
                    type: 'website',
                    value: url,
                    source: 'google-civic',
                    isPrimary: false,
                    isVerified: true
                  });
                });
              }
              
              // Official channels (social media)
              if (official.channels) {
                official.channels.forEach((channel: any) => {
                  const platform = channel.type?.toLowerCase();
                  if (platform === 'facebook' || platform === 'twitter' || platform === 'youtube') {
                    contacts.push({
                      type: 'social_media',
                      value: channel.id,
                      platform: platform,
                      source: 'google-civic',
                      isPrimary: false,
                      isVerified: true
                    });
                  }
                });
              }
              
              // Official address
              if (official.address) {
                contacts.push({
                  type: 'address',
                  value: `${official.address[0]?.line1 || ''} ${official.address[0]?.city || ''}, ${official.address[0]?.state || ''} ${official.address[0]?.zip || ''}`.trim(),
                  source: 'google-civic',
                  isPrimary: false,
                  isVerified: true
                });
              }
              
              // Official phone
              if (official.phones) {
                official.phones.forEach((phone: any) => {
                  contacts.push({
                    type: 'phone',
                    value: phone,
                    source: 'google-civic',
                    isPrimary: false,
                    isVerified: true
                  });
                });
              }
            }
          });
        }
        
        // Extract photos from Wikipedia
        const photos = [];
        if (wikipediaData?.thumbnail?.source) {
          photos.push({
            url: wikipediaData.thumbnail.source,
            source: 'wikipedia',
            width: wikipediaData.thumbnail.width,
            height: wikipediaData.thumbnail.height,
            altText: `Wikipedia photo of ${wikipediaData.title}`,
            attribution: 'Wikipedia'
          });
        }
        
        // Extract activity from multiple sources
        const activity = [];
        
        // Wikipedia biographical activity
        if (wikipediaData?.extract) {
          activity.push({
            type: 'biography',
            title: `Wikipedia: ${wikipediaData.title}`,
            description: wikipediaData.extract,
            url: wikipediaData.content_urls?.desktop?.page,
            date: new Date().toISOString(),
            source: 'wikipedia'
          });
        }
        
        // Congress.gov legislative activity
        if (congressData?.sponsoredLegislation?.bills) {
          congressData.sponsoredLegislation.bills.slice(0, 3).forEach((bill: any) => {
            activity.push({
              type: 'bill_sponsored',
              title: `Sponsored: ${bill.title}`,
              description: bill.summary,
              url: bill.url,
              date: bill.introducedDate,
              source: 'congress-gov'
            });
          });
        }
        
        // Google Civic elections activity
        if (googleCivicElections?.elections) {
          googleCivicElections.elections.slice(0, 3).forEach((election: any) => {
            activity.push({
              type: 'election',
              title: `Election: ${election.name}`,
              description: `Election on ${election.electionDay}`,
              date: election.electionDay,
              source: 'google-civic'
            });
          });
        }
        
        // Google Civic voter information activity
        if (googleCivicVoterInfo?.election) {
          activity.push({
            type: 'voter_info',
            title: `Voter Information: ${googleCivicVoterInfo.election.name}`,
            description: `Election on ${googleCivicVoterInfo.election.electionDay}`,
            date: googleCivicVoterInfo.election.electionDay,
            source: 'google-civic'
          });
        }
        
        // Google Civic polling locations
        if (googleCivicVoterInfo?.pollingLocations) {
          googleCivicVoterInfo.pollingLocations.slice(0, 2).forEach((location: any, index: number) => {
            activity.push({
              type: 'polling_location',
              title: `Polling Location ${index + 1}`,
              description: `Vote at ${location.address?.locationName || 'Polling Location'}`,
              date: googleCivicVoterInfo.election?.electionDay,
              source: 'google-civic'
            });
          });
        }
        
        // Google Civic contests (ballot measures, candidates)
        if (googleCivicVoterInfo?.contests) {
          googleCivicVoterInfo.contests.slice(0, 3).forEach((contest: any) => {
            activity.push({
              type: 'ballot_contest',
              title: `Ballot: ${contest.office || contest.referendumTitle}`,
              description: contest.referendumSubtitle || contest.office,
              date: googleCivicVoterInfo.election?.electionDay,
              source: 'google-civic'
            });
          });
        }
        
        // Google Civic officials activity
        if (googleCivicData?.officials) {
          googleCivicData.officials.forEach((official: any) => {
            if (official.name && official.name.toLowerCase().includes(rep.name.toLowerCase().split(' ')[0])) {
              activity.push({
                type: 'official_activity',
                title: `Official: ${official.name}`,
                description: `Official representative activity`,
                date: new Date().toISOString(),
                source: 'google-civic'
              });
            }
          });
        }
        
        console.log(`📊 Extracted data:`, {
          contacts: contacts.length,
          photos: photos.length,
          activity: activity.length
        });

        // Calculate data quality score
        let score = 0;
        const sources = [];
        
        if (congressData) {
          score += 30;
          sources.push('congress-gov');
        }
        if (wikipediaData) {
          score += 25;
          sources.push('wikipedia');
        }
        if (openStatesData) {
          score += 20;
          sources.push('openstates');
        }
        if (googleCivicData) {
          score += 15;
          sources.push('google-civic');
        }
        if (contacts.length > 0) score += 10;
        if (photos.length > 0) score += 5;
        
        // Store in database
        const coreData = {
          name: rep.name,
          office: rep.office,
          level: rep.level,
          state: rep.state,
          party: rep.party,
          bioguide_id: rep.bioguide_id,
          fec_id: rep.fec_id,
          openstates_id: rep.openstates_id,
          google_civic_id: rep.google_civic_id,
          term_start_date: rep.term_start_date,
          term_end_date: rep.term_end_date,
          next_election_date: rep.next_election_date,
          last_updated: new Date().toISOString(),
          enhanced_contacts: contacts,
          enhanced_photos: photos,
          enhanced_activity: activity,
          enhanced_social_media: [],
          data_quality_score: score,
          data_sources: sources,
          verification_status: score >= 50 ? 'verified' : 'unverified'
        };
        
        // Check if representative exists
        const { data: existing } = await supabase
          .from('representatives_core')
          .select('id')
          .eq('bioguide_id', rep.bioguide_id)
          .maybeSingle();
        
        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('representatives_core')
            .update(coreData)
            .eq('id', existing.id);
          
          if (error) throw error;
          console.log(`✅ Updated ${rep.name} in database`);
        } else {
          // Insert new
          const { error } = await supabase
            .from('representatives_core')
            .insert(coreData);
          
          if (error) throw error;
          console.log(`✅ Inserted ${rep.name} into database`);
        }
        
        results.successful++;
        
      } catch (error: any) {
        console.error(`❌ Error processing ${rep.name}:`, error);
        results.failed++;
        results.errors.push(`${rep.name}: ${error.message}`);
      }
      
      results.processed++;
    }

    const duration = Math.round((Date.now() - new Date(results.startTime).getTime()) / 1000);

    return NextResponse.json({
      success: true,
      message: 'Civics ingest completed',
      results: {
        ...results,
        duration: `${duration} seconds`,
        approach: 'Simple - Direct API calls to JSONB storage with enhanced Google Civic'
      }
    });

  } catch (error: any) {
    console.error('Civics ingest failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  const status = {
    rateLimits: {} as Record<string, any>
  };

  for (const [apiName, limit] of Object.entries(RATE_LIMITS)) {
    const counter = rateLimitCounters.get(apiName) || { count: 0, lastReset: Date.now() };
    const now = Date.now();
    const timeSinceReset = now - counter.lastReset;

    status.rateLimits[apiName] = {
      limit: limit,
      current: counter.count,
      remaining: Math.max(0, limit.requestsPerMinute - counter.count),
      resetIn: Math.max(0, 3600000 - timeSinceReset), // Reset in 1 hour
      isLimited: counter.count >= limit.requestsPerMinute
    };
  }

  return NextResponse.json({
    success: true,
    message: 'Rate limit status',
    data: status
  });
}
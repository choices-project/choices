// web/scripts/civics-contact-collection.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

// API Configuration
const PROPUBLICA_API_KEY = process.env.PROPUBLICA_API_KEY;
const GOOGLE_CIVIC_API_KEY = process.env.GOOGLE_CIVIC_INFO_API_KEY || process.env.GOOGLE_CIVIC_API_KEY;

if (!PROPUBLICA_API_KEY) {
  throw new Error('PROPUBLICA_API_KEY environment variable is required');
}

// Rate limiting
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
let lastRequestTime = 0;

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function rateLimitedFetch(url: string, headers: Record<string, string> = {}) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await delay(RATE_LIMIT_DELAY - timeSinceLastRequest);
  }
  
  lastRequestTime = Date.now();
  
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// ProPublica Congress API Functions
async function getProPublicaMember(memberId: string) {
  const url = `https://api.propublica.org/congress/v1/members/${memberId}.json`;
  const headers = { 'X-API-Key': PROPUBLICA_API_KEY ?? '' };
  
  console.log(`📞 Getting ProPublica data for member: ${memberId}`);
  return rateLimitedFetch(url, headers);
}

async function searchProPublicaMembers(name: string, state?: string) {
  const url = new URL('https://api.propublica.org/congress/v1/members/search.json');
  url.searchParams.set('query', name);
  
  const headers = { 'X-API-Key': PROPUBLICA_API_KEY ?? '' };
  
  console.log(`🔍 Searching ProPublica for: ${name}${state ? ` (${state})` : ''}`);
  return rateLimitedFetch(url.toString(), headers);
}

// Google Civic API Functions
async function getGoogleCivicRepresentatives(address: string) {
  if (!GOOGLE_CIVIC_API_KEY) {
    console.log('⚠️ Google Civic API key not available, skipping Google Civic data');
    return null;
  }
  
  const url = new URL('https://www.googleapis.com/civicinfo/v2/representatives');
  url.searchParams.set('address', address);
  url.searchParams.set('key', GOOGLE_CIVIC_API_KEY);
  
  console.log(`🏛️ Getting Google Civic data for address: ${address}`);
  return rateLimitedFetch(url.toString());
}

// Social Media Detection Functions
function extractSocialMediaFromUrls(urls: string[]): Record<string, string> {
  const socialMedia: Record<string, string> = {};
  
  urls.forEach(url => {
    if (!url) return;
    
    const lowerUrl = url.toLowerCase();
    
    // Twitter/X
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
      const match = url.match(/(?:twitter\.com|x\.com)\/([^\/\?]+)/);
      if (match && match[1]) {
        socialMedia.twitter = match[1].startsWith('@') ? match[1] : `@${match[1]}`;
        socialMedia.twitter_url = url;
      }
    }
    
    // Facebook
    if (lowerUrl.includes('facebook.com')) {
      const match = url.match(/facebook\.com\/([^\/\?]+)/);
      if (match) {
        socialMedia.facebook = match[1] ?? '';
        socialMedia.facebook_url = url;
      }
    }
    
    // Instagram
    if (lowerUrl.includes('instagram.com')) {
      const match = url.match(/instagram\.com\/([^\/\?]+)/);
      if (match && match[1]) {
        socialMedia.instagram = match[1].startsWith('@') ? match[1] : `@${match[1]}`;
        socialMedia.instagram_url = url;
      }
    }
    
    // YouTube
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      const match = url.match(/(?:youtube\.com\/(?:c\/|channel\/|user\/)|youtu\.be\/)([^\/\?]+)/);
      if (match) {
        socialMedia.youtube = match[1] ?? '';
        socialMedia.youtube_url = url;
      }
    }
    
    // LinkedIn
    if (lowerUrl.includes('linkedin.com')) {
      const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
      if (match) {
        socialMedia.linkedin = match[1] ?? '';
        socialMedia.linkedin_url = url;
      }
    }
    
    // TikTok
    if (lowerUrl.includes('tiktok.com')) {
      const match = url.match(/tiktok\.com\/@([^\/\?]+)/);
      if (match) {
        socialMedia.tiktok = `@${match[1]}`;
        socialMedia.tiktok_url = url;
      }
    }
  });
  
  return socialMedia;
}

// Contact Information Processing
function processContactInfo(proPublicaData: any, googleCivicData: any = null) {
  const contactInfo: any = {
    official_email: null,
    official_phone: null,
    official_fax: null,
    official_website: null,
    office_addresses: [],
    social_media: {},
    preferred_contact_method: 'email',
    response_time_expectation: 'within_week',
    data_source: 'propublica_api',
    data_quality_score: 85,
    verification_notes: 'Data collected from ProPublica Congress API'
  };
  
  // Process ProPublica data
  if (proPublicaData?.results?.[0]) {
    const member = proPublicaData.results[0];
    
    // Basic contact info
    contactInfo.official_email = member.email || null;
    contactInfo.official_phone = member.phone || null;
    contactInfo.official_fax = member.fax || null;
    contactInfo.official_website = member.url || null;
    
    // Office addresses
    if (member.roles?.[0]) {
      const currentRole = member.roles[0];
      if (currentRole.office) {
        contactInfo.office_addresses.push({
          type: 'primary',
          office: currentRole.office,
          address: currentRole.office_address || null,
          city: currentRole.office_city || null,
          state: currentRole.office_state || null,
          zip: currentRole.office_zip || null,
          phone: currentRole.phone || null,
          fax: currentRole.fax || null
        });
      }
    }
    
    // Social media from URLs
    const urls = [member.url, member.rss_url].filter(Boolean);
    contactInfo.social_media = extractSocialMediaFromUrls(urls);
    
    // Update data quality based on available information
    let qualityScore = 60;
    if (contactInfo.official_email) qualityScore += 15;
    if (contactInfo.official_phone) qualityScore += 10;
    if (contactInfo.official_website) qualityScore += 10;
    if (Object.keys(contactInfo.social_media).length > 0) qualityScore += 5;
    
    contactInfo.data_quality_score = Math.min(qualityScore, 100);
  }
  
  // Process Google Civic data if available
  if (googleCivicData?.officials) {
    const officials = googleCivicData.officials;
    
    // Find matching official and enhance contact info
    officials.forEach((official: any) => {
      if (official.emails?.[0] && !contactInfo.official_email) {
        contactInfo.official_email = official.emails[0];
      }
      
      if (official.phones?.[0] && !contactInfo.official_phone) {
        contactInfo.official_phone = official.phones[0];
      }
      
      if (official.urls?.[0] && !contactInfo.official_website) {
        contactInfo.official_website = official.urls[0];
      }
      
      // Extract additional social media
      const additionalSocial = extractSocialMediaFromUrls(official.urls || []);
      contactInfo.social_media = { ...contactInfo.social_media, ...additionalSocial };
    });
    
    // Update data source and quality
    contactInfo.data_source = 'propublica_api,google_civic_api';
    contactInfo.data_quality_score = Math.min(contactInfo.data_quality_score + 10, 100);
    contactInfo.verification_notes = 'Data collected from ProPublica Congress API and Google Civic Information API';
  }
  
  return contactInfo;
}

// Main Collection Function
async function collectContactInformation() {
  console.log('📞 Starting contact information collection...');
  
  try {
    // Get all federal representatives without contact info
    const { data: representatives, error } = await supabase
      .from('civics_representatives')
      .select('*')
      .eq('level', 'federal')
      .eq('contact_info_available', false)
      .limit(50); // Process in batches
    
    if (error) {
      throw error;
    }

    if (!representatives || representatives.length === 0) {
      console.log('✅ No federal representatives need contact information collection');
      return;
    }

    console.log(`📊 Found ${representatives.length} federal representatives to process`);

    let successCount = 0;
    let errorCount = 0;

    for (const rep of representatives) {
      try {
        console.log(`\n📞 Processing: ${rep.name} (${rep.office})`);
        
        // Search ProPublica for the representative
        const searchResults = await searchProPublicaMembers(rep.name);
        
        if (!searchResults?.results || searchResults.results.length === 0) {
          console.log(`❌ No ProPublica results found for ${rep.name}`);
          errorCount++;
          continue;
        }

        // Find best match (simple name matching for now)
        let bestMatch = null;
        for (const member of searchResults.results) {
          if (member.first_name && member.last_name) {
            const fullName = `${member.first_name} ${member.last_name}`;
            if (fullName.toLowerCase().includes(rep.name.toLowerCase()) || 
                rep.name.toLowerCase().includes(fullName.toLowerCase())) {
              bestMatch = member;
              break;
            }
          }
        }

        if (!bestMatch) {
          console.log(`❌ No good ProPublica match found for ${rep.name}`);
          errorCount++;
          continue;
        }

        console.log(`✅ Found ProPublica match: ${bestMatch.first_name} ${bestMatch.last_name} (${bestMatch.id})`);

        // Get detailed member information
        const memberDetails = await getProPublicaMember(bestMatch.id);
        
        // Try to get Google Civic data (optional)
        let googleCivicData = null;
        if (rep.jurisdiction && rep.jurisdiction !== 'US') {
          // Use a sample address in the representative's state
          const sampleAddress = `Washington, DC`; // Most federal reps have DC offices
          try {
            googleCivicData = await getGoogleCivicRepresentatives(sampleAddress);
          } catch (error) {
            console.log(`⚠️ Google Civic data not available for ${rep.name}`);
          }
        }

        // Process contact information
        const contactInfo = processContactInfo(memberDetails, googleCivicData);
        
        // Insert contact information
        const { error: contactError } = await supabase
          .from('civics_contact_info')
          .upsert({
            representative_id: rep.id,
            ...contactInfo
          }, {
            onConflict: 'representative_id'
          });

        if (contactError) {
          console.error(`❌ Error inserting contact info for ${rep.name}:`, contactError);
          errorCount++;
          continue;
        }

        // Insert social media engagement data
        if (Object.keys(contactInfo.social_media).length > 0) {
          const socialMediaEntries = Object.entries(contactInfo.social_media)
            .filter(([key, value]) => key.endsWith('_url') && value)
            .map(([key, value]) => {
              const platform = key.replace('_url', '');
              const handle = contactInfo.social_media[platform];
              
              return {
                representative_id: rep.id,
                platform: platform,
                handle: handle,
                url: value,
                data_source: 'api_collection',
                last_updated: new Date().toISOString()
              };
            });

          if (socialMediaEntries.length > 0) {
            const { error: socialError } = await supabase
              .from('civics_social_engagement')
              .upsert(socialMediaEntries, {
                onConflict: 'representative_id,platform'
              });

            if (socialError) {
              console.error(`⚠️ Error inserting social media for ${rep.name}:`, socialError);
            }
          }
        }

        console.log(`✅ Successfully collected contact info for ${rep.name}`);
        console.log(`   📧 Email: ${contactInfo.official_email || 'Not available'}`);
        console.log(`   📞 Phone: ${contactInfo.official_phone || 'Not available'}`);
        console.log(`   🌐 Website: ${contactInfo.official_website || 'Not available'}`);
        console.log(`   📱 Social Media: ${Object.keys(contactInfo.social_media).length} platforms`);
        console.log(`   📊 Quality Score: ${contactInfo.data_quality_score}/100`);
        
        successCount++;

      } catch (error) {
        console.error(`❌ Error processing ${rep.name}:`, error);
        errorCount++;
      }

      // Rate limiting delay
      await delay(RATE_LIMIT_DELAY);
    }

    console.log(`\n🎉 Contact information collection complete!`);
    console.log(`✅ Successfully processed: ${successCount} representatives`);
    console.log(`❌ Errors: ${errorCount} representatives`);

  } catch (error) {
    console.error('❌ Contact information collection failed:', error);
  }
}

// Run the collection
collectContactInformation().catch(console.error);

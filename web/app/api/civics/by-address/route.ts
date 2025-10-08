import { type NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    console.log('🔍 Looking up representatives for address:', address);

    // Use Google Civic API to get representatives by address
    const googleCivicResponse = await fetch(
      `https://www.googleapis.com/civicinfo/v2/representatives?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_CIVIC_API_KEY}`
    );

    if (!googleCivicResponse.ok) {
      throw new Error('Google Civic API failed');
    }

    const googleCivicData = await googleCivicResponse.json();
    console.log('📊 Google Civic API response:', googleCivicData);

    // Extract representatives from Google Civic response
    const representatives = [];
    
    if (googleCivicData.officials && googleCivicData.offices) {
      for (const office of googleCivicData.offices) {
        for (const officialIndex of office.officialIndices) {
          const official = googleCivicData.officials[officialIndex];
          
          // Create representative object
          const representative = {
            id: `google-civic-${officialIndex}`,
            name: official.name,
            office: office.name,
            party: official.party || 'Unknown',
            state: extractStateFromAddress(address),
            level: determineLevel(office.name),
            photos: official.photoUrl ? [{
              url: official.photoUrl,
              source: 'google-civic',
              width: 200,
              height: 200,
              altText: `Photo of ${official.name}`
            }] : [],
            contacts: extractContacts(official),
            activity: extractActivity(official, office),
            qualityScore: calculateQualityScore(official, office),
            dataSources: ['google-civic'],
            googleCivic: official
          };

          representatives.push(representative);
        }
      }
    }

    console.log(`✅ Found ${representatives.length} representatives for address: ${address}`);

    return NextResponse.json({
      success: true,
      data: representatives.slice(0, limit),
      address: address,
      count: representatives.length
    });

  } catch (error) {
    console.error('❌ Error in address lookup:', error);
    return NextResponse.json(
      { error: 'Failed to lookup representatives by address' },
      { status: 500 }
    );
  }
}

function extractStateFromAddress(address: string): string {
  // Simple state extraction - in production, use a proper geocoding service
  const stateMap: { [key: string]: string } = {
    'california': 'CA', 'ca': 'CA',
    'new york': 'NY', 'ny': 'NY',
    'texas': 'TX', 'tx': 'TX',
    'florida': 'FL', 'fl': 'FL',
    'illinois': 'IL', 'il': 'IL'
  };
  
  const lowerAddress = address.toLowerCase();
  for (const [key, value] of Object.entries(stateMap)) {
    if (lowerAddress.includes(key)) {
      return value;
    }
  }
  
  return 'CA'; // Default to California
}

function determineLevel(officeName: string): string {
  const lowerOffice = officeName.toLowerCase();
  
  if (lowerOffice.includes('president') || lowerOffice.includes('senate') || lowerOffice.includes('house')) {
    return 'federal';
  } else if (lowerOffice.includes('governor') || lowerOffice.includes('state') || lowerOffice.includes('assembly')) {
    return 'state';
  } else {
    return 'local';
  }
}

function extractContacts(official: any): any[] {
  const contacts = [];
  
  if (official.urls && official.urls.length > 0) {
    contacts.push({
      type: 'website',
      value: official.urls[0],
      source: 'google-civic',
      isPrimary: true,
      isVerified: true
    });
  }
  
  if (official.phones && official.phones.length > 0) {
    contacts.push({
      type: 'phone',
      value: official.phones[0],
      source: 'google-civic',
      isPrimary: true,
      isVerified: true
    });
  }
  
  if (official.emails && official.emails.length > 0) {
    contacts.push({
      type: 'email',
      value: official.emails[0],
      source: 'google-civic',
      isPrimary: true,
      isVerified: true
    });
  }
  
  return contacts;
}

function extractActivity(official: any, office: any): any[] {
  const activity = [];
  
  // Add office-specific activity
  activity.push({
    type: 'office',
    title: `Current Office: ${office.name}`,
    description: `Serving in ${office.name}`,
    date: new Date().toISOString(),
    source: 'google-civic'
  });
  
  // Add party affiliation activity
  if (official.party) {
    activity.push({
      type: 'party',
      title: `Party Affiliation: ${official.party}`,
      description: `Member of ${official.party} Party`,
      date: new Date().toISOString(),
      source: 'google-civic'
    });
  }
  
  return activity;
}

function calculateQualityScore(official: any, office: any): number {
  let score = 0;
  
  if (official.name) score += 20;
  if (office.name) score += 20;
  if (official.photoUrl) score += 15;
  if (official.urls && official.urls.length > 0) score += 15;
  if (official.phones && official.phones.length > 0) score += 10;
  if (official.emails && official.emails.length > 0) score += 10;
  if (official.party) score += 10;
  
  return Math.min(score, 100);
}

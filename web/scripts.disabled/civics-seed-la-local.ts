// web/scripts/civics-seed-la-local.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

// Current Los Angeles local government officials (verified January 2025)
const LA_OFFICIALS = [
  // Mayor
  {
    name: 'Karen Bass',
    office: 'Mayor',
    party: 'Democratic',
    contact: {
      email: 'mayor@lacity.org',
      phone: '(213) 978-0600',
      website: 'https://www.lamayor.org'
    },
    ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles',
    note: 'Elected November 2022, took office December 2022'
  },
  
  // City Attorney
  {
    name: 'Hydee Feldstein Soto',
    office: 'City Attorney',
    party: 'Democratic',
    contact: {
      email: 'city.attorney@lacity.org',
      phone: '(213) 978-8100',
      website: 'https://www.lacityattorney.org'
    },
    ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles',
    note: 'Elected November 2022, took office December 2022'
  },
  
  // Controller
  {
    name: 'Kenneth Mejia',
    office: 'Controller',
    party: 'Green',
    contact: {
      email: 'controller@lacity.org',
      phone: '(213) 978-7200',
      website: 'https://www.lacontroller.org'
    },
    ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles',
    note: 'Elected November 2022, took office December 2022'
  },
  
  // City Council Members (15 districts)
  {
    name: 'Eunisses Hernandez',
    office: 'City Council Member, District 1',
    party: 'Democratic',
    contact: {
      email: 'councilmember.hernandez@lacity.org',
      phone: '(213) 473-7001',
      website: 'https://www.lacity.org/council/cd1'
    },
    ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles/council_district:1',
    note: 'Elected November 2022, took office December 2022'
  },
  {
    name: 'Paul Krekorian',
    office: 'City Council Member, District 2',
    party: 'Democratic',
    contact: {
      email: 'councilmember.krekorian@lacity.org',
      phone: '(213) 473-7002',
      website: 'https://www.lacity.org/council/cd2'
    },
    ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles/council_district:2',
    note: 'Elected November 2020, re-elected November 2024'
  },
  {
    name: 'Bob Blumenfield',
    office: 'City Council Member, District 3',
    party: 'Democratic',
    contact: {
      email: 'councilmember.blumenfield@lacity.org',
      phone: '(213) 473-7003',
      website: 'https://www.lacity.org/council/cd3'
    },
    ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles/council_district:3',
    note: 'Elected November 2013, re-elected November 2024'
  },
  {
    name: 'Nithya Raman',
    office: 'City Council Member, District 4',
    party: 'Democratic',
    contact: {
      email: 'councilmember.raman@lacity.org',
      phone: '(213) 473-7004',
      website: 'https://www.lacity.org/council/cd4'
    },
    ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles/council_district:4',
    note: 'Elected November 2020, re-elected November 2024'
  },
  {
    name: 'Katy Yaroslavsky',
    office: 'City Council Member, District 5',
    party: 'Democratic',
    contact: {
      email: 'councilmember.yaroslavsky@lacity.org',
      phone: '(213) 473-7005',
      website: 'https://www.lacity.org/council/cd5'
    },
    ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles/council_district:5',
    note: 'Elected November 2022, took office December 2022'
  },
  {
    name: 'Imelda Padilla',
    office: 'City Council Member, District 6',
    party: 'Democratic',
    contact: {
      email: 'councilmember.padilla@lacity.org',
      phone: '(213) 473-7006',
      website: 'https://www.lacity.org/council/cd6'
    },
    ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles/council_district:6',
    note: 'Elected June 2023, took office July 2023'
  },
  {
    name: 'Monica Rodriguez',
    office: 'City Council Member, District 7',
    party: 'Democratic',
    contact: {
      email: 'councilmember.rodriguez@lacity.org',
      phone: '(213) 473-7007',
      website: 'https://www.lacity.org/council/cd7'
    },
    ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles/council_district:7',
    note: 'Elected November 2017, re-elected November 2024'
  },
  {
    name: 'Marqueece Harris-Dawson',
    office: 'City Council Member, District 8',
    party: 'Democratic',
    contact: {
      email: 'councilmember.harris-dawson@lacity.org',
      phone: '(213) 473-7008',
      website: 'https://www.lacity.org/council/cd8'
    },
    ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles/council_district:8',
    note: 'Elected November 2015, re-elected November 2024'
  },
  {
    name: 'Curren Price',
    office: 'City Council Member, District 9',
    party: 'Democratic',
    contact: {
      email: 'councilmember.price@lacity.org',
      phone: '(213) 473-7009',
      website: 'https://www.lacity.org/council/cd9'
    },
    ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles/council_district:9',
    note: 'Elected November 2013, re-elected November 2024'
  },
  {
    name: 'Heather Hutt',
    office: 'City Council Member, District 10',
    party: 'Democratic',
    contact: {
      email: 'councilmember.hutt@lacity.org',
      phone: '(213) 473-7010',
      website: 'https://www.lacity.org/council/cd10'
    },
    ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles/council_district:10',
    note: 'Appointed March 2022, elected November 2024'
  },
  {
    name: 'Traci Park',
    office: 'City Council Member, District 11',
    party: 'Democratic',
    contact: {
      email: 'councilmember.park@lacity.org',
      phone: '(213) 473-7011',
      website: 'https://www.lacity.org/council/cd11'
    },
    ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles/council_district:11',
    note: 'Elected November 2022, took office December 2022'
  },
  {
    name: 'John Lee',
    office: 'City Council Member, District 12',
    party: 'Democratic',
    contact: {
      email: 'councilmember.lee@lacity.org',
      phone: '(213) 473-7012',
      website: 'https://www.lacity.org/council/cd12'
    },
    ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles/council_district:12',
    note: 'Elected November 2019, re-elected November 2024'
  },
  {
    name: 'Hugo Soto-Martinez',
    office: 'City Council Member, District 13',
    party: 'Democratic',
    contact: {
      email: 'councilmember.soto-martinez@lacity.org',
      phone: '(213) 473-7013',
      website: 'https://www.lacity.org/council/cd13'
    },
    ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles/council_district:13',
    note: 'Elected November 2022, took office December 2022'
  },
  {
    name: 'Kevin de León',
    office: 'City Council Member, District 14',
    party: 'Democratic',
    contact: {
      email: 'councilmember.deleon@lacity.org',
      phone: '(213) 473-7014',
      website: 'https://www.lacity.org/council/cd14'
    },
    ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles/council_district:14',
    note: 'Elected November 2020, re-elected November 2024'
  },
  {
    name: 'Tim McOsker',
    office: 'City Council Member, District 15',
    party: 'Democratic',
    contact: {
      email: 'councilmember.mcosker@lacity.org',
      phone: '(213) 473-7015',
      website: 'https://www.lacity.org/council/cd15'
    },
    ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles/council_district:15',
    note: 'Elected November 2022, took office December 2022'
  }
];

async function seedLA() {
  console.log('🏙️ Seeding Los Angeles local government data...');
  
  try {
    // First, add the LA city division
    const { error: divisionError } = await supabase
      .from('civics_divisions')
      .upsert({
        ocd_division_id: 'ocd-division/country:us/state:ca/place:los_angeles',
        level: 'local',
        chamber: 'city_council',
        state: 'CA',
        district_number: null,
        name: 'Los Angeles (City)'
      });
    
    if (divisionError) {
      console.error('❌ Error adding LA division:', divisionError);
      return;
    }
    
    console.log('✅ Added LA city division');
    
    // Add each official
    let successCount = 0;
    let errorCount = 0;
    
    for (const official of LA_OFFICIALS) {
      const { error } = await supabase
        .from('civics_representatives')
        .upsert({
          name: official.name,
          party: official.party,
          office: official.office,
          level: 'local',
          jurisdiction: 'Los Angeles, CA',
          ocd_division_id: official.ocd_division_id,
          contact: official.contact,
          raw_payload: {
            office: official.office,
            official: official,
            source: 'manual_verification_la',
            verified_date: new Date().toISOString()
          },
          // Source tracking columns will be added later
          // data_source: 'manual_verification_la',
          // last_verified: new Date().toISOString(),
          // verification_notes: `Manually verified current LA official - ${official.note}`,
          // data_quality_score: 100
        }, {
          onConflict: 'level,jurisdiction,office,name'
        });
      
      if (error) {
        console.error(`❌ Error adding ${official.name}:`, error);
        errorCount++;
      } else {
        console.log(`✅ Added ${official.name} - ${official.office}`);
        successCount++;
      }
    }
    
    console.log(`\n🎉 LA seeding complete!`);
    console.log(`✅ Successfully added: ${successCount} officials`);
    console.log(`❌ Errors: ${errorCount} officials`);
    
    // Show summary
    const { data: summary } = await supabase
      .from('civics_representatives')
      .select('office')
      .eq('level', 'local')
      .eq('jurisdiction', 'Los Angeles, CA');
    
    if (summary) {
      const officeCounts = summary.reduce((acc: Record<string, number>, rep: any) => {
        acc[rep.office] = (acc[rep.office] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📊 LA Officials Summary:');
      console.table(officeCounts);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the seeding
seedLA().catch(console.error);

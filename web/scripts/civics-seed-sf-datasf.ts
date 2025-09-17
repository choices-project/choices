// web/scripts/civics-seed-sf-datasf.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

// San Francisco DataSF API endpoints
// const DATASF_BASE = 'https://data.sfgov.org/resource'; // Unused variable

// Known SF officials data (since we can't get it from Google Civic API)
const SF_OFFICIALS = [
  // Mayor and citywide offices
  {
    name: 'London Breed',
    office: 'Mayor',
    party: 'Democratic',
    contact: {
      email: 'mayor@sfgov.org',
      website: 'https://sfmayor.org',
      phone: '(415) 554-6141'
    }
  },
  {
    name: 'David Chiu',
    office: 'City Attorney',
    party: 'Democratic',
    contact: {
      email: 'cityattorney@sfcityattorney.org',
      website: 'https://sfcityattorney.org',
      phone: '(415) 554-4700'
    }
  },
  {
    name: 'Carmen Chu',
    office: 'City Administrator',
    party: 'Democratic',
    contact: {
      email: 'carmen.chu@sfgov.org',
      website: 'https://sf.gov/departments/city-administrator',
      phone: '(415) 554-7500'
    }
  },
  {
    name: 'Jose Cisneros',
    office: 'Treasurer',
    party: 'Democratic',
    contact: {
      email: 'treasurer@sfgov.org',
      website: 'https://sftreasurer.org',
      phone: '(415) 554-7650'
    }
  },
  {
    name: 'John Arntz',
    office: 'Director of Elections',
    party: null,
    contact: {
      email: 'john.arntz@sfgov.org',
      website: 'https://sfelections.org',
      phone: '(415) 554-4375'
    }
  }
];

// Board of Supervisors (Districts 1-11)
const SF_SUPERVISORS = [
  { name: 'Connie Chan', district: '1', party: 'Democratic' },
  { name: 'Catherine Stefani', district: '2', party: 'Democratic' },
  { name: 'Aaron Peskin', district: '3', party: 'Democratic' },
  { name: 'Joel Engardio', district: '4', party: 'Democratic' },
  { name: 'Dean Preston', district: '5', party: 'Democratic' },
  { name: 'Matt Dorsey', district: '6', party: 'Democratic' },
  { name: 'Myrna Melgar', district: '7', party: 'Democratic' },
  { name: 'Rafael Mandelman', district: '8', party: 'Democratic' },
  { name: 'Hillary Ronen', district: '9', party: 'Democratic' },
  { name: 'Shamann Walton', district: '10', party: 'Democratic' },
  { name: 'Ahsha Safaí', district: '11', party: 'Democratic' }
];

async function upsertDivision(ocd_division_id: string, name: string, chamber: string) {
  const { error } = await supabase.from('civics_divisions').upsert({
    ocd_division_id,
    level: 'local',
    chamber,
    state: 'CA',
    district_number: null,
    name
  });
  if (error) throw error;
}

async function upsertRep(row: {
  name: string; party?: string | null; office: string; ocd_division_id: string; contact?: any; raw_payload: any;
}) {
  const { error } = await supabase.from('civics_representatives').upsert({
    name: row.name,
    party: row.party ?? null,
    office: row.office,
    level: 'local',
    jurisdiction: 'San Francisco, CA',
    district: 'CA-SF',
    ocd_division_id: row.ocd_division_id,
    contact: row.contact ?? null,
    raw_payload: row.raw_payload
  }, { onConflict: 'level,jurisdiction,office,name' }); // 👈 dedupe
  if (error) throw error;
}

async function seedSF() {
  console.log('🌉 Seeding San Francisco local government...');

  // Create divisions
  await upsertDivision(
    'ocd-division/country:us/state:ca/place:san_francisco',
    'San Francisco (City & County)',
    'local_city'
  );

  await upsertDivision(
    'ocd-division/country:us/state:ca/place:san_francisco/board_of_supervisors',
    'San Francisco Board of Supervisors',
    'local_board'
  );

  // Seed citywide officials
  console.log('  🏛️ Seeding citywide officials...');
  for (const official of SF_OFFICIALS) {
    await upsertRep({
      name: official.name,
      party: official.party,
      office: official.office,
      ocd_division_id: 'ocd-division/country:us/state:ca/place:san_francisco',
      contact: official.contact,
      raw_payload: {
        source: 'manual_data',
        office: official.office,
        official: official
      }
    });
  }

  // Seed Board of Supervisors
  console.log('  👥 Seeding Board of Supervisors...');
  for (const supervisor of SF_SUPERVISORS) {
    await upsertRep({
      name: supervisor.name,
      party: supervisor.party,
      office: `Supervisor, District ${supervisor.district}`,
      ocd_division_id: 'ocd-division/country:us/state:ca/place:san_francisco/board_of_supervisors',
      contact: {
        email: `district${supervisor.district}@sfgov.org`,
        website: `https://sf.gov/district-${supervisor.district}`,
        phone: '(415) 554-7460'
      },
      raw_payload: {
        source: 'manual_data',
        office: `Supervisor, District ${supervisor.district}`,
        official: supervisor
      }
    });
  }

  const totalOfficials = SF_OFFICIALS.length + SF_SUPERVISORS.length;
  console.log(`✅ SF local seeding complete. Inserted/updated ${totalOfficials} officials.`);
  console.log(`   🏛️ Citywide officials: ${SF_OFFICIALS.length}`);
  console.log(`   👥 Board of Supervisors: ${SF_SUPERVISORS.length}`);
}

seedSF().catch(e => { 
  console.error('❌ SF seeding failed:', e); 
  process.exit(1); 
});



// web/scripts/civics-seed-federal-only.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert';

const TOP10 = ['CA','TX','FL','NY','PA','IL','OH','GA','NC','MI'];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

// --- Helpers to build OCD IDs ---
const ocdState = (st: string) => `ocd-division/country:us/state:${st.toLowerCase()}`;
const ocdUSSenate = (st: string) => ocdState(st);                        // statewide seat
const ocdUSHouse = (st: string, cd: number) => `${ocdState(st)}/cd:${cd}`;

// --- GovTrack client ---
async function fetchGovTrackRoles(params: Record<string,string|number>) {
  const url = new URL('https://www.govtrack.us/api/v2/role');
  Object.entries({ current: 'true', limit: 600, ...params }).forEach(([k,v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`GovTrack ${res.status}`);
  return res.json() as Promise<{ objects: any[] }>;
}

// --- Upsert helpers ---
async function upsertDivision(row: {
  ocd_division_id: string; level: string; chamber: string; state: string|null;
  district_number: number|null; name: string|null;
}) {
  const { error } = await supabase.from('civics_divisions').upsert(row);
  if (error) throw error;
}

async function upsertRep(row: {
  name: string; party?: string|null; office: string; level: string; jurisdiction: string;
  ocd_division_id: string; contact?: any; raw_payload: any;
}) {
  const { error } = await supabase.from('civics_representatives').upsert({
    name: row.name,
    party: row.party ?? null,
    office: row.office,
    level: row.level,
    jurisdiction: row.jurisdiction,
    ocd_division_id: row.ocd_division_id,
    contact: row.contact ?? null,
    raw_payload: row.raw_payload
  }, { onConflict: 'level,jurisdiction,office,name' }); // 👈 dedupe
  if (error) throw error;
}

// --- Federal ingest (GovTrack) ---
async function ingestFederal(state: string) {
  console.log(`  📊 Fetching federal data for ${state}...`);
  
  // Senators (statewide)
  const sens = await fetchGovTrackRoles({ role_type: 'senator', state });
  console.log(`  👥 Found ${sens.objects.length} senators`);
  
  await upsertDivision({
    ocd_division_id: ocdUSSenate(state),
    level: 'federal',
    chamber: 'us_senate',
    state,
    district_number: null,
    name: `${state} U.S. Senate`
  });
  
  for (const r of sens.objects) {
    const person = r.person || {};
    await upsertRep({
      name: person.name || `${person.firstname ?? ''} ${person.lastname ?? ''}`.trim(),
      party: r.party,
      office: 'U.S. Senator',
      level: 'federal',
      jurisdiction: 'US',
      ocd_division_id: ocdUSSenate(state),
      contact: { phone: r.phone ?? null, website: r.website ?? null },
      raw_payload: r
    });
  }

  // House (districted)
  const reps = await fetchGovTrackRoles({ role_type: 'representative', state });
  console.log(`  🏛️ Found ${reps.objects.length} representatives`);
  
  const cds = new Set<number>();
  for (const r of reps.objects) {
    const cd = Number(r.district);
    if (!Number.isFinite(cd)) continue;
    cds.add(cd);
    await upsertDivision({
      ocd_division_id: ocdUSHouse(state, cd),
      level: 'federal',
      chamber: 'us_house',
      state,
      district_number: cd,
      name: `${state}-CD${cd}`
    });
    const person = r.person || {};
    await upsertRep({
      name: person.name || `${person.firstname ?? ''} ${person.lastname ?? ''}`.trim(),
      party: r.party,
      office: `U.S. Representative (CD ${cd})`,
      level: 'federal',
      jurisdiction: 'US',
      ocd_division_id: ocdUSHouse(state, cd),
      contact: { phone: r.phone ?? null, website: r.website ?? null },
      raw_payload: r
    });
  }
  
  console.log(`  ✅ ${state} federal data complete (${sens.objects.length} senators, ${reps.objects.length} reps)`);
}

// --- Main runner ---
async function run() {
  console.log('🚀 Starting federal-only civics seeding...');
  console.log(`📊 Top 10 states: ${TOP10.join(', ')}`);
  console.log('');

  // Validate required environment variables
  assert(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL required');
  assert(process.env.SUPABASE_SECRET_KEY, 'SUPABASE_SECRET_KEY required');

  let totalStates = 0;
  // const totalSenators = 0; // Unused variables
  // const totalReps = 0;

  // Seed top 10 states
  for (const st of TOP10) {
    console.log(`\n=== ${st}: federal ===`);
    try {
      await ingestFederal(st);
      totalStates++;
    } catch (error) {
      console.error(`❌ Failed to seed ${st}:`, error);
    }
  }

  console.log('\n🎉 Federal seeding complete!');
  console.log(`📊 States processed: ${totalStates}`);
  console.log('');
  console.log('📡 Test your API:');
  console.log('   curl "http://localhost:3000/api/civics/by-state?state=CA&level=federal"');
}

run().catch(e => { 
  console.error('❌ Seeding failed:', e); 
  process.exit(1); 
});



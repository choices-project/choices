// web/scripts/civics-seed-state-only.ts
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
const ocdStateUpper = (st: string, d: string|number) => `${ocdState(st)}/sldu:${d}`;
const ocdStateLower = (st: string, d: string|number) => `${ocdState(st)}/sldl:${d}`;

// --- OpenStates client ---
async function fetchOpenStatesPeople(state: string, chamber: 'upper'|'lower') {
  // OpenStates v3 REST (token in X-API-KEY header)
  const url = new URL('https://v3.openstates.org/people');
  url.searchParams.set('jurisdiction', state.toUpperCase());
  url.searchParams.set('chamber', chamber);
  url.searchParams.set('classification', 'legislator');
  url.searchParams.set('per_page', '50');
  const res = await fetch(url.toString(), {
    headers: { 'X-API-KEY': process.env.OPEN_STATES_API_KEY! }
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenStates ${state}/${chamber} ${res.status}: ${errorText.slice(0, 200)}`);
  }
  return res.json() as Promise<{ results: any[] }>;
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

// --- State ingest (OpenStates) ---
async function ingestState(state: string) {
  console.log(`  📊 Fetching state data for ${state}...`);
  
  // Upper chamber
  const upper = await fetchOpenStatesPeople(state, 'upper');
  console.log(`  👥 Found ${upper.results.length} state senators`);
  
  const seenUpper = new Set<string>();
  for (const p of upper.results) {
    const district = String(p.current_role?.district ?? p.district ?? '').trim();
    if (!district) continue;
    const ocd = ocdStateUpper(state, district);
    if (!seenUpper.has(ocd)) {
      await upsertDivision({
        ocd_division_id: ocd,
        level: 'state',
        chamber: 'state_upper',
        state,
        district_number: Number(district) || null,
        name: `${state} State Senate ${district}`
      });
      seenUpper.add(ocd);
    }
    await upsertRep({
      name: p.name,
      party: p.party ?? null,
      office: 'State Senator',
      level: 'state',
      jurisdiction: state,
      ocd_division_id: ocd,
      contact: { email: p.email ?? null, website: p.links?.[0]?.url ?? null },
      raw_payload: p
    });
  }

  // Lower chamber
  const lower = await fetchOpenStatesPeople(state, 'lower');
  console.log(`  🏛️ Found ${lower.results.length} state representatives`);
  
  const seenLower = new Set<string>();
  for (const p of lower.results) {
    const district = String(p.current_role?.district ?? p.district ?? '').trim();
    if (!district) continue;
    const ocd = ocdStateLower(state, district);
    if (!seenLower.has(ocd)) {
      await upsertDivision({
        ocd_division_id: ocd,
        level: 'state',
        chamber: 'state_lower',
        state,
        district_number: Number(district) || null,
        name: `${state} State Assembly ${district}`
      });
      seenLower.add(ocd);
    }
    await upsertRep({
      name: p.name,
      party: p.party ?? null,
      office: 'State Representative',
      level: 'state',
      jurisdiction: state,
      ocd_division_id: ocd,
      contact: { email: p.email ?? null, website: p.links?.[0]?.url ?? null },
      raw_payload: p
    });
  }
  
  console.log(`  ✅ ${state} state data complete (${upper.results.length} senators, ${lower.results.length} reps)`);
}

// --- Main runner ---
async function run() {
  console.log('🚀 Starting state-only civics seeding...');
  console.log(`📊 Top 10 states: ${TOP10.join(', ')}`);
  console.log('');

  // Validate required environment variables
  assert(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL required');
  assert(process.env.SUPABASE_SECRET_KEY, 'SUPABASE_SECRET_KEY required');
  assert(process.env.OPEN_STATES_API_KEY, 'OPEN_STATES_API_KEY required');

  let totalStates = 0;
  // const totalSenators = 0; // Unused variables
  // const totalReps = 0;

  // Seed top 10 states
  for (const st of TOP10) {
    console.log(`\n=== ${st}: state ===`);
    try {
      await ingestState(st);
      totalStates++;
    } catch (error) {
      console.error(`❌ Failed to seed ${st}:`, error);
    }
  }

  console.log('\n🎉 State seeding complete!');
  console.log(`📊 States processed: ${totalStates}`);
  console.log('');
  console.log('📡 Test your API:');
  console.log('   curl "http://localhost:3000/api/civics/by-state?state=CA&level=state"');
}

run().catch(e => { 
  console.error('❌ Seeding failed:', e); 
  process.exit(1); 
});

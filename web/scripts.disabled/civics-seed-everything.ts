// web/scripts/civics-seed-everything.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import assert from 'node:assert';
import { has, toString, asArray } from '@/lib/util/guards';

// All 50 US states + DC
const ALL_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

// For testing, we can still use TOP10, but switch to ALL_STATES for full deployment
const STATES_TO_PROCESS = process.env.USE_ALL_STATES === '1' ? ALL_STATES : ['CA','TX','FL','NY','PA','IL','OH','GA','NC','MI'];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

// --- Helpers to build OCD IDs ---
const ocdState = (st: string) => `ocd-division/country:us/state:${st.toLowerCase()}`;
const ocdUSSenate = (st: string) => ocdState(st);                        // statewide seat
const ocdUSHouse = (st: string, cd: number) => `${ocdState(st)}/cd:${cd}`;
const ocdStateUpper = (st: string, d: string|number) => `${ocdState(st)}/sldu:${d}`;
const ocdStateLower = (st: string, d: string|number) => `${ocdState(st)}/sldl:${d}`;

// --- Clients (reuse your existing integrations if you have them) ---
async function fetchGovTrackRoles(params: Record<string,string|number>) {
  const url = new URL('https://www.govtrack.us/api/v2/role');
  Object.entries({ current: 'true', limit: 600, ...params }).forEach(([k,v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`GovTrack ${res.status}`);
  return res.json() as Promise<{ objects: unknown[] }>;
}

// Rate limiting for OpenStates API (50 requests/minute)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1200; // 1.2 seconds between requests

async function fetchOpenStatesPeople(state: string, chamber: 'upper'|'lower') {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`  ⏳ Rate limiting: waiting ${waitTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();

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
  return res.json() as Promise<{ results: unknown[] }>;
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
  ocd_division_id: string; contact?: unknown; raw_payload: unknown;
}) {
  // Determine data source and quality score based on level
  const dataSource = row.level === 'federal' ? 'govtrack_api' : 
                    row.level === 'state' ? 'openstates_api' : 
                    'manual_verification_sf';
  
  const dataQualityScore = row.level === 'federal' ? 95 : 
                          row.level === 'state' ? 85 : 
                          100;
  
  const verificationNotes = row.level === 'federal' ? 'Data from GovTrack.us API - federal representatives' :
                           row.level === 'state' ? 'Data from OpenStates API - state representatives' :
                           'Manually verified current officials - San Francisco local government';

  const { error } = await supabase.from('civics_representatives').upsert({
    name: row.name,
    party: row.party ?? null,
    office: row.office,
    level: row.level,
    jurisdiction: row.jurisdiction,
    ocd_division_id: row.ocd_division_id,
    contact: row.contact ?? null,
    raw_payload: row.raw_payload,
    data_source: dataSource,
    last_verified: new Date().toISOString(),
    verification_notes: verificationNotes,
    data_quality_score: dataQualityScore
  }, { onConflict: 'level,jurisdiction,office,name' }); // 👈 dedupe
  if (error) throw error;
}

// --- Federal ingest (GovTrack) ---
async function ingestFederal(state: string) {
  // Senators (statewide)
  const sens = await fetchGovTrackRoles({ role_type: 'senator', state });
  await upsertDivision({
    ocd_division_id: ocdUSSenate(state),
    level: 'federal',
    chamber: 'us_senate',
    state,
    district_number: null,
    name: `${state} U.S. Senate`
  });
  for (const r of sens.objects) {
    const person = (r as any).person || {};
    await upsertRep({
      name: person.name || `${person.firstname ?? ''} ${person.lastname ?? ''}`.trim(),
      party: (r as any).party,
      office: 'U.S. Senator',
      level: 'federal',
      jurisdiction: 'US',
      ocd_division_id: ocdUSSenate(state),
      contact: { phone: (r as any).phone ?? null, website: (r as any).website ?? null },
      raw_payload: r
    });
  }

  // House (districted)
  const reps = await fetchGovTrackRoles({ role_type: 'representative', state });
  const cds = new Set<number>();
  for (const r of reps.objects) {
    const cd = Number((r as any).district);
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
    const person = (r as any).person || {};
    await upsertRep({
      name: person.name || `${person.firstname ?? ''} ${person.lastname ?? ''}`.trim(),
      party: (r as any).party,
      office: `U.S. Representative (CD ${cd})`,
      level: 'federal',
      jurisdiction: 'US',
      ocd_division_id: ocdUSHouse(state, cd),
      contact: { phone: (r as any).phone ?? null, website: (r as any).website ?? null },
      raw_payload: r
    });
  }
}

// --- State ingest (OpenStates) ---
async function ingestState(state: string) {
  console.log(`  📊 Fetching state data for ${state}...`);
  
  // Upper chamber
  const upper = await fetchOpenStatesPeople(state, 'upper');
  console.log(`  👥 Found ${upper.results.length} state senators`);
  
  const seenUpper = new Set<string>();
  for (const p of upper.results) {
    const district = String((p as any).current_role?.district ?? (p as any).district ?? '').trim();
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
      name: (p as any).name,
      party: (p as any).party ?? null,
      office: 'State Senator',
      level: 'state',
      jurisdiction: state,
      ocd_division_id: ocd,
      contact: { email: (p as any).email ?? null, website: (p as any).links?.[0]?.url ?? null },
      raw_payload: p
    });
  }

  // Lower chamber
  const lower = await fetchOpenStatesPeople(state, 'lower');
  console.log(`  🏛️ Found ${lower.results.length} state representatives`);
  
  const seenLower = new Set<string>();
  for (const p of lower.results) {
    const district = String((p as any).current_role?.district ?? (p as any).district ?? '').trim();
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
      name: (p as any).name,
      party: (p as any).party ?? null,
      office: 'State Representative',
      level: 'state',
      jurisdiction: state,
      ocd_division_id: ocd,
      contact: { email: (p as any).email ?? null, website: (p as any).links?.[0]?.url ?? null },
      raw_payload: p
    });
  }
  
  console.log(`  ✅ ${state} state data complete (${upper.results.length} senators, ${lower.results.length} reps)`);
}

// --- SF Local ingest (Google Civic) ---
const CIVIC_BASE = 'https://www.googleapis.com/civicinfo/v2';
const GOOGLE_KEY = process.env.GOOGLE_CIVIC_INFO_API_KEY || process.env.GOOGLE_CIVIC_API_KEY;
const OCD_SF_PLACE = 'ocd-division/country:us/state:ca/place:san_francisco';
const OCD_SF_COUNTY = 'ocd-division/country:us/state:ca/county:san_francisco';

async function civic(ocdId: string) {
  const url = new URL(`${CIVIC_BASE}/representatives`);
  url.searchParams.set('ocdId', ocdId);
  url.searchParams.set('key', GOOGLE_KEY!);
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(`Google Civic ${r.status}: ${await r.text()}`);
  return r.json() as Promise<{
    offices?: Array<{ name: string; divisionId: string; officialIndices: number[] }>;
    officials?: Array<{ name: string; party?: string; phones?: string[]; urls?: string[]; emails?: string[] }>;
  }>;
}

function flatten(office: { name: string; divisionId: string; officialIndices: number[] }, officials: unknown[]) {
  const out: Array<ReturnType<typeof makeRow>> = [];
  for (const i of office.officialIndices || []) {
    const o = officials[i] || {};
    out.push(makeRow(office.name, office.divisionId, o));
  }
  return out;
}

function makeRow(officeName: string, divisionId: string, o: unknown) {
  return {
    office: officeName,
    ocd_division_id: divisionId,
    name: has(o, 'name') ? toString(o.name, 'Unknown') : 'Unknown',
    party: has(o, 'party') ? toString(o.party) : null,
    contact: {
      phone: has(o, 'phones') ? asArray(o.phones)[0] ?? null : null,
      website: has(o, 'urls') ? asArray(o.urls)[0] ?? null : null,
      email: has(o, 'emails') ? asArray(o.emails)[0] ?? null : null
    },
    raw: o
  };
}

function dedupe(rows: unknown[]) {
  const seen = new Set<string>();
  return rows.filter(r => {
    if (!has(r, 'office') || !has(r, 'name')) return false;
    const k = `${toString(r.office)}|${toString(r.name)}`.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function seedSF() {
  console.log('🌉 Seeding San Francisco local…');

  const [placeRes, countyRes] = await Promise.allSettled([
    civic(OCD_SF_PLACE),
    civic(OCD_SF_COUNTY),
  ]);

  const packets = [];
  if (placeRes.status === 'fulfilled') packets.push(placeRes.value);
  if (countyRes.status === 'fulfilled') packets.push(countyRes.value);
  if (!packets.length) throw new Error('No SF civic data (place+county both failed).');

  await upsertDivision({ 
    ocd_division_id: OCD_SF_PLACE, 
    level: 'place', 
    chamber: '', 
    state: 'CA', 
    district_number: null, 
    name: 'San Francisco (City & County) — Place' 
  });
  await upsertDivision({ 
    ocd_division_id: OCD_SF_COUNTY, 
    level: 'county', 
    chamber: '', 
    state: 'CA', 
    district_number: null, 
    name: 'San Francisco (City & County) — County' 
  });

  let rows: unknown[] = [];
  for (const data of packets) {
    const offices = has(data, 'offices') ? asArray(data.offices) : [];
    const officials = has(data, 'officials') ? asArray(data.officials) : [];
    for (const office of offices) {
      if (has(office, 'name') && has(office, 'divisionId') && has(office, 'officialIndices')) {
        rows.push(...flatten(office as { name: string; divisionId: string; officialIndices: number[] }, officials));
      }
    }
  }
  rows = dedupe(rows);

  for (const r of rows) {
    if (!has(r, 'name') || !has(r, 'office') || !has(r, 'ocd_division_id')) continue;
    await upsertRep({
      name: toString(r.name),
      party: has(r, 'party') ? toString(r.party) : null,
      office: toString(r.office),
      level: 'local',
      jurisdiction: 'San Francisco, CA',
      ocd_division_id: toString(r.ocd_division_id),
      contact: has(r, 'contact') ? r.contact : undefined,
      raw_payload: { office: toString(r.office), official: has(r, 'raw') ? r.raw : undefined }
    });
  }

  console.log(`✅ SF local seeding complete. Inserted/updated ${rows.length} officials.`);
}

// --- Main runner ---
async function run() {
  const includeSF = process.env.INCLUDE_SF_LOCAL === '1';
  
  console.log('🚀 Starting comprehensive civics seeding...');
  console.log(`📊 Processing ${STATES_TO_PROCESS.length} states: ${STATES_TO_PROCESS.join(', ')}`);
  console.log(`🌉 SF Local: ${includeSF ? 'ENABLED' : 'DISABLED'}`);
  console.log('');

  // Validate required environment variables
  assert(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL required');
  assert(process.env.SUPABASE_SECRET_KEY, 'SUPABASE_SECRET_KEY required');
  assert(process.env.OPEN_STATES_API_KEY, 'OPEN_STATES_API_KEY required');
  
  if (includeSF) {
    assert(GOOGLE_KEY, 'GOOGLE_CIVIC_API_KEY or GOOGLE_CIVIC_INFO_API_KEY required for SF local');
  }

  let totalStates = 0;

  // Seed top 10 states
  for (const st of STATES_TO_PROCESS) {
    console.log(`\n=== ${st}: federal ===`);
    await ingestFederal(st);
    console.log(`=== ${st}: state ===`);
    await ingestState(st);
    console.log(`✅ Done ${st}`);
    totalStates++;
  }

  // Seed SF local if enabled
  if (includeSF) {
    console.log('\n=== SF Local ===');
    await seedSF();
    // totalSF = 1; // Unused variable
  }

  console.log('\n🎉 All seeding complete!');
  console.log(`📊 States processed: ${totalStates}`);
  console.log(`🌉 SF Local: ${includeSF ? 'Yes' : 'No'}`);
  console.log('');
  console.log('📡 Test your APIs:');
  console.log('   curl "http://localhost:3000/api/civics/by-state?state=CA&level=federal"');
  if (includeSF) {
    console.log('   curl "http://localhost:3000/api/civics/local/sf"');
  }
}

run().catch(e => { 
  console.error('❌ Seeding failed:', e); 
  process.exit(1); 
});

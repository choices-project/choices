// web/scripts/civics-seed-sf-local.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

const CIVIC_BASE = 'https://www.googleapis.com/civicinfo/v2';
const GOOGLE_KEY = process.env.GOOGLE_CIVIC_INFO_API_KEY || process.env.GOOGLE_CIVIC_API_KEY;
if (!GOOGLE_KEY) throw new Error('Missing Google Civic API key (GOOGLE_CIVIC_INFO_API_KEY or GOOGLE_CIVIC_API_KEY)');

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

async function upsertDivision(ocd_division_id: string, name: string) {
  const { error } = await supabase.from('civics_divisions').upsert({
    ocd_division_id, level: 'local', chamber: 'local_city', state: 'CA',
    district_number: null, name
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

function flatten(office: { name: string; divisionId: string; officialIndices: number[] }, officials: any[]) {
  const out: Array<ReturnType<typeof makeRow>> = [];
  for (const i of office.officialIndices || []) {
    const o = officials[i] || {};
    out.push(makeRow(office.name, office.divisionId, o));
  }
  return out;
}

function makeRow(officeName: string, divisionId: string, o: any) {
  return {
    office: officeName,
    ocd_division_id: divisionId,
    name: o.name || 'Unknown',
    party: o.party ?? null,
    contact: {
      phone: o.phones?.[0] ?? null,
      website: o.urls?.[0] ?? null,
      email: o.emails?.[0] ?? null
    },
    raw: o
  };
}

// simple in-memory dedupe: office+name
function dedupe(rows: any[]) {
  const seen = new Set<string>();
  return rows.filter(r => {
    const k = `${r.office}|${r.name}`.toLowerCase();
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

  await upsertDivision(OCD_SF_PLACE, 'San Francisco (City & County) — Place');
  await upsertDivision(OCD_SF_COUNTY, 'San Francisco (City & County) — County');

  let rows: any[] = [];
  for (const data of packets) {
    const offices = data.offices || [];
    const officials = data.officials || [];
    for (const office of offices) {
      rows.push(...flatten(office, officials));
    }
  }
  rows = dedupe(rows);

  for (const r of rows) {
    await upsertRep({
      name: r.name,
      party: r.party,
      office: r.office,
      ocd_division_id: r.ocd_division_id,
      contact: r.contact,
      raw_payload: { office: r.office, official: r.raw }
    });
  }

  console.log(`✅ SF local seeding complete. Inserted/updated ${rows.length} officials.`);
}

seedSF().catch(e => { console.error(e); process.exit(1); });



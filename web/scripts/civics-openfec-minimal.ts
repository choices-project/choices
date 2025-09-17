// scripts/civics-openfec-minimal.ts
/**
 * Reads fec_candidate_id from civics_person_xref (populated by the legislators sync),
 * calls OpenFEC for latest totals, and upserts civics_fec_minimal.
 */
import 'dotenv/config'
import { getSupabase } from './_shared/supabase'

const FEC_API = 'https://api.open.fec.gov/v1'
const FEC_KEY = process.env.FEC_API_KEY!

type Totals = {
  cycle: number
  total_receipts: number
  cash_on_hand_end_period: number
}

async function fetchLatestTotals(candidateId: string): Promise<Totals | null> {
  const url = new URL(`${FEC_API}/candidate/${candidateId}/totals/`)
  url.searchParams.set('api_key', FEC_KEY)
  url.searchParams.set('per_page', '1')
  url.searchParams.set('sort', '-cycle') // latest first
  url.searchParams.set('sort_hide_null', 'false')

  const res = await fetch(url)
  if (!res.ok) {
    console.warn('OpenFEC %s -> %s', candidateId, res.status)
    return null
  }
  const json = await res.json()
  const row = json?.results?.[0]
  if (!row) return null
  return {
    cycle: Number(row.cycle),
    total_receipts: Number(row.total_receipts ?? 0),
    cash_on_hand_end_period: Number(row.cash_on_hand_end_period ?? 0),
  }
}

async function main() {
  if (!FEC_KEY) throw new Error('FEC_API_KEY missing')
  const supabase = getSupabase()

  // get all persons with fec_candidate_id
  const { data: people, error } = await supabase
    .from('civics_person_xref')
    .select('person_id, fec_candidate_id')
    .not('fec_candidate_id', 'is', null)

  if (error) throw error
  if (!people.length) { console.log('no fec_candidate_id rows found'); return }

  let ok = 0, bad = 0
  for (const p of people) {
    const fecId = p.fec_candidate_id as string
    const totals = await fetchLatestTotals(fecId)
    if (!totals) { bad++; continue }

    const payload = {
      person_id: p.person_id,
      fec_candidate_id: fecId,
      election_cycle: totals.cycle,
      // exactOptionalPropertyTypes-friendly spreads:
      ...(Number.isFinite(totals.total_receipts) && { total_receipts: totals.total_receipts }),
      ...(Number.isFinite(totals.cash_on_hand_end_period) && { cash_on_hand: totals.cash_on_hand_end_period }),
      data_source: 'fec_api' as const,
    }

    const { error: upErr } = await supabase
      .from('civics_fec_minimal')
      .upsert(payload, { onConflict: 'person_id,election_cycle' })

    if (upErr) { bad++; console.warn('upsert failed', upErr); continue }
    ok++
  }
  console.log(`✓ OpenFEC: ${ok} upserts, ${bad} skipped/failed`)
}

main().catch(err => { console.error(err); process.exit(1) })

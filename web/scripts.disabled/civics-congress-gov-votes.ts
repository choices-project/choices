// scripts/civics-congress-gov-votes.ts
/**
 * Strategy:
 *  1) Use GovTrack to get member's last 5 votes (stable and simple).
 *  2) For each vote, call Congress.gov roll-call endpoint to hydrate official details.
 *  3) Upsert into civics_votes_minimal.
 *
 * This avoids the old 404 (wrong path) and guarantees valid roll numbers.
 */
import 'dotenv/config'
import { getSupabase } from './_shared/supabase'

const GOVTRACK = 'https://www.govtrack.us/api/v2'
const CNG_BASE = process.env.CNG_API_BASE ?? 'https://api.congress.gov/v3'
const CNG_KEY  = process.env.CONGRESS_GOV_API_KEY!

type GovTrackVote = {
  vote: {
    id: number
    number: number // roll number
    chamber: 'house' | 'senate'
    congress: number
    session: 1 | 2 // session number
    question: string
    created: string
    related_bill?: { title?: string }
  }
  option: { value: string } // 'Yea','Nay','Present','Not Voting'
}

async function fetchLastGovTrackVotes(govtrackId: number, limit = 5): Promise<GovTrackVote[]> {
  const url = new URL(`${GOVTRACK}/vote_voter`)
  url.searchParams.set('person', String(govtrackId))
  url.searchParams.set('order_by', '-created')
  url.searchParams.set('limit', String(limit))
  const res = await fetch(url)
  if (!res.ok) throw new Error(`GovTrack -> ${res.status}`)
  const json = await res.json()
  return json?.objects ?? []
}

type Chamber = 'house' | 'senate'

/**
 * Fetch a single roll-call vote from Congress.gov v3.
 * @param congress   e.g. 119
 * @param chamber    'house' | 'senate'
 * @param session    1 | 2
 * @param roll       roll call number (integer)
 */
async function fetchCongressRoll(
  congress: number,
  chamber: Chamber,
  session: 1 | 2,
  roll: number,
) {
  // Congress.gov currently provides roll-call data for the HOUSE only (beta).
  // Fall back to GovTrack for everything else.
  if (chamber !== 'house' || congress < 118) return null

  // Optional: short-circuit obviously impossible rolls
  const highest = await highestRollForSession(congress, session)
  if (highest != null && roll > highest) return null

  // Try the requested session first…
  let res = await fetch(
    `${CNG_BASE}/house-votes/${congress}/${session}/${roll}?api_key=${CNG_KEY}`
  )

  // …on 404, flip session once (1 ↔ 2)
  if (res.status === 404) {
    const alt = session === 1 ? 2 : 1
    res = await fetch(
      `${CNG_BASE}/house-votes/${congress}/${alt}/${roll}?api_key=${CNG_KEY}`
    )
    if (res.status === 404) return null
  }

  if (!res.ok) throw new Error(`Congress.gov ${res.status}`)
  const json = await res.json()

  // Shape depends on the API; map to your minimal model here:
  // (adjust fields if your parser expects different names)
  const v = json?.data ?? json?.results ?? json
  return {
    bill_title: v?.bill?.title ?? v?.title ?? null,
    vote_date: v?.voteDate ?? v?.date ?? null,
    vote_position: v?.memberVote?.position ?? v?.position ?? null,
    chamber: 'house',
    roll_id: `${congress}-H-${session}-${roll}`,
    raw: v,
  }
}

async function highestRollForSession(congress: number, session: 1 | 2) {
  // Ask the list endpoint for the highest roll number this session.
  // Many APIs support pageSize/sort; if sort isn't supported,
  // you can fetch page 1 and read the first item's rollNumber.
  const url = new URL(
    `${CNG_BASE}/house-votes/${congress}/${session}?api_key=${CNG_KEY}`
  )
  url.searchParams.set('pageSize', '1')
  url.searchParams.set('sort', 'rollNumber:desc')

  const res = await fetch(url)
  if (!res.ok) return null
  const j = await res.json()
  const first =
    j?.results?.[0] ??
    j?.houseVotes?.[0] ??
    j?.data?.[0] ??
    null
  return first?.rollNumber ?? null
}

function normalizeBillTitle(congJSON: any, fallback?: string): string | null {
  // Congress.gov payloads vary; try a few spots, then fallback to GovTrack's bill title.
  return (
    congJSON?.bill_title ||
    congJSON?.rollCallVote?.bill?.title ||
    congJSON?.rollCallVote?.bill?.latestAction?.text ||
    fallback ||
    null
  )
}

async function upsertVote(person_id: string, voteId: string, title: string | null, date: string | null, pos: string, chamber: string) {
  const supabase = getSupabase()
  const payload = {
    person_id,
    vote_id: voteId,
    ...(title && { bill_title: title }),
    ...(date && { vote_date: date }),
    vote_position: pos,
    party_position: null, // keep minimal & honest
    chamber,
    data_source: 'govtrack+congress.gov' as const,
  }
  const { error } = await supabase
    .from('civics_votes_minimal')
    .insert(payload)
  if (error) throw error
}

async function main() {
  if (!CNG_KEY) throw new Error('CONGRESS_GOV_API_KEY missing')
  const supabase = getSupabase()

  // Find people with govtrack_id
  const { data: people, error } = await supabase
    .from('civics_person_xref')
    .select('person_id, govtrack_id')
    .not('govtrack_id', 'is', null)

  if (error) throw error
  if (!people.length) { console.log('no govtrack_id rows found'); return }

  let written = 0, skipped = 0
  for (const p of people) {
    const gov = p.govtrack_id as number
    const votes = await fetchLastGovTrackVotes(gov, 5)
    if (!votes.length) { skipped++; continue }

    for (const v of votes) {
      const { congress, chamber, session, number: roll } = v.vote
      // use congress.gov roll-call to hydrate
      const cjson = await fetchCongressRoll(congress, chamber, session, roll)

      const voteId = `${congress}-${chamber}-${session}-${roll}`
      const title = normalizeBillTitle(cjson, v.vote.related_bill?.title)
      const date  = cjson?.vote_date ?? v.vote.created.slice(0,10) ?? null
      const pos   = v.option.value || 'Unknown'

      await upsertVote(p.person_id, voteId, title, date, pos, chamber)
      written++
    }
  }
  console.log(`✓ votes hydrated: ${written} (skipped: ${skipped})`)
}

main().catch(err => { console.error(err); process.exit(1) })

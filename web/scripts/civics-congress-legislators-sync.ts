// scripts/civics-congress-legislators-sync.ts
/**
 * Pulls:
 *  - legislators-current.yaml (ids: bioguide, govtrack, fec[])
 *  - legislators-social-media.yaml (twitter, facebook, etc.)
 * Writes:
 *  - civics_person_xref (bioguide, govtrack_id, fec_candidate_id [first])
 *    (assumes one FEC id per person per your schema; adjust if needed)
 */
import 'dotenv/config'
import { parse as parseYAML } from 'yaml'
import { fetchWithETag } from './_shared/http'
import { getSupabase } from './_shared/supabase'
import crypto from 'node:crypto'

const PINNED_COMMIT = process.env.CONGRESS_LEGISLATORS_COMMIT || 'main'
// You can freeze it later, e.g. '8a7ea2f10e4f3b9f7a6e6c2e1f0d0b40f6d4c7a2'
const BASE = `https://raw.githubusercontent.com/unitedstates/congress-legislators/${PINNED_COMMIT}`

type Legislator = {
  id: {
    bioguide?: string
    govtrack?: number
    fec?: string[] | null
  }
  name?: { first?: string; last?: string; official_full?: string }
}
type Social = { id?: { bioguide?: string }, social?: { twitter?: string, facebook?: string, instagram?: string, youtube?: string } }

async function loadYAML<T>(url: string): Promise<T[] | null> {
  const res = await fetchWithETag(url, {}, 3)
  if (res.status === 304) return null // nothing to do
  const data = parseYAML(res.text!) as T[]
  return data
}

async function upsertPerson(
  bioguide: string,
  govtrack: number | null,
  fecCandidateId: string | null
) {
  const supabase = getSupabase()
  // ensure row exists
  const { data: existing, error: selErr } = await supabase
    .from('civics_person_xref')
    .select('person_id, bioguide, govtrack_id, fec_candidate_id')
    .eq('bioguide', bioguide)
    .maybeSingle()
  if (selErr) throw selErr

  if (!existing) {
    const person_id = crypto.randomUUID()
    const { error: insErr } = await supabase.from('civics_person_xref').insert({
      person_id, bioguide, govtrack_id: govtrack, fec_candidate_id: fecCandidateId ?? null,
    })
    if (insErr) throw insErr
    return person_id
  }

  const { person_id } = existing
  // do not blow away existing fec id unless we have a new one
  const { error: updErr } = await supabase.from('civics_person_xref').update({
    govtrack_id: govtrack ?? existing.govtrack_id,
    fec_candidate_id: fecCandidateId ?? existing.fec_candidate_id,
  }).eq('person_id', person_id)
  if (updErr) throw updErr
  return person_id
}

async function upsertSocials(_bioguide: string, _socials: Record<string,string>) {
  // optional: write into a contacts table if you have it. we just no-op to avoid schema bloat.
  // hook here if `civics_contact_info` exists:
  // await supabase.from('civics_contact_info').upsert({ person_id, twitter_url: ..., ... })
  return
}

async function main() {
  console.log('→ congress-legislators sync (pinned to %s)', PINNED_COMMIT)

  const currentURL = `${BASE}/legislators-current.yaml`
  const socialURL  = `${BASE}/legislators-social-media.yaml`

  const current = await loadYAML<Legislator>(currentURL)
  const socials = await loadYAML<Social>(socialURL) // may be null if 304

  // If both 304, bail fast
  if (current === null && socials === null) {
    console.log('✓ no changes (ETag 304)')
    return
  }

  // Build quick lookup for socials by bioguide
  const socialByBio =
    (socials ?? []).reduce<Record<string,Record<string,string>>>((acc, s) => {
      const bio = s.id?.bioguide
      if (!bio) return acc
      const map: Record<string,string> = {}
      const src = s.social ?? {}
      if (src.twitter)   map.twitter_url   = `https://twitter.com/${src.twitter}`
      if (src.facebook)  map.facebook_url  = `https://facebook.com/${src.facebook}`
      if (src.instagram) map.instagram_url = `https://instagram.com/${src.instagram}`
      if (src.youtube)   map.youtube_url   = `https://youtube.com/${src.youtube}`
      acc[bio] = map
      return acc
    }, {})

  if (current) {
    let upserts = 0
    for (const leg of current) {
      const bio = leg.id.bioguide
      if (!bio) continue
      const gov = leg.id.govtrack ?? null
      const fecList = (leg.id.fec ?? []).filter(Boolean)
      const fec = fecList.length ? fecList[0]! : null // schema supports single unique id
      await upsertPerson(bio, gov, fec)
      const soc = socialByBio[bio]
      if (soc) await upsertSocials(bio, soc)
      upserts++
    }
    console.log(`✓ upserted ${upserts} people (bioguide, govtrack, fec[0])`)
  } else {
    console.log('✓ legislators-current unchanged')
  }

  if (socials && socials.length) {
    console.log(`✓ socials processed for ~${Object.keys(socialByBio).length} people`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })

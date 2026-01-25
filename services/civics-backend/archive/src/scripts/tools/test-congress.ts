#!/usr/bin/env node
/**
 * Test Congress.gov API: member list + member item (contact, portrait, etc.).
 * No Supabase. Run: npm run tools:test:congress
 * Optional: npm run tools:test:congress -- --debug to dump raw member-item JSON.
 */
import 'dotenv/config';

import {
  fetchCongressMembers,
  fetchMemberByBioguide,
  fetchMemberByBioguideRaw,
} from '../../clients/congress.js';

const DEBUG = process.argv.includes('--debug');

async function main(): Promise<void> {
  console.log('=== 1. Fetch member list (Congress.gov v3 /member) ===\n');

  const members = await fetchCongressMembers();
  console.log(`Total members: ${members.length}`);
  if (members.length === 0) {
    console.error('No members returned. Check CONGRESS_GOV_API_KEY and API.');
    process.exit(1);
  }

  const withBioguide = members.filter((m) => m.bioguideId);
  console.log(`With bioguideId: ${withBioguide.length}`);

  const sample = members.slice(0, 5);
  console.log('\nSample (first 5):');
  for (const m of sample) {
    console.log(
      `  ${m.name} | bioguide=${m.bioguideId ?? '—'} | state=${m.state ?? '—'} | district=${m.district ?? '—'} | party=${m.party ?? '—'}`,
    );
  }

  const pick = withBioguide[0];
  if (!pick?.bioguideId) {
    console.log('\nNo bioguide to test member-item fetch. Skipping.');
    process.exit(0);
  }

  console.log(`\n=== 2. Fetch member item /member/${pick.bioguideId} ===\n`);

  if (DEBUG) {
    const raw = await fetchMemberByBioguideRaw(pick.bioguideId);
    const s = JSON.stringify(raw, null, 2);
    console.log('Raw member-item JSON (truncated to 8000 chars):\n');
    console.log(s.length > 8000 ? s.slice(0, 8000) + '\n...[truncated]' : s);
    console.log('\n--- end raw ---\n');
  }

  const detail = await fetchMemberByBioguide(pick.bioguideId);
  if (!detail) {
    console.error(`Member item returned null for ${pick.bioguideId}.`);
    process.exit(1);
  }

  console.log(`Name: ${detail.member.name}`);
  console.log(`Bioguide: ${detail.member.bioguideId} | Congress ID: ${detail.member.memberId}`);
  console.log(`Contact phone: ${detail.contactPhone ?? '—'}`);
  console.log(`Contact address: ${detail.contactAddress ?? '—'}`);
  console.log(`Portrait URL: ${detail.portraitUrl ? `${detail.portraitUrl.slice(0, 60)}…` : '—'}`);
  console.log(`Official URL: ${detail.url ?? '—'}`);
  console.log(`Birth year: ${detail.birthYear ?? '—'}`);
  console.log(`Sponsored count: ${detail.sponsoredCount ?? '—'} | Cosponsored: ${detail.cosponsoredCount ?? '—'}`);
  console.log(`Leadership: ${detail.leadershipTitles.length ? detail.leadershipTitles.join('; ') : '—'}`);

  const hasUseful = detail.contactPhone || detail.contactAddress || detail.portraitUrl || detail.url;
  if (!hasUseful) {
    console.warn('\nNo contact/portrait/url from member item. API shape may differ.');
  }

  console.log('\n✅ Congress.gov test passed.');
}

main().catch((err) => {
  console.error('Congress.gov test failed:', err);
  process.exit(1);
});

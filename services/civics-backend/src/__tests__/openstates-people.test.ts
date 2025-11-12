import assert from 'node:assert/strict';
import test from 'node:test';

import { _test_buildCanonicalPerson } from '../ingest/openstates/people.js';

test('buildCanonicalPerson maps enriched OpenStates metadata', () => {
  const raw = {
    id: 'ocd-person/1234',
    name: 'Jane A. Doe Jr.',
    given_name: 'Jane',
    family_name: 'Doe',
    middle_name: 'Alice',
    nickname: 'Janie',
    suffix: 'Jr.',
    gender: 'Female',
    birth_date: '1980-01-01',
    biography: 'Jane Doe biography text.',
    party: [{ name: 'Democratic' }],
    email: 'jane.doe@example.com',
    contact_details: [
      { type: 'Email', value: 'office@example.com' },
      { type: 'VOICE', value: '555-1111' },
      { type: 'URL', value: 'https://doe.house.gov' },
    ],
    roles: [
      {
        type: 'upper',
        jurisdiction: 'ocd-jurisdiction/country:us/state:ca/government',
        district: '11',
        division_id: 'ocd-division/country:us/state:ca/sldu:11',
        start_date: '2022-01-01',
        title: 'Chair',
        role: 'Member',
      },
    ],
    offices: [
      {
        classification: 'capitol',
        name: 'Capitol Office',
        address: '123 Capitol Way',
        voice: '555-2222',
        fax: '555-3333',
        email: 'capitol@example.com',
      },
    ],
    ids: {
      openstates: 'ocd-person/1234',
      bioguide: 'B123',
      fec: 'F123',
      twitter: '@JaneDoe',
      instagram: '@SenJane',
      opensecrets: 'N0001',
    },
    other_identifiers: [{ scheme: 'legacy_openstates', identifier: 'CAL0001' }],
    links: [
      { url: 'https://office.example.com' },
      { url: 'https://twitter.com/JaneDoe' },
    ],
    sources: [{ url: 'https://source.example.com' }],
    social_media: [
      { platform: 'Twitter', username: 'JaneDoe' },
      { platform: 'Instagram', username: 'SenJaneOfficial' },
    ],
    other_names: [{ name: 'J. Doe', start_date: '2010-01-01', end_date: '2012-01-01' }],
    extras: { 'P.O. Box': '12345' },
  };

  const canonical = _test_buildCanonicalPerson(raw, { stateCode: 'CA', isRetired: false });
  assert.ok(canonical);

  assert.equal(canonical?.middleName, 'Alice');
  assert.equal(canonical?.nickname, 'Janie');
  assert.equal(canonical?.suffix, 'Jr.');
  assert.equal(canonical?.birthDate, '1980-01-01');
  assert.equal(canonical?.biography, 'Jane Doe biography text.');

  assert.deepEqual(new Set(canonical?.emails), new Set(['jane.doe@example.com', 'office@example.com', 'capitol@example.com']));
  assert.ok(canonical?.phones.includes('555-1111'));
  assert.ok(canonical?.phones.includes('555-2222'));

  assert.ok(canonical?.links.includes('https://doe.house.gov'));
  assert.ok(canonical?.links.includes('https://office.example.com'));

  assert.equal(canonical?.currentRoles[0]?.divisionId, 'ocd-division/country:us/state:ca/sldu:11');
  assert.equal(canonical?.currentRoles[0]?.title, 'Chair');
  assert.equal(canonical?.currentRoles[0]?.memberRole, 'Member');

  assert.equal(canonical?.offices[0]?.email, 'capitol@example.com');
  assert.equal(canonical?.offices[0]?.name, 'Capitol Office');

  assert.equal(canonical?.identifiers.bioguide, 'B123');
  assert.equal(canonical?.identifiers.fec, 'F123');
  assert.equal(canonical?.identifiers.other.legacy_openstates, 'CAL0001');
  assert.equal(canonical?.identifiers.other.opensecrets, 'N0001');

  const twitterProfiles = canonical?.social.filter((entry) => entry.platform === 'twitter') ?? [];
  assert.equal(twitterProfiles.length, 1);
  assert.equal(twitterProfiles[0]?.handle, 'JaneDoe');
  assert.equal(twitterProfiles[0]?.url, 'https://twitter.com/JaneDoe');

  assert.ok(canonical?.aliases.some((alias) => alias.name === 'J. Doe'));
  assert.deepEqual(canonical?.extras, { 'P.O. Box': '12345' });
  assert.ok(canonical?.sources.includes('https://source.example.com'));
});


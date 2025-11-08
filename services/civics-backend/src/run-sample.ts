#!/usr/bin/env node
/**
 * Developer utility: demonstrates how the civics ingest service
 * uses the shared helpers. This keeps the package runnable in isolation.
 */

import { deriveKeyIssuesFromBills, buildLookupAddress } from '@choices/civics-shared';
import { collectActiveRepresentatives } from './ingest/openstates/index.js';

const sampleLocation = {
  address: '123 Civic Plaza',
  city: 'San Francisco',
  stateCode: 'CA',
  zipCode: '94102',
};

const sampleBills = [
  {
    title: 'An act to expand access to affordable housing',
    subjects: ['Housing', 'Affordable housing'],
    actions: [{ date: '2025-02-10' }, { date: '2025-03-01' }],
    updated_at: '2025-03-05',
  },
  {
    title: 'Climate resilience and coastal protection',
    actions: [{ date: '2025-01-22' }],
    latest_action: '2025-02-18',
  },
];

const sampleReps = await collectActiveRepresentatives({ states: ['CA'] });
console.log(`Loaded ${sampleReps.length} active CA representatives`);

console.log('Derived address:', buildLookupAddress(sampleLocation));
console.log(
  'Key issue signals:\n',
  deriveKeyIssuesFromBills(sampleBills, { source: 'openstates' }),
);


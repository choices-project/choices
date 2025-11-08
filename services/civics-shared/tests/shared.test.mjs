import test from 'node:test';
import assert from 'node:assert/strict';

import {
  deriveKeyIssuesFromBills,
  normalizeDistrict,
  buildLookupAddress,
  getCurrentFecCycle,
  calculateCashOnHand,
  formatCurrency,
} from '../index.js';

test('deriveKeyIssuesFromBills sorts by mentions and recency', () => {
  const signals = deriveKeyIssuesFromBills(
    [
      {
        title: 'Improving access to health services',
        subjects: ['Health', 'Hospitals'],
        actions: [{ date: '2025-02-01' }],
      },
      {
        title: 'Climate resilience investment',
        actions: [{ date: '2025-03-05' }],
        latest_action: '2025-03-08',
      },
      {
        title: 'Climate adaptation and coastal protection',
        actions: [{ date: '2025-03-03' }],
        latest_action: '2025-03-07',
      },
    ],
    { limit: 2 },
  );

  assert.equal(signals.length, 2);
  assert.equal(signals[0].issue, 'Climate');
  assert.equal(signals[0].mentions, 2);
  assert.equal(signals[1].issue, 'Health');
});

test('normalizeDistrict pads numeric districts', () => {
  assert.equal(normalizeDistrict('12'), '12');
  assert.equal(normalizeDistrict('ny-3'), '03');
  assert.equal(normalizeDistrict('CA-7'), '07');
  assert.equal(normalizeDistrict(''), undefined);
});

test('buildLookupAddress prefers explicit address fields', () => {
  assert.equal(
    buildLookupAddress({
      address: '1 Civic Plaza',
      city: 'Denver',
      stateCode: 'CO',
    }),
    '1 Civic Plaza',
  );

  assert.equal(
    buildLookupAddress({
      city: 'Denver',
      stateCode: 'CO',
      zipCode: '80202',
    }),
    'Denver, CO, 80202',
  );

  assert.equal(
    buildLookupAddress({
      coordinates: { lat: 37.7749, lng: -122.4194 },
    }),
    '37.7749, -122.4194',
  );
});

test('getCurrentFecCycle returns even cycle', () => {
  assert.equal(getCurrentFecCycle(new Date('2024-06-01')), 2024);
  assert.equal(getCurrentFecCycle(new Date('2025-01-01')), 2026);
});

test('calculateCashOnHand handles null inputs', () => {
  assert.equal(calculateCashOnHand(null), null);
  assert.equal(
    calculateCashOnHand({ totalRaised: 100000, totalSpent: 25000 }),
    75000,
  );
});

test('formatCurrency keeps human readable output', () => {
  assert.equal(formatCurrency(null), 'N/A');
  assert.equal(formatCurrency(1234), '$1.2K');
  assert.equal(formatCurrency(5_678_910), '$5.7M');
});


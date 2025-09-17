import { mapLegacyToUnified } from '@/lib/util/property-mapping';

test('maps snake to camel', () => {
  const out = mapLegacyToUnified({ total_receipts: 5, keepMe: 1 }, { total_receipts: 'totalReceipts' });
  expect(out).toEqual({ totalReceipts: 5, keepMe: 1 });
});

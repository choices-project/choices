import { assertPresent } from '@/lib/util/guards';

test('assertPresent throws on null/undefined', () => {
  expect(() => assertPresent(null, 'x')).toThrow();
  expect(() => assertPresent(undefined, 'x')).toThrow();
  expect(() => assertPresent(0, 'x')).not.toThrow();
});

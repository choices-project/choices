import { unwrapSingle } from '@/lib/db/safe-select';

test('unwrapSingle returns null on no rows', () => {
  const res = { data: null, error: { code: 'PGRST116' } } as any;
  expect(unwrapSingle(res)).toBeNull();
});

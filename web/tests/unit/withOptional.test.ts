import { withOptional } from '@/lib/util/objects';

test('withOptional drops nullish values', () => {
  const x = withOptional({ id: 1 }, { a: null, b: undefined, c: 3 });
  expect(x).toEqual({ id: 1, c: 3 });
});

import { afterEach } from '@jest/globals';
import * as JestMock from 'jest-mock';

import { makeMockSupabase } from './helpers/supabase-mock';
import { makeWhen } from './helpers/supabase-when';

export function getMS() {
  const ms = makeMockSupabase(JestMock);   // explicit, stable
  const when = makeWhen(ms.__registerRoute);
  return Object.assign({}, ms, { when });
}

afterEach(() => {
  const ms = getMS();
  ms.resetAllMocks();
});
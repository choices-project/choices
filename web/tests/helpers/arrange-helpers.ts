import type { State } from './supabase-mock';
import { getMS } from '../setup';

type Register = (m: (s: State) => boolean, r: () => any) => void;

// Generic find-by-id
export function arrangeFindById<T extends 'polls' | 'votes' | 'users'>(
  register: Register,
  table: T,
  id: string,
  row: any
) {
  const { when } = getMS();
  when().table(table).op('select').select('*').eq('id', id).returnsSingle(row);
}

// Generic insert OK
export function arrangeInsertOk<T extends string>(
  register: Register,
  table: T,
  rows: any[]
) {
  const { when } = getMS();
  when().table(table).op('insert').returnsList(rows);
}

// Generic update OK (with optional filter eq)
export function arrangeUpdateOk<T extends string>(
  register: Register,
  table: T,
  rows: any[],
  eq?: { column: string; value: any }
) {
  const { when } = getMS();
  const dsl = when().table(table).op('update');
  if (eq) dsl.eq(eq.column, eq.value);
  dsl.returnsList(rows);
}

// --- Domain-specific helpers (requested) ------------------------------------

export function arrangeVoteProcessing(
  register: Register,
  pollId: string,
  userId: string,
  voteData: { option_id: string }
) {
  // 1. Mock poll lookup
  arrangeFindById(register, 'polls', pollId, { id: pollId, title: 'Test Poll', total_votes: 0 });
  
  // 2. Mock no existing vote check (canUserVote method)
  const { when } = getMS();
  when().table('votes').op('select').select('id').eq('poll_id', pollId).eq('user_id', userId).returnsSingle(null);
  
  // 3. Mock vote insertion
  arrangeInsertOk(register, 'votes', [{ id: 'vote-123', poll_id: pollId, user_id: userId, option_id: voteData.option_id }]);
  
  // 4. Mock poll update
  arrangeUpdateOk(register, 'polls', [{ id: pollId, total_votes: 1 }], { column: 'id', value: pollId });
}

export function arrangePollCreation(
  register: Register,
  pollId: string,
  title: string
) {
  arrangeInsertOk(register, 'polls', [{ id: pollId, title, total_votes: 0 }]);
}


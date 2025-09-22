import type { Handles } from './supabase-mock';
import { when } from './supabase-when';

// Generic find-by-id
export function arrangeFindById<T extends 'polls' | 'votes' | 'users'>(
  handles: Handles,
  table: T,
  id: string,
  row: any
) {
  when(handles).table(table).select('*').eq('id', id).returnsSingle(row);
}

// Generic insert OK
export function arrangeInsertOk<T extends string>(
  handles: Handles,
  table: T,
  rows: any[]
) {
  when(handles).table(table).op('insert').returnsList(rows);
}

// Generic update OK (with optional filter eq)
export function arrangeUpdateOk<T extends string>(
  handles: Handles,
  table: T,
  rows: any[],
  eq?: { column: string; value: any }
) {
  const dsl = when(handles).table(table).op('update');
  if (eq) dsl.eq(eq.column, eq.value);
  dsl.returnsList(rows);
}

// --- Domain-specific helpers (requested) ------------------------------------

export function arrangeVoteProcessing(
  handles: Handles,
  pollId: string,
  userId: string,
  voteData: { option_id: string }
) {
  // 1. Mock poll lookup
  arrangeFindById(handles, 'polls', pollId, { id: pollId, title: 'Test Poll', total_votes: 0 });
  
  // 2. Mock no existing vote check (canUserVote method)
  when(handles).table('votes').select('id').eq('poll_id', pollId).eq('user_id', userId).returnsSingle(null);
  
  // 3. Mock vote insertion
  arrangeInsertOk(handles, 'votes', [{ id: 'vote-123', poll_id: pollId, user_id: userId, option_id: voteData.option_id }]);
  
  // 4. Mock poll update
  arrangeUpdateOk(handles, 'polls', [{ id: pollId, total_votes: 1 }], { column: 'id', value: pollId });
}

export function arrangePollCreation(
  handles: Handles,
  pollId: string,
  title: string
) {
  arrangeInsertOk(handles, 'polls', [{ id: pollId, title, total_votes: 0 }]);
}


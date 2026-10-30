import { canCastVoteFromSession, shouldPromptSignInToVote } from '@/lib/polls/vote-ui';

describe('vote-ui session chrome', () => {
  it('lets a server cookie session vote without a hydrated client user', () => {
    expect(
      canCastVoteFromSession({ userPresent: false, hasServerSession: true }),
    ).toBe(true);
    expect(
      shouldPromptSignInToVote({
        pollStatus: 'active',
        userPresent: false,
        hasServerSession: true,
      }),
    ).toBe(false);
  });

  it('prompts sign-in when no client user and no server session cookies', () => {
    expect(
      shouldPromptSignInToVote({
        pollStatus: 'active',
        userPresent: false,
        hasServerSession: false,
      }),
    ).toBe(true);
  });
});

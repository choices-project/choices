export function canCastVoteFromSession(input: {
  userPresent: boolean;
  hasServerSession: boolean;
}): boolean {
  return input.userPresent || input.hasServerSession;
}

export function shouldPromptSignInToVote(input: {
  pollStatus: string;
  userPresent: boolean;
  hasServerSession: boolean;
}): boolean {
  return input.pollStatus === 'active' && !canCastVoteFromSession(input);
}

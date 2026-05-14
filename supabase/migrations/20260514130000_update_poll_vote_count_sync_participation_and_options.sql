-- Expand update_poll_vote_count to also sync polls.participation and
-- poll_options.vote_count.
--
-- Background: the previous implementation only updated polls.total_votes,
-- which left two derived stats stale after each vote:
--   * polls.participation -- shown as the "PARTICIPATION" stat on the poll
--     detail page (typeof poll.participation in /api/polls/[id])
--   * poll_options.vote_count -- the per-option vote tallies surfaced via
--     the /api/polls/[id] payload (poll_options.vote_count -> options.votes)
--
-- For ranked polls, "vote_count" per option is interpreted as the number of
-- first-choice ballots (rankings[1] in 1-indexed Postgres array access) for
-- each option's order_index. For non-ranked polls it is the count of vote
-- rows whose option_id matches.
--
-- The function remains SECURITY DEFINER with an explicit search_path so it
-- can be called from authenticated clients and continue to bypass RLS for
-- the targeted updates.
-- migrate:up

CREATE OR REPLACE FUNCTION public.update_poll_vote_count(poll_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  vote_count INTEGER;
  poll_voting_method TEXT;
BEGIN
  SELECT voting_method INTO poll_voting_method
  FROM polls
  WHERE id = poll_id_param;

  IF poll_voting_method IS NULL THEN
    RAISE EXCEPTION 'Poll not found: %', poll_id_param;
  END IF;

  IF poll_voting_method IN ('ranked', 'ranked_choice') THEN
    SELECT COUNT(DISTINCT user_id) INTO vote_count
    FROM poll_rankings
    WHERE poll_id = poll_id_param;

    UPDATE poll_options po
    SET vote_count = COALESCE(sub.first_choice_count, 0)
    FROM (
      SELECT order_index, COUNT(*) AS first_choice_count
      FROM (
        SELECT (rankings[1])::int AS order_index
        FROM poll_rankings
        WHERE poll_id = poll_id_param
          AND rankings IS NOT NULL
          AND array_length(rankings, 1) >= 1
      ) firsts
      GROUP BY order_index
    ) sub
    WHERE po.poll_id = poll_id_param
      AND po.order_index = sub.order_index;

    UPDATE poll_options
    SET vote_count = 0
    WHERE poll_id = poll_id_param
      AND order_index NOT IN (
        SELECT (rankings[1])::int
        FROM poll_rankings
        WHERE poll_id = poll_id_param
          AND rankings IS NOT NULL
          AND array_length(rankings, 1) >= 1
      );
  ELSE
    SELECT COUNT(DISTINCT user_id) INTO vote_count
    FROM votes
    WHERE poll_id = poll_id_param;

    UPDATE poll_options po
    SET vote_count = COALESCE(sub.option_count, 0)
    FROM (
      SELECT option_id, COUNT(*) AS option_count
      FROM votes
      WHERE poll_id = poll_id_param
        AND option_id IS NOT NULL
      GROUP BY option_id
    ) sub
    WHERE po.id = sub.option_id;

    UPDATE poll_options
    SET vote_count = 0
    WHERE poll_id = poll_id_param
      AND id NOT IN (
        SELECT DISTINCT option_id
        FROM votes
        WHERE poll_id = poll_id_param
          AND option_id IS NOT NULL
      );
  END IF;

  UPDATE polls
  SET
    total_votes = vote_count,
    participation = vote_count,
    updated_at = NOW()
  WHERE id = poll_id_param;

  RAISE NOTICE 'Updated poll % vote count to % (method=%)', poll_id_param, vote_count, poll_voting_method;
END;
$function$;

COMMENT ON FUNCTION public.update_poll_vote_count(uuid) IS
  'Recomputes and stores derived tallies for a poll: polls.total_votes, polls.participation, and poll_options.vote_count. Handles both ranked (poll_rankings) and non-ranked (votes) polls. SECURITY DEFINER so it can be invoked from authenticated client contexts after a vote insert.';

-- Backfill all existing polls so dashboards reflect the new participation
-- and per-option counts immediately.
DO $$
DECLARE
  poll_rec RECORD;
BEGIN
  FOR poll_rec IN SELECT id FROM polls LOOP
    PERFORM public.update_poll_vote_count(poll_rec.id);
  END LOOP;
END $$;

-- migrate:down
-- Restore the prior, simpler function body (total_votes only).
CREATE OR REPLACE FUNCTION public.update_poll_vote_count(poll_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  vote_count INTEGER;
  poll_voting_method TEXT;
BEGIN
  SELECT voting_method INTO poll_voting_method
  FROM polls
  WHERE id = poll_id_param;

  IF poll_voting_method IS NULL THEN
    RAISE EXCEPTION 'Poll not found: %', poll_id_param;
  END IF;

  IF poll_voting_method = 'ranked' OR poll_voting_method = 'ranked_choice' THEN
    SELECT COUNT(DISTINCT user_id) INTO vote_count
    FROM poll_rankings
    WHERE poll_id = poll_id_param;
  ELSE
    SELECT COUNT(DISTINCT user_id) INTO vote_count
    FROM votes
    WHERE poll_id = poll_id_param;
  END IF;

  UPDATE polls
  SET
    total_votes = vote_count,
    updated_at = NOW()
  WHERE id = poll_id_param;
END;
$function$;

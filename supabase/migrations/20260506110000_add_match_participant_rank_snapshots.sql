ALTER TABLE public.match_participants
  ADD COLUMN IF NOT EXISTS rank_tier        TEXT,
  ADD COLUMN IF NOT EXISTS rank_division    TEXT,
  ADD COLUMN IF NOT EXISTS rank_lp          INTEGER,
  ADD COLUMN IF NOT EXISTS rank_queue       TEXT,
  ADD COLUMN IF NOT EXISTS rank_snapshot_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_match_participants_rank_snapshot_missing
  ON public.match_participants (match_id, rank_snapshot_at);

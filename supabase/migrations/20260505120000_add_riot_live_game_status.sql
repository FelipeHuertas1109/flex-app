ALTER TABLE public.riot_accounts
  ADD COLUMN IF NOT EXISTS is_in_game BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS live_game_checked_at TIMESTAMPTZ;

COMMENT ON COLUMN public.riot_accounts.is_in_game IS
  'Whether Riot Spectator reports the account in an active game during the latest sync.';

COMMENT ON COLUMN public.riot_accounts.live_game_checked_at IS
  'Timestamp of the latest Riot Spectator live-game status check.';

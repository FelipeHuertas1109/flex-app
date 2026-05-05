ALTER TABLE public.riot_accounts
  ADD COLUMN IF NOT EXISTS total_games INTEGER,
  ADD COLUMN IF NOT EXISTS solo_total_games INTEGER;

COMMENT ON COLUMN public.riot_accounts.total_games IS
  'Total ranked Flex games from Riot League entries wins + losses.';

COMMENT ON COLUMN public.riot_accounts.solo_total_games IS
  'Total ranked Solo/Duo games from Riot League entries wins + losses.';

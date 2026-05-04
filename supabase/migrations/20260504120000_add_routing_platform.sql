ALTER TABLE public.riot_accounts
  ADD COLUMN IF NOT EXISTS routing_platform TEXT;

COMMENT ON COLUMN public.riot_accounts.routing_platform IS
  'Shard de Riot LoL usado para ligas (ej. la1 la2). Permite mostrar region de juego.';

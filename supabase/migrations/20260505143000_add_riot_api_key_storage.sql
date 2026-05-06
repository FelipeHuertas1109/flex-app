CREATE TABLE IF NOT EXISTS public.riot_api_keys (
  provider TEXT PRIMARY KEY DEFAULT 'riot' CHECK (provider = 'riot'),
  api_key TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.riot_api_keys ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.riot_api_keys IS
  'Stores the active Riot API key used by server-side sync jobs.';

COMMENT ON COLUMN public.riot_api_keys.api_key IS
  'Current RIOT_API_KEY value. Read only from trusted server code.';

COMMENT ON COLUMN public.riot_api_keys.updated_at IS
  'Timestamp of the latest Riot API key rotation.';

-- Expandir tabla matches con todos los campos necesarios para reconstruir MatchHistoryItem
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS queue_id           INTEGER,
  ADD COLUMN IF NOT EXISTS queue_label        TEXT,
  ADD COLUMN IF NOT EXISTS game_duration      INTEGER,
  ADD COLUMN IF NOT EXISTS game_mode          TEXT,
  ADD COLUMN IF NOT EXISTS platform           TEXT,
  ADD COLUMN IF NOT EXISTS champion_image_url TEXT,
  ADD COLUMN IF NOT EXISTS cs                 INTEGER,
  ADD COLUMN IF NOT EXISTS cs_per_minute      TEXT,
  ADD COLUMN IF NOT EXISTS kda                TEXT,
  ADD COLUMN IF NOT EXISTS kill_participation INTEGER,
  ADD COLUMN IF NOT EXISTS op_score           NUMERIC,
  ADD COLUMN IF NOT EXISTS op_label           TEXT,
  ADD COLUMN IF NOT EXISTS lp_change          INTEGER,
  ADD COLUMN IF NOT EXISTS damage_taken       INTEGER,
  ADD COLUMN IF NOT EXISTS wards_placed       INTEGER,
  ADD COLUMN IF NOT EXISTS wards_killed       INTEGER,
  ADD COLUMN IF NOT EXISTS largest_multi_kill TEXT,
  ADD COLUMN IF NOT EXISTS items              JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS summoner_spells    JSONB NOT NULL DEFAULT '[]';

-- Índice para lectura rápida por cuenta + cola ordenado por fecha
CREATE INDEX IF NOT EXISTS idx_matches_account_queue
  ON public.matches (riot_account_id, queue_id, played_at DESC);

-- Tabla de todos los participantes (10 por partida) para queries agregadas futuras
CREATE TABLE IF NOT EXISTS public.match_participants (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id            TEXT        NOT NULL,
  puuid               TEXT        NOT NULL,
  riot_id             TEXT,
  champion_name       TEXT,
  champion_image_url  TEXT,
  team_id             INTEGER,
  win                 BOOLEAN,
  kills               INTEGER,
  deaths              INTEGER,
  assists             INTEGER,
  cs                  INTEGER,
  damage_dealt        INTEGER,
  gold_earned         INTEGER,
  vision_score        INTEGER,
  op_score            NUMERIC,
  op_label            TEXT,
  lane                TEXT,
  kda                 TEXT,
  items               JSONB NOT NULL DEFAULT '[]',
  summoner_spells     JSONB NOT NULL DEFAULT '[]',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (match_id, puuid)
);

CREATE INDEX IF NOT EXISTS idx_match_participants_puuid
  ON public.match_participants (puuid);

CREATE INDEX IF NOT EXISTS idx_match_participants_match_id
  ON public.match_participants (match_id);

ALTER TABLE public.match_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view match participants"
  ON public.match_participants FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert match participants"
  ON public.match_participants FOR INSERT WITH CHECK (auth.role() = 'authenticated');

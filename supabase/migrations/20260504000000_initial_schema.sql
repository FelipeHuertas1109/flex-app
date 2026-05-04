-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Perfiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grupos
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Miembros del Grupo
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Cuentas de Riot Globales (Para Scraping unificado)
CREATE TABLE public.riot_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_name TEXT NOT NULL,
  tag_line TEXT NOT NULL,
  tier TEXT,
  rank TEXT,
  lp INTEGER,
  win_rate NUMERIC,
  average_position NUMERIC,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(game_name, tag_line)
);

-- Relacion Cuentas <-> Grupos
CREATE TABLE public.group_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  riot_account_id UUID NOT NULL REFERENCES public.riot_accounts(id) ON DELETE CASCADE,
  custom_name TEXT,
  role_preference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, riot_account_id)
);

-- Partidas extraidas
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  riot_account_id UUID NOT NULL REFERENCES public.riot_accounts(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  champion TEXT,
  lane_role TEXT,
  win BOOLEAN,
  kills INTEGER,
  deaths INTEGER,
  assists INTEGER,
  damage INTEGER,
  gold INTEGER,
  vision INTEGER,
  calculated_position INTEGER,
  played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(riot_account_id, match_id)
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riot_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- POLITICAS DE LECTURA (SELECT)
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Group members can view groups" ON public.groups FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid())
);

CREATE POLICY "Group members can view members" ON public.group_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid())
);

CREATE POLICY "Anyone can view riot accounts" ON public.riot_accounts FOR SELECT USING (true);

CREATE POLICY "Group members can view group accounts" ON public.group_accounts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_accounts.group_id AND user_id = auth.uid())
);

CREATE POLICY "Anyone can view matches of known riot accounts" ON public.matches FOR SELECT USING (true);


-- POLITICAS DE ESCRITURA (INSERT / UPDATE)
CREATE POLICY "Users can create groups" ON public.groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can insert themselves to groups" ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert riot accounts" ON public.riot_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can link accounts to groups" ON public.group_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Funcion y Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

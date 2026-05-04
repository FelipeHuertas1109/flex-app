-- Invitaciones pendientes por email; el alta en group_members usa RPC security definer tras login OAuth.

CREATE TABLE IF NOT EXISTS public.group_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS group_invites_one_pending_email_per_group
  ON public.group_invites (group_id, lower(email))
  WHERE (status = 'pending');

ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group members can view group invites" ON public.group_invites;

CREATE POLICY "Group members can view group invites"
  ON public.group_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_invites.group_id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group members can create invites" ON public.group_invites;

CREATE POLICY "Group members can create invites"
  ON public.group_invites FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_invites.group_id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group members can delete invites" ON public.group_invites;

CREATE POLICY "Group members can delete invites"
  ON public.group_invites FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_invites.group_id AND gm.user_id = auth.uid()
    )
  );

-- Une al usuario actual a cada grupo donde tenga una invitacion pendiente con su email del perfil.
CREATE OR REPLACE FUNCTION public.accept_invites_for_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID := auth.uid();
  my_email TEXT;
BEGIN
  IF uid IS NULL THEN
    RETURN;
  END IF;

  SELECT lower(trim(both FROM email)) INTO my_email FROM public.profiles WHERE id = uid LIMIT 1;
  IF my_email IS NULL OR my_email = '' THEN
    RETURN;
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role)
  SELECT DISTINCT i.group_id, uid, 'member'
  FROM public.group_invites i
  WHERE i.status = 'pending'
    AND lower(trim(both FROM i.email)) = my_email
  ON CONFLICT (group_id, user_id) DO NOTHING;

  UPDATE public.group_invites i
  SET status = 'accepted'
  WHERE i.status = 'pending'
    AND lower(trim(both FROM i.email)) = my_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_invites_for_current_user() TO authenticated;

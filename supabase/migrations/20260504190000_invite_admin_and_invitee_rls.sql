-- Quien puede invitar: grupo.group_members.invite_admin (editable en BD).
-- El resto solo ve sus propias invitaciones (email del perfil) y puede unirse vía RPC.

ALTER TABLE public.group_members
  ADD COLUMN IF NOT EXISTS invite_admin BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.group_members.invite_admin IS 'Si TRUE, puede crear/revocar group_invites de este grupo (admin de invitaciones).';

UPDATE public.group_members gm
SET invite_admin = TRUE
WHERE gm.role = 'owner' AND gm.invite_admin IS NOT TRUE;

-- Lectura nombre de grupo con invitación pendiente aun sin ser miembro
DROP POLICY IF EXISTS "See groups with pending invite to my email" ON public.groups;

CREATE POLICY "See groups with pending invite to my email"
  ON public.groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_invites i
      INNER JOIN public.profiles p ON p.id = auth.uid()
      WHERE i.group_id = groups.id
      AND i.status = 'pending'
      AND lower(trim(both FROM i.email)) = lower(trim(both FROM p.email))
    )
  );

DROP POLICY IF EXISTS "Group members can view group invites" ON public.group_invites;
DROP POLICY IF EXISTS "Group members can create invites" ON public.group_invites;
DROP POLICY IF EXISTS "Group members can delete invites" ON public.group_invites;

DROP POLICY IF EXISTS "Invite admins can view invites for their group" ON public.group_invites;
DROP POLICY IF EXISTS "Users can view invites to their profile email" ON public.group_invites;
DROP POLICY IF EXISTS "Invite admins can create invites for their group" ON public.group_invites;
DROP POLICY IF EXISTS "Invite admins can delete invites for their group" ON public.group_invites;

CREATE POLICY "Invite admins can view invites for their group"
  ON public.group_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_invites.group_id
      AND gm.user_id = auth.uid()
      AND gm.invite_admin IS TRUE
    )
  );

CREATE POLICY "Users can view invites to their profile email"
  ON public.group_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND lower(trim(both FROM p.email)) = lower(trim(both FROM email))
    )
  );

CREATE POLICY "Invite admins can create invites for their group"
  ON public.group_invites FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_invites.group_id
      AND gm.user_id = auth.uid()
      AND gm.invite_admin IS TRUE
    )
  );

CREATE POLICY "Invite admins can delete invites for their group"
  ON public.group_invites FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_invites.group_id
      AND gm.user_id = auth.uid()
      AND gm.invite_admin IS TRUE
    )
  );

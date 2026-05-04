-- El dashboard hace join group_members -> profiles. La politica solo-self impide ver
-- id/email/nombre de otros miembros y PostgREST devuelve profiles=null (rompe el map).

DROP POLICY IF EXISTS "Group members can view co-member profiles" ON public.profiles;

CREATE POLICY "Group members can view co-member profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.group_members gm_me
      INNER JOIN public.group_members gm_them ON gm_them.group_id = gm_me.group_id
      WHERE gm_me.user_id = auth.uid()
        AND gm_them.user_id = profiles.id
    )
  );

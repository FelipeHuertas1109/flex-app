-- Solo owners pueden renombrar el grupo (nombre). created_by no se toca desde la app.

DROP POLICY IF EXISTS "Group owners can update groups" ON public.groups;

CREATE POLICY "Group owners can update groups"
  ON public.groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = groups.id
        AND gm.user_id = auth.uid()
        AND gm.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = groups.id
        AND gm.user_id = auth.uid()
        AND gm.role = 'owner'
    )
  );

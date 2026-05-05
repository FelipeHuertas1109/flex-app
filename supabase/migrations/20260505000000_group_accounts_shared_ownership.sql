-- Marca cuentas de grupo que se registran como compartidas/sin dueno visual.
-- group_accounts.user_id se mantiene como miembro que registro o conserva la cuenta,
-- pero is_shared evita presentarla como propiedad personal.
ALTER TABLE public.group_accounts
  ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.group_accounts.is_shared IS
  'TRUE cuando la cuenta debe mostrarse como compartida/sin dueno visual dentro del grupo.';

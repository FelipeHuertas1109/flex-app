-- Textos guardados por cuenta en el grupo (etiquetas UI: User, Psw).
ALTER TABLE public.group_accounts
  ADD COLUMN IF NOT EXISTS credential_user TEXT,
  ADD COLUMN IF NOT EXISTS credential_psw TEXT;

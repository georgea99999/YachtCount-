ALTER TABLE public.vessels ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;
UPDATE public.vessels SET deactivated_at = now() WHERE active = false AND deactivated_at IS NULL;
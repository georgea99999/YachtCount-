ALTER TABLE public.vessels ADD COLUMN active boolean NOT NULL DEFAULT true;
CREATE OR REPLACE FUNCTION public.crew_access_enabled() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT NOT EXISTS(SELECT 1 FROM public.vessel_members m JOIN public.vessels v ON v.id=m.vessel_id WHERE m.user_id=auth.uid() AND (NOT m.active OR NOT v.active))
$$;
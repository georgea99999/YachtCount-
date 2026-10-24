CREATE TABLE public.damage_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id uuid NOT NULL DEFAULT public.current_vessel() REFERENCES public.vessels(id) ON DELETE CASCADE,
  title text NOT NULL,
  location text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  report text NOT NULL DEFAULT '',
  urgency text NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low','medium','high','critical')),
  photo_paths text[] NOT NULL DEFAULT '{}',
  resolved boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_by_username text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.damage_reports TO authenticated;
GRANT ALL ON public.damage_reports TO service_role;
ALTER TABLE public.damage_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY damage_reports_access ON public.damage_reports FOR ALL TO authenticated USING (vessel_id = public.current_vessel()) WITH CHECK (vessel_id = public.current_vessel());
CREATE POLICY active_crew_damage ON public.damage_reports AS RESTRICTIVE FOR ALL TO authenticated USING (public.crew_access_enabled()) WITH CHECK (public.crew_access_enabled());
CREATE OR REPLACE FUNCTION public.stamp_damage_actor() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
    NEW.created_by_username := (SELECT username FROM public.profiles WHERE id = auth.uid());
    NEW.vessel_id := public.current_vessel();
  ELSE
    NEW.created_by := OLD.created_by; NEW.created_by_username := OLD.created_by_username;
    NEW.vessel_id := OLD.vessel_id; NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER stamp_damage_actor BEFORE INSERT OR UPDATE ON public.damage_reports FOR EACH ROW EXECUTE FUNCTION public.stamp_damage_actor();
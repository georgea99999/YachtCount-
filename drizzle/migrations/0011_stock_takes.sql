CREATE TABLE public.stock_takes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id uuid NOT NULL DEFAULT public.current_vessel() REFERENCES public.vessels(id) ON DELETE CASCADE,
  counted_by uuid,
  counted_by_username text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz NOT NULL DEFAULT now(),
  lines jsonb NOT NULL DEFAULT '[]'::jsonb
);
GRANT SELECT, INSERT ON public.stock_takes TO authenticated;
GRANT ALL ON public.stock_takes TO service_role;
ALTER TABLE public.stock_takes ENABLE ROW LEVEL SECURITY;
CREATE POLICY stock_takes_access ON public.stock_takes FOR ALL TO authenticated USING (vessel_id = public.current_vessel()) WITH CHECK (vessel_id = public.current_vessel());
CREATE POLICY active_crew_stock_takes ON public.stock_takes AS RESTRICTIVE FOR ALL TO authenticated USING (public.crew_access_enabled()) WITH CHECK (public.crew_access_enabled());
CREATE OR REPLACE FUNCTION public.stamp_stock_take_actor() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.counted_by := auth.uid();
  NEW.counted_by_username := (SELECT username FROM public.profiles WHERE id = auth.uid());
  NEW.vessel_id := public.current_vessel();
  RETURN NEW;
END $$;
CREATE TRIGGER stamp_stock_take_actor BEFORE INSERT ON public.stock_takes FOR EACH ROW EXECUTE FUNCTION public.stamp_stock_take_actor();
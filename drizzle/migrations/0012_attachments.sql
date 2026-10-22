CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id uuid NOT NULL DEFAULT public.current_vessel() REFERENCES public.vessels(id) ON DELETE CASCADE,
  parent_type text NOT NULL CHECK (parent_type IN ('task','deck_order')),
  parent_id text NOT NULL,
  path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL DEFAULT '',
  uploaded_by uuid,
  uploaded_by_username text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX attachments_parent_idx ON public.attachments(vessel_id, parent_type, parent_id);
GRANT SELECT, INSERT, DELETE ON public.attachments TO authenticated;
GRANT ALL ON public.attachments TO service_role;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY attachments_access ON public.attachments FOR ALL TO authenticated USING (vessel_id = public.current_vessel()) WITH CHECK (vessel_id = public.current_vessel() AND split_part(path,'/',1) = public.current_vessel()::text);
CREATE POLICY active_crew_attachments ON public.attachments AS RESTRICTIVE FOR ALL TO authenticated USING (public.crew_access_enabled()) WITH CHECK (public.crew_access_enabled());
CREATE OR REPLACE FUNCTION public.stamp_attachment_actor() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.uploaded_by := auth.uid();
  NEW.uploaded_by_username := (SELECT username FROM public.profiles WHERE id = auth.uid());
  NEW.vessel_id := public.current_vessel();
  RETURN NEW;
END $$;
CREATE TRIGGER stamp_attachment_actor BEFORE INSERT ON public.attachments FOR EACH ROW EXECUTE FUNCTION public.stamp_attachment_actor();
CREATE POLICY "vessel attachments read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = public.current_vessel()::text AND public.crew_access_enabled());
CREATE POLICY "vessel attachments insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'attachments' AND (storage.foldername(name))[1] = public.current_vessel()::text AND public.crew_access_enabled());
CREATE POLICY "vessel attachments delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = public.current_vessel()::text AND public.crew_access_enabled());
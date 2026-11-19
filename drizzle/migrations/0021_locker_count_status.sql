ALTER TABLE public.stock_takes ADD COLUMN completed_boxes text[] NOT NULL DEFAULT '{}';
CREATE OR REPLACE FUNCTION public.stamp_stock_take_actor() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.counted_by := auth.uid();
  NEW.counted_by_username := (SELECT username FROM public.profiles WHERE id = auth.uid());
  NEW.vessel_id := public.current_vessel();
  SELECT coalesce(array_agg(b.box ORDER BY b.box), '{}'::text[]) INTO NEW.completed_boxes
  FROM (SELECT DISTINCT box FROM public.stock_items WHERE vessel_id = NEW.vessel_id) b
  WHERE NOT EXISTS (
    SELECT 1 FROM public.stock_items i WHERE i.vessel_id = NEW.vessel_id AND i.box = b.box
    AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(NEW.lines) l WHERE l->>'itemId' = i.id::text AND l->>'box' = i.box AND jsonb_typeof(l->'counted') = 'number' AND (l->>'counted')::numeric >= 0)
  );
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.locker_count_status()
RETURNS TABLE(box text, finished_at timestamptz, counted_by_username text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  WITH boxes AS (
    SELECT s.box FROM public.stock_items s WHERE s.vessel_id = public.current_vessel()
    UNION SELECT c.name FROM public.custom_boxes c WHERE c.vessel_id = public.current_vessel()
  )
  SELECT b.box, last_count.finished_at, last_count.counted_by_username FROM boxes b
  LEFT JOIN LATERAL (
    SELECT t.finished_at, t.counted_by_username FROM public.stock_takes t
    WHERE t.vessel_id = public.current_vessel() AND b.box = ANY(t.completed_boxes)
    ORDER BY t.finished_at DESC LIMIT 1
  ) last_count ON true
  ORDER BY b.box;
$$;
REVOKE ALL ON FUNCTION public.locker_count_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.locker_count_status() TO authenticated, service_role;
COMMENT ON COLUMN public.stock_takes.completed_boxes IS 'Boxes verified in full using item IDs at finish time; historical partial records are not treated as full checks.';
CREATE OR REPLACE FUNCTION public.delete_empty_box(box_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vid uuid := public.current_vessel();
  removed integer;
BEGIN
  IF vid IS NULL OR NOT public.crew_access_enabled() OR NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND vessel_id = vid AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'Only the vessel admin can delete boxes';
  END IF;
  LOCK TABLE public.stock_items IN SHARE ROW EXCLUSIVE MODE;
  IF EXISTS (SELECT 1 FROM public.stock_items WHERE vessel_id = vid AND box = box_name) THEN
    RAISE EXCEPTION 'Move all items out of this box before deleting it';
  END IF;
  DELETE FROM public.custom_boxes WHERE vessel_id = vid AND name = box_name;
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed > 0;
END;
$$;
REVOKE ALL ON FUNCTION public.delete_empty_box(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_empty_box(text) TO authenticated;

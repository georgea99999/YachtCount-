ALTER TABLE public.custom_boxes DROP CONSTRAINT custom_boxes_name_key;
CREATE UNIQUE INDEX custom_boxes_vessel_name ON public.custom_boxes(vessel_id,name) WHERE vessel_id IS NOT NULL;
CREATE UNIQUE INDEX custom_boxes_legacy_name ON public.custom_boxes(user_id,name) WHERE vessel_id IS NULL;
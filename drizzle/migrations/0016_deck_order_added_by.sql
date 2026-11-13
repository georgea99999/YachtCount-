ALTER TABLE public.deck_orders ADD COLUMN IF NOT EXISTS added_by uuid;
ALTER TABLE public.deck_orders ADD COLUMN IF NOT EXISTS added_by_username text;
ALTER TABLE public.deck_orders ADD COLUMN IF NOT EXISTS added_at timestamp with time zone NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.stamp_deck_order_actor()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.added_by := auth.uid();
  NEW.added_by_username := (SELECT username FROM public.profiles WHERE id = auth.uid());
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS deck_order_actor ON public.deck_orders;
CREATE TRIGGER deck_order_actor BEFORE INSERT ON public.deck_orders FOR EACH ROW EXECUTE FUNCTION public.stamp_deck_order_actor();

GRANT ALL ON public.deck_orders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deck_orders TO authenticated;
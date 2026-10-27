CREATE OR REPLACE FUNCTION public.sync_task_completed() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  IF NEW.status = 'completed' THEN
    NEW.completed := true;
    IF OLD.status IS DISTINCT FROM 'completed' THEN
      NEW.completed_at := now();
      NEW.completed_by := auth.uid();
      SELECT username INTO NEW.completed_by_username FROM public.profiles WHERE id = auth.uid();
    END IF;
  ELSE
    NEW.completed := false;
    NEW.completed_at := NULL;
    NEW.completed_by := NULL;
    NEW.completed_by_username := NULL;
  END IF;
  RETURN NEW;
END;
$func$;
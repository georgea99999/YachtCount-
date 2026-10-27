ALTER TABLE public.tasks ADD COLUMN status text NOT NULL DEFAULT 'todo';

UPDATE public.tasks SET status = 'completed' WHERE completed = true;

ALTER TABLE public.tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('todo', 'in_progress', 'completed'));

CREATE OR REPLACE FUNCTION public.sync_task_completed() RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
  IF NEW.status = 'completed' THEN
    NEW.completed := true;
  ELSE
    NEW.completed := false;
    NEW.completed_at := NULL;
    NEW.completed_by := NULL;
    NEW.completed_by_username := NULL;
  END IF;
  RETURN NEW;
END;
$func$;

CREATE TRIGGER tasks_sync_completed BEFORE INSERT OR UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.sync_task_completed();
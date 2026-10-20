ALTER TABLE public.tasks ADD COLUMN deleted_at timestamptz;
CREATE INDEX tasks_deleted_idx ON public.tasks(vessel_id, deleted_at);
CREATE POLICY deleted_tasks_only ON public.tasks AS RESTRICTIVE FOR DELETE TO authenticated USING (deleted_at IS NOT NULL);
CREATE POLICY active_crew_tasks ON public.tasks AS RESTRICTIVE FOR ALL TO authenticated USING (public.crew_access_enabled()) WITH CHECK (public.crew_access_enabled());
CREATE POLICY admin_stock_delete ON public.stock_items AS RESTRICTIVE FOR DELETE TO authenticated USING (vessel_id = public.current_vessel() AND EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.vessel_id = stock_items.vessel_id AND r.role = 'owner'));
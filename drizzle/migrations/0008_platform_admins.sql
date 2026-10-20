CREATE TABLE public.platform_admins (user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.platform_admins TO authenticated;
GRANT ALL ON public.platform_admins TO service_role;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY platform_admin_self_read ON public.platform_admins FOR SELECT TO authenticated USING (user_id = auth.uid());
INSERT INTO public.platform_admins(user_id) SELECT id FROM public.profiles WHERE id = 'e1891e8c-f645-46bb-bd09-3746e459a39a';
-- ============================================================
-- Phase 4: Admin role system + RLS upgrades
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

-- 2. user_roles table (roles never on profiles — privilege escalation risk)
CREATE TABLE public.user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL   ON public.user_roles TO service_role;

-- Admins can read all role rows; regular users can read only their own
CREATE POLICY "user_roles_self_read"  ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- 3. has_role() — security-definer so it can read user_roles without RLS bypass
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 4. Expose as RPC callable from the client (no args — checks current session user)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 5. RLS: admins can UPDATE/DELETE menu_items and menu_categories
CREATE POLICY "admin_menu_items_all" ON public.menu_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_categories_all" ON public.menu_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. RLS: admins can read and update ALL orders (not just their own)
CREATE POLICY "admin_orders_all" ON public.orders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. RLS: admins can read all profiles
CREATE POLICY "admin_profiles_read" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 8. Supabase Storage bucket for menu item images
INSERT INTO storage.buckets (id, name, public)
  VALUES ('menu-images', 'menu-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "menu_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "admin_menu_images_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_menu_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'menu-images' AND public.has_role(auth.uid(), 'admin'));

-- 9. Seed the first admin — goodnessgbengafabusiwa@gmail.com
--    Must run AFTER the user has signed up (auth.users row must exist).
--    If the user hasn't signed up yet, re-run this snippet after they do.
DO $$
DECLARE
  _uid UUID;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE email = 'goodnessgbengafabusiwa@gmail.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
      VALUES (_uid, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
    RAISE NOTICE 'Admin role granted to %', _uid;
  ELSE
    RAISE NOTICE 'User not found — sign up first, then re-run the INSERT below:';
    RAISE NOTICE 'INSERT INTO public.user_roles(user_id,role) SELECT id,''admin'' FROM auth.users WHERE email=''goodnessgbengafabusiwa@gmail.com'';';
  END IF;
END;
$$;

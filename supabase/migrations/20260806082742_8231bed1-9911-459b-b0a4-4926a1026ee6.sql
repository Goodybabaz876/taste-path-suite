-- 1. Kitchen-scoped roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS kitchen_id uuid REFERENCES public.kitchens(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_unique_scope
  ON public.user_roles (user_id, role, COALESCE(kitchen_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- 2. Role helpers
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND kitchen_id IS NULL);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin();
$$;

CREATE OR REPLACE FUNCTION public.can_manage_kitchen(_kitchen uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin() OR EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin' AND kitchen_id = _kitchen
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_admin_scope()
RETURNS TABLE(is_super boolean, kitchen_id uuid, kitchen_name text, kitchen_code text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_super_admin(), ur.kitchen_id, k.name, k.code
  FROM public.user_roles ur
  LEFT JOIN public.kitchens k ON k.id = ur.kitchen_id
  WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  ORDER BY (ur.kitchen_id IS NULL) DESC
  LIMIT 1;
$$;

-- 3. Super admin can manage roles
DROP POLICY IF EXISTS "super admin manages roles" ON public.user_roles;
CREATE POLICY "super admin manages roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- 4. Menu write access
DROP POLICY IF EXISTS menu_items_staff_write ON public.menu_items;
CREATE POLICY menu_items_staff_write ON public.menu_items
  FOR ALL TO authenticated
  USING (public.can_manage_kitchen(kitchen_id))
  WITH CHECK (public.can_manage_kitchen(kitchen_id));
GRANT INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;

DROP POLICY IF EXISTS categories_admin_write ON public.menu_categories;
CREATE POLICY categories_admin_write ON public.menu_categories
  FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
GRANT INSERT, UPDATE, DELETE ON public.menu_categories TO authenticated;

DROP POLICY IF EXISTS kitchens_admin_write ON public.kitchens;
CREATE POLICY kitchens_admin_write ON public.kitchens
  FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
GRANT INSERT, UPDATE, DELETE ON public.kitchens TO authenticated;

-- 5. Staff order access
DROP POLICY IF EXISTS orders_staff_read ON public.orders;
CREATE POLICY orders_staff_read ON public.orders
  FOR SELECT TO authenticated USING (public.can_manage_kitchen(kitchen_id));
DROP POLICY IF EXISTS orders_staff_update ON public.orders;
CREATE POLICY orders_staff_update ON public.orders
  FOR UPDATE TO authenticated
  USING (public.can_manage_kitchen(kitchen_id)) WITH CHECK (public.can_manage_kitchen(kitchen_id));

DROP POLICY IF EXISTS order_items_staff_read ON public.order_items;
CREATE POLICY order_items_staff_read ON public.order_items
  FOR SELECT TO authenticated USING (EXISTS(
    SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND public.can_manage_kitchen(o.kitchen_id)
  ));

-- 6. Reusable meal catalogue
CREATE TABLE IF NOT EXISTS public.menu_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  category_id uuid REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  image_url text,
  ingredients text[] NOT NULL DEFAULT '{}',
  prep_time_minutes integer NOT NULL DEFAULT 20,
  dietary_tags text[] NOT NULL DEFAULT '{}',
  spice_level integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_catalog TO authenticated;
GRANT SELECT ON public.menu_catalog TO anon;
GRANT ALL ON public.menu_catalog TO service_role;
ALTER TABLE public.menu_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS menu_catalog_read ON public.menu_catalog;
CREATE POLICY menu_catalog_read ON public.menu_catalog FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS menu_catalog_staff_write ON public.menu_catalog;
CREATE POLICY menu_catalog_staff_write ON public.menu_catalog
  FOR ALL TO authenticated
  USING (public.is_super_admin() OR EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (public.is_super_admin() OR EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS menu_catalog_set_updated_at ON public.menu_catalog;
CREATE TRIGGER menu_catalog_set_updated_at
  BEFORE UPDATE ON public.menu_catalog
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.menu_catalog (name, description, price, category_id, image_url, ingredients, prep_time_minutes, dietary_tags, spice_level)
SELECT DISTINCT ON (mi.name) mi.name, mi.description, mi.price, mi.category_id, mi.image_url, mi.ingredients, mi.prep_time_minutes, mi.dietary_tags, mi.spice_level
FROM public.menu_items mi
ORDER BY mi.name, mi.created_at
ON CONFLICT (name) DO NOTHING;

-- 7. Kitchen-scoped reports
CREATE OR REPLACE FUNCTION public.get_kitchen_transactions(_kitchen uuid)
RETURNS TABLE(id uuid, status text, total numeric, created_at timestamptz, email text, item_count bigint, top_item text, items jsonb, kitchen_name text, kitchen_code text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.can_manage_kitchen(_kitchen) THEN RAISE EXCEPTION 'not authorized'; END IF;
  RETURN QUERY
  SELECT o.id, o.status::text, o.total, o.created_at,
    COALESCE(u.email,'')::text,
    COALESCE(SUM(oi.quantity),0)::bigint,
    (SELECT oi2.name FROM public.order_items oi2 WHERE oi2.order_id = o.id ORDER BY oi2.quantity DESC LIMIT 1),
    COALESCE(jsonb_agg(jsonb_build_object('name', oi.name,'quantity', oi.quantity,'price', oi.unit_price,'line_total', oi.line_total)) FILTER (WHERE oi.id IS NOT NULL), '[]'::jsonb),
    COALESCE(k.name,'')::text, COALESCE(k.code,'')::text
  FROM public.orders o
  LEFT JOIN auth.users u ON u.id = o.user_id
  LEFT JOIN public.order_items oi ON oi.order_id = o.id
  LEFT JOIN public.kitchens k ON k.id = o.kitchen_id
  WHERE o.kitchen_id = _kitchen
  GROUP BY o.id, u.email, k.name, k.code
  ORDER BY o.created_at DESC;
END $$;

CREATE OR REPLACE FUNCTION public.get_kitchen_monthly(_kitchen uuid)
RETURNS TABLE(month text, month_start timestamptz, revenue numeric, order_count bigint, item_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.can_manage_kitchen(_kitchen) THEN RAISE EXCEPTION 'not authorized'; END IF;
  RETURN QUERY
  SELECT to_char(date_trunc('month', o.created_at), 'Mon YYYY'),
         date_trunc('month', o.created_at),
         COALESCE(SUM(o.total),0)::numeric,
         COUNT(o.id)::bigint,
         COALESCE(SUM(agg.qty),0)::bigint
  FROM public.orders o
  LEFT JOIN (SELECT order_id, SUM(quantity) qty FROM public.order_items GROUP BY order_id) agg ON agg.order_id = o.id
  WHERE o.kitchen_id = _kitchen
  GROUP BY 1,2 ORDER BY 2;
END $$;

CREATE OR REPLACE FUNCTION public.get_kitchen_top_items(_kitchen uuid)
RETURNS TABLE(name text, qty bigint, revenue numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.can_manage_kitchen(_kitchen) THEN RAISE EXCEPTION 'not authorized'; END IF;
  RETURN QUERY
  SELECT oi.name, SUM(oi.quantity)::bigint, SUM(oi.line_total)::numeric
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE o.kitchen_id = _kitchen
  GROUP BY oi.name ORDER BY 2 DESC LIMIT 10;
END $$;
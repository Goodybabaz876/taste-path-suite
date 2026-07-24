
-- Roles enum + user_roles table
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own roles" ON public.user_roles;
CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- has_role / is_admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- Seed admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('08b209d9-dc57-4ff4-9728-9793f6744501','admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Admin transactions RPC (email + items array + top item)
CREATE OR REPLACE FUNCTION public.get_admin_transactions()
RETURNS TABLE (
  id uuid, status text, total numeric, created_at timestamptz,
  email text, item_count bigint, top_item text, items jsonb
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
  SELECT
    o.id,
    o.status::text,
    o.total,
    o.created_at,
    COALESCE(u.email, '')::text AS email,
    COALESCE(SUM(oi.quantity), 0)::bigint AS item_count,
    (SELECT oi2.name FROM public.order_items oi2 WHERE oi2.order_id = o.id
       ORDER BY oi2.quantity DESC LIMIT 1) AS top_item,
    COALESCE(jsonb_agg(jsonb_build_object(
      'name', oi.name,
      'quantity', oi.quantity,
      'price', oi.unit_price,
      'line_total', oi.line_total
    )) FILTER (WHERE oi.id IS NOT NULL), '[]'::jsonb) AS items
  FROM public.orders o
  LEFT JOIN auth.users u ON u.id = o.user_id
  LEFT JOIN public.order_items oi ON oi.order_id = o.id
  GROUP BY o.id, u.email
  ORDER BY o.created_at DESC;
END $$;

GRANT EXECUTE ON FUNCTION public.get_admin_transactions() TO authenticated;

-- Monthly sales analytics
CREATE OR REPLACE FUNCTION public.get_admin_sales_analytics()
RETURNS TABLE (
  month text, month_start timestamptz,
  revenue numeric, order_count bigint, item_count bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
  SELECT
    to_char(date_trunc('month', o.created_at), 'Mon YYYY') AS month,
    date_trunc('month', o.created_at) AS month_start,
    COALESCE(SUM(o.total),0)::numeric AS revenue,
    COUNT(o.id)::bigint AS order_count,
    COALESCE(SUM(oi_agg.qty),0)::bigint AS item_count
  FROM public.orders o
  LEFT JOIN (
    SELECT order_id, SUM(quantity) AS qty FROM public.order_items GROUP BY order_id
  ) oi_agg ON oi_agg.order_id = o.id
  GROUP BY 1,2
  ORDER BY 2 ASC;
END $$;

GRANT EXECUTE ON FUNCTION public.get_admin_sales_analytics() TO authenticated;

-- Top customers (returning customers analytics)
CREATE OR REPLACE FUNCTION public.get_admin_top_customers()
RETURNS TABLE (
  email text, order_count bigint, total_spent numeric, favorite_item text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
  SELECT
    COALESCE(u.email,'')::text AS email,
    COUNT(DISTINCT o.id)::bigint AS order_count,
    COALESCE(SUM(o.total),0)::numeric AS total_spent,
    (SELECT oi.name FROM public.order_items oi
      JOIN public.orders o2 ON o2.id = oi.order_id
      WHERE o2.user_id = o.user_id
      GROUP BY oi.name ORDER BY SUM(oi.quantity) DESC LIMIT 1) AS favorite_item
  FROM public.orders o
  LEFT JOIN auth.users u ON u.id = o.user_id
  GROUP BY u.email, o.user_id
  ORDER BY order_count DESC, total_spent DESC
  LIMIT 20;
END $$;

GRANT EXECUTE ON FUNCTION public.get_admin_top_customers() TO authenticated;

-- Top selling items
CREATE OR REPLACE FUNCTION public.get_admin_top_items()
RETURNS TABLE (name text, qty bigint, revenue numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
  SELECT oi.name, SUM(oi.quantity)::bigint AS qty, SUM(oi.line_total)::numeric AS revenue
  FROM public.order_items oi
  GROUP BY oi.name
  ORDER BY qty DESC
  LIMIT 10;
END $$;

GRANT EXECUTE ON FUNCTION public.get_admin_top_items() TO authenticated;

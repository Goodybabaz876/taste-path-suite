-- 1) kitchens table
CREATE TABLE public.kitchens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.kitchens TO anon, authenticated;
GRANT ALL ON public.kitchens TO service_role;
ALTER TABLE public.kitchens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kitchens_public_read" ON public.kitchens FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.kitchens (name, code, sort_order) VALUES
  ('DunnKaycee Kitchen', 'DKC', 1),
  ('Laughter Kitchen',   'LGH', 2),
  ('Mr Grills Kitchen',  'MGK', 3),
  ('BTO Kitchen',        'BTO', 4);

-- 2) orders.kitchen_id
ALTER TABLE public.orders ADD COLUMN kitchen_id UUID REFERENCES public.kitchens(id);
CREATE INDEX orders_kitchen_id_idx ON public.orders(kitchen_id);

-- 3) Updated admin transactions RPC to include kitchen info
DROP FUNCTION IF EXISTS public.get_admin_transactions();
CREATE OR REPLACE FUNCTION public.get_admin_transactions()
 RETURNS TABLE(id uuid, status text, total numeric, created_at timestamptz, email text,
               item_count bigint, top_item text, items jsonb,
               kitchen_name text, kitchen_code text)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  RETURN QUERY
  SELECT o.id, o.status::text, o.total, o.created_at,
    COALESCE(u.email, '')::text,
    COALESCE(SUM(oi.quantity), 0)::bigint,
    (SELECT oi2.name FROM public.order_items oi2 WHERE oi2.order_id = o.id ORDER BY oi2.quantity DESC LIMIT 1),
    COALESCE(jsonb_agg(jsonb_build_object(
      'name', oi.name,'quantity', oi.quantity,'price', oi.unit_price,'line_total', oi.line_total
    )) FILTER (WHERE oi.id IS NOT NULL), '[]'::jsonb),
    COALESCE(k.name, 'Unassigned')::text,
    COALESCE(k.code, '—')::text
  FROM public.orders o
  LEFT JOIN auth.users u ON u.id = o.user_id
  LEFT JOIN public.order_items oi ON oi.order_id = o.id
  LEFT JOIN public.kitchens k ON k.id = o.kitchen_id
  GROUP BY o.id, u.email, k.name, k.code
  ORDER BY o.created_at DESC;
END $function$;

-- 4) Per-kitchen analytics RPC
CREATE OR REPLACE FUNCTION public.get_admin_kitchen_analytics()
 RETURNS TABLE(kitchen_id uuid, kitchen_name text, kitchen_code text,
               revenue numeric, order_count bigint, item_count bigint, top_item text)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  RETURN QUERY
  SELECT k.id, k.name, k.code,
    COALESCE(SUM(o.total),0)::numeric,
    COUNT(DISTINCT o.id)::bigint,
    COALESCE(SUM(oi.quantity),0)::bigint,
    (SELECT oi2.name FROM public.order_items oi2
       JOIN public.orders o2 ON o2.id = oi2.order_id
      WHERE o2.kitchen_id = k.id
      GROUP BY oi2.name ORDER BY SUM(oi2.quantity) DESC LIMIT 1)
  FROM public.kitchens k
  LEFT JOIN public.orders o ON o.kitchen_id = k.id
  LEFT JOIN public.order_items oi ON oi.order_id = o.id
  GROUP BY k.id, k.name, k.code, k.sort_order
  ORDER BY k.sort_order;
END $function$;

-- 5) Per-kitchen monthly sales
CREATE OR REPLACE FUNCTION public.get_admin_kitchen_monthly()
 RETURNS TABLE(kitchen_code text, kitchen_name text, month text, month_start timestamptz, revenue numeric, order_count bigint)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  RETURN QUERY
  SELECT k.code, k.name,
    to_char(date_trunc('month', o.created_at), 'Mon YYYY'),
    date_trunc('month', o.created_at),
    COALESCE(SUM(o.total),0)::numeric,
    COUNT(o.id)::bigint
  FROM public.kitchens k
  LEFT JOIN public.orders o ON o.kitchen_id = k.id
  WHERE o.id IS NOT NULL
  GROUP BY k.code, k.name, k.sort_order, date_trunc('month', o.created_at)
  ORDER BY k.sort_order, date_trunc('month', o.created_at);
END $function$;
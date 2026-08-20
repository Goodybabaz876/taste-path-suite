CREATE TABLE IF NOT EXISTS public.app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL   ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_public_read" ON public.app_settings;
CREATE POLICY "app_settings_public_read" ON public.app_settings
  FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.app_settings (key, value) VALUES
  ('delivery_fee', '1000'),
  ('vat_rate',     '0.075')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_admin_orders_list()
RETURNS TABLE(
  id          uuid,
  status      text,
  total       numeric,
  created_at  timestamptz,
  user_email  text,
  user_id     uuid,
  fulfillment text,
  items       jsonb,
  kitchen_name text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  RETURN QUERY
  SELECT
    o.id,
    o.status::text,
    o.total,
    o.created_at,
    COALESCE(u.email, '')::text                                           AS user_email,
    o.user_id,
    COALESCE(o.fulfillment::text, 'pickup')                              AS fulfillment,
    COALESCE(
      jsonb_agg(
        jsonb_build_object('name', oi.name, 'quantity', oi.quantity)
      ) FILTER (WHERE oi.id IS NOT NULL),
      '[]'::jsonb
    )                                                                     AS items,
    COALESCE(k.name, 'Unassigned')::text                                 AS kitchen_name
  FROM public.orders o
  LEFT JOIN auth.users   u  ON u.id  = o.user_id
  LEFT JOIN public.order_items oi ON oi.order_id = o.id
  LEFT JOIN public.kitchens    k  ON k.id  = o.kitchen_id
  GROUP BY o.id, u.email, k.name
  ORDER BY o.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_orders_list() TO authenticated;
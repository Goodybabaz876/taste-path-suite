-- Admin orders list RPC: returns orders joined with auth.users email
-- Used by the admin Orders page so search works by customer email

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

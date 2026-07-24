CREATE OR REPLACE FUNCTION public.get_admin_transactions()
RETURNS TABLE (
  id UUID,
  status TEXT,
  total NUMERIC,
  created_at TIMESTAMPTZ,
  email TEXT,
  item_count BIGINT,
  items JSON
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT 
    o.id,
    o.status::TEXT,
    o.total,
    o.created_at,
    u.email::TEXT,
    (SELECT COALESCE(SUM(oi.quantity), 0) FROM public.order_items oi WHERE oi.order_id = o.id)::BIGINT as item_count,
    (
      SELECT COALESCE(json_agg(json_build_object(
        'name', oi.name,
        'quantity', oi.quantity,
        'price', oi.unit_price,
        'line_total', oi.line_total
      )), '[]'::json)
      FROM public.order_items oi
      WHERE oi.order_id = o.id
    ) as items
  FROM public.orders o
  JOIN auth.users u ON o.user_id = u.id
  ORDER BY o.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_transactions() TO authenticated;

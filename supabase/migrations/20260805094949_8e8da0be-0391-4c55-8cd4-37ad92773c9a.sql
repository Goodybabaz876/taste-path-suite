-- 1. Admin users listing
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE(id uuid, email text, full_name text, phone text, created_at timestamptz, confirmed_at timestamptz)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  RETURN QUERY
  SELECT u.id,
         COALESCE(u.email,'')::text,
         COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', '')::text,
         COALESCE(p.phone, u.raw_user_meta_data->>'phone', '')::text,
         u.created_at,
         u.email_confirmed_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  ORDER BY u.created_at DESC;
END $$;

GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;

-- 2. Per-kitchen menus
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS kitchen_id uuid REFERENCES public.kitchens(id) ON DELETE CASCADE;

UPDATE public.menu_items
SET kitchen_id = (SELECT id FROM public.kitchens ORDER BY sort_order LIMIT 1)
WHERE kitchen_id IS NULL;

INSERT INTO public.menu_items (category_id, name, description, price, image_url, ingredients, prep_time_minutes, dietary_tags, spice_level, is_available, kitchen_id)
SELECT m.category_id, m.name, m.description, m.price, m.image_url, m.ingredients, m.prep_time_minutes, m.dietary_tags, m.spice_level, m.is_available, k.id
FROM public.menu_items m
CROSS JOIN public.kitchens k
WHERE m.kitchen_id = (SELECT id FROM public.kitchens ORDER BY sort_order LIMIT 1)
  AND k.id <> (SELECT id FROM public.kitchens ORDER BY sort_order LIMIT 1);

CREATE INDEX IF NOT EXISTS menu_items_kitchen_idx ON public.menu_items(kitchen_id);
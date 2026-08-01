-- 1) Update handle_new_user trigger to also capture phone from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone     = COALESCE(EXCLUDED.phone, profiles.phone);
  RETURN NEW;
END;
$$;

-- 2) get_admin_users: security-definer RPC for admin user management panel
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  id            uuid,
  email         text,
  full_name     text,
  phone         text,
  created_at    timestamptz,
  confirmed_at  timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'not authorized'; END IF;
  RETURN QUERY
  SELECT
    au.id,
    COALESCE(au.email, '')::text,
    COALESCE(p.full_name, '')::text,
    COALESCE(p.phone, '')::text,
    COALESCE(p.created_at, au.created_at),
    au.confirmed_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  ORDER BY COALESCE(p.created_at, au.created_at) DESC;
END;
$$;

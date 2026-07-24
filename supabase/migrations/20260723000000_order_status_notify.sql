-- ============================================================
-- Phase 3: Order status email notifications via pg_net
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Enable pg_net (idempotent — safe to run if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Trigger function — fires pg_net HTTP POST to the edge function
--    whenever an order's status changes to a notifiable state.
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _edge_function_url TEXT;
  _service_role_key  TEXT;
  _payload           JSONB;
  _notifiable        TEXT[] := ARRAY['preparing', 'out_for_delivery', 'delivered'];
BEGIN
  -- Only act when status actually changes to one we care about
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NOT (NEW.status::TEXT = ANY(_notifiable)) THEN
    RETURN NEW;
  END IF;

  -- Read secrets from vault / config.
  -- Replace these with your actual project values.
  -- Best practice: store in vault.secrets and read with vault.decrypted_secrets.
  _edge_function_url := current_setting('app.edge_function_url', true);
  _service_role_key  := current_setting('app.service_role_key', true);

  -- Fallback: hard-code URL pattern using Supabase project ref
  -- (the key must still come from config — never hard-code it here)
  IF _edge_function_url IS NULL OR _edge_function_url = '' THEN
    _edge_function_url := 'https://bdwsmguhaiptmfozrsol.supabase.co/functions/v1/notify-order-status';
  END IF;

  _payload := jsonb_build_object(
    'order_id',   NEW.id,
    'user_id',    NEW.user_id,
    'old_status', OLD.status,
    'new_status', NEW.status,
    'total',      NEW.total,
    'fulfillment', NEW.fulfillment
  );

  -- Fire-and-forget HTTP POST (pg_net is async — does not block the UPDATE)
  PERFORM extensions.http_post(
    url     := _edge_function_url,
    body    := _payload::TEXT,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || COALESCE(_service_role_key, '')
    )::TEXT
  );

  RETURN NEW;
END;
$$;

-- 3. Attach trigger to orders table
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_order_status_change();


-- ============================================================
-- 4. One-time: set the service_role_key config parameter
--    Run this separately AFTER replacing the placeholder key.
--    (Never commit the real key to source control.)
-- ============================================================
--
-- ALTER DATABASE postgres
--   SET app.service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_SERVICE_ROLE_KEY';
--
-- The edge function URL is already defaulted to your project ref above.
-- ============================================================

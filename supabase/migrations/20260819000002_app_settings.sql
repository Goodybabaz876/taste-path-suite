-- App settings table: stores configurable platform values like fees/rates
-- Admin can change these via Supabase Studio without touching code

CREATE TABLE IF NOT EXISTS public.app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL   ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings_public_read" ON public.app_settings
  FOR SELECT TO anon, authenticated USING (true);

-- Seed default values
INSERT INTO public.app_settings (key, value) VALUES
  ('delivery_fee', '1000'),
  ('vat_rate',     '0.075')
ON CONFLICT (key) DO NOTHING;

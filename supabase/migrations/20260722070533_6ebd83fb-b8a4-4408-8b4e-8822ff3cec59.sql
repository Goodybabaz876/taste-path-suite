
-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self_all" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- MENU CATEGORIES
CREATE TABLE public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_categories TO anon, authenticated;
GRANT ALL ON public.menu_categories TO service_role;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.menu_categories FOR SELECT TO anon, authenticated USING (true);

-- MENU ITEMS
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  prep_time_minutes INT NOT NULL DEFAULT 20,
  dietary_tags TEXT[] NOT NULL DEFAULT '{}',
  spice_level INT NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_items TO anon, authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu_items_public_read" ON public.menu_items FOR SELECT TO anon, authenticated USING (true);

-- ADDRESSES
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  instructions TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addresses_self_all" ON public.addresses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PAYMENT METHODS (mock/tokenized card metadata only, no PAN)
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  last4 TEXT NOT NULL,
  exp_month INT NOT NULL,
  exp_year INT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_self_all" ON public.payment_methods FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ORDERS
CREATE TYPE public.order_status AS ENUM ('placed','preparing','out_for_delivery','delivered','cancelled');
CREATE TYPE public.fulfillment_type AS ENUM ('delivery','pickup');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'placed',
  fulfillment public.fulfillment_type NOT NULL DEFAULT 'delivery',
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  delivery_address JSONB,
  estimated_ready_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_self_all" ON public.orders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ORDER ITEMS
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id),
  name TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  customizations JSONB NOT NULL DEFAULT '{}'::jsonb,
  line_total NUMERIC(10,2) NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_self_all" ON public.order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- SEED CATEGORIES
INSERT INTO public.menu_categories (name, slug, sort_order) VALUES
  ('Appetizers','appetizers',1),
  ('Mains','mains',2),
  ('Sides','sides',3),
  ('Drinks','drinks',4),
  ('Desserts','desserts',5);

-- SEED NIGERIAN DISHES
INSERT INTO public.menu_items (category_id, name, description, price, ingredients, prep_time_minutes, dietary_tags, spice_level) VALUES
  ((SELECT id FROM public.menu_categories WHERE slug='appetizers'),'Akara','Crispy Nigerian bean cakes deep-fried to golden perfection. Perfect breakfast bite or starter.', 1500, ARRAY['Black-eyed peas','Onion','Pepper','Salt','Palm oil'], 15, ARRAY['vegetarian'], 2),
  ((SELECT id FROM public.menu_categories WHERE slug='appetizers'),'Moi Moi','Steamed bean pudding with peppers, onions, and a hint of crayfish. Rich, savory and satisfying.', 1800, ARRAY['Black-eyed peas','Bell pepper','Onion','Crayfish','Egg'], 25, ARRAY['gluten-free'], 1),
  ((SELECT id FROM public.menu_categories WHERE slug='appetizers'),'Suya','Spicy skewered beef roasted over open flame, dusted with peppery yaji spice blend.', 3500, ARRAY['Beef','Yaji spice','Onion','Tomato','Cabbage'], 20, ARRAY['high-protein'], 4),
  ((SELECT id FROM public.menu_categories WHERE slug='mains'),'Jollof Rice','Iconic Nigerian one-pot rice simmered in smoky tomato-pepper stew. Party favorite.', 3500, ARRAY['Long grain rice','Tomato','Red pepper','Onion','Chicken stock','Bay leaf'], 30, ARRAY['gluten-free'], 3),
  ((SELECT id FROM public.menu_categories WHERE slug='mains'),'Egusi Soup','Rich melon-seed soup with leafy greens and assorted meats. Served with a swallow of choice.', 5500, ARRAY['Egusi seeds','Spinach','Assorted meat','Palm oil','Locust beans'], 40, ARRAY['high-protein'], 3),
  ((SELECT id FROM public.menu_categories WHERE slug='mains'),'Pounded Yam & Efo Riro','Smooth pounded yam served with vibrant vegetable stew loaded with meat and stockfish.', 6000, ARRAY['Yam','Spinach','Palm oil','Assorted meat','Stockfish','Pepper'], 45, ARRAY['gluten-free'], 3),
  ((SELECT id FROM public.menu_categories WHERE slug='mains'),'Pepper Soup (Catfish)','Aromatic light pepper soup with fresh catfish and traditional herbs. Warm and healing.', 5000, ARRAY['Catfish','Uziza leaves','Pepper soup spice','Scent leaves','Onion'], 30, ARRAY['keto','gluten-free'], 5),
  ((SELECT id FROM public.menu_categories WHERE slug='mains'),'Waist Beads Chicken','House special grilled chicken glazed in a tangy pepper marinade. Fan favorite.', 4500, ARRAY['Chicken','Scotch bonnet','Ginger','Garlic','Suya spice'], 35, ARRAY['high-protein'], 4),
  ((SELECT id FROM public.menu_categories WHERE slug='sides'),'Eba','Cassava flour swallow — smooth, elastic, and perfect with any Nigerian soup.', 1000, ARRAY['Garri','Hot water'], 5, ARRAY['vegan','gluten-free'], 0),
  ((SELECT id FROM public.menu_categories WHERE slug='sides'),'Fufu','Soft dough of pounded cassava — the classic pairing for Egusi and Efo Riro.', 1200, ARRAY['Cassava'], 10, ARRAY['vegan','gluten-free'], 0),
  ((SELECT id FROM public.menu_categories WHERE slug='sides'),'Fried Plantain','Sweet, caramelized plantain slices. The universal Nigerian side.', 1500, ARRAY['Ripe plantain','Vegetable oil','Salt'], 10, ARRAY['vegan'], 0),
  ((SELECT id FROM public.menu_categories WHERE slug='drinks'),'Zobo','Chilled hibiscus drink brewed with ginger, pineapple, and cloves.', 1000, ARRAY['Hibiscus','Ginger','Pineapple','Cloves'], 5, ARRAY['vegan'], 0),
  ((SELECT id FROM public.menu_categories WHERE slug='drinks'),'Chapman','Sparkling Nigerian mocktail with citrus, bitters and grenadine over ice.', 1500, ARRAY['Fanta','Sprite','Grenadine','Angostura','Lemon','Cucumber'], 5, ARRAY['vegan'], 0),
  ((SELECT id FROM public.menu_categories WHERE slug='drinks'),'Kunu','Refreshing millet drink lightly spiced with ginger. Naturally sweet.', 900, ARRAY['Millet','Ginger','Sweetener'], 5, ARRAY['vegan'], 1),
  ((SELECT id FROM public.menu_categories WHERE slug='desserts'),'Puff Puff','Golden fried dough balls dusted with sugar. Warm and pillowy.', 1200, ARRAY['Flour','Sugar','Yeast','Nutmeg'], 15, ARRAY['vegetarian'], 0),
  ((SELECT id FROM public.menu_categories WHERE slug='desserts'),'Chin Chin','Crunchy sweet fried pastry bites. Perfect with a cold drink.', 1000, ARRAY['Flour','Sugar','Milk','Butter','Nutmeg'], 20, ARRAY['vegetarian'], 0);

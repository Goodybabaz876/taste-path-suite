-- 1. ADD LOYALTY COLUMNS TO EXISTING TABLES
ALTER TABLE public.profiles ADD COLUMN loyalty_points INT NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN points_discount NUMERIC(10,2) NOT NULL DEFAULT 0;

-- 2. CREATE TRANSACTIONS TABLE
CREATE TYPE public.loyalty_transaction_type AS ENUM ('earn', 'spend', 'admin_adjustment');

CREATE TABLE public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  points INT NOT NULL,
  type public.loyalty_transaction_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for transactions
GRANT SELECT ON public.loyalty_transactions TO authenticated;
GRANT ALL ON public.loyalty_transactions TO service_role;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty_transactions_self_read" ON public.loyalty_transactions 
  FOR SELECT USING (auth.uid() = user_id);

-- 3. EARN POINTS TRIGGER (AFTER UPDATE on orders)
-- Earn 1 point per ₦100 spent on subtotal (or total). Let's use total for simplicity.
CREATE OR REPLACE FUNCTION public.handle_earn_loyalty_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  points_earned INT;
BEGIN
  -- Only trigger when status changes to 'delivered'
  IF NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered' THEN
    -- Calculate points: 1 point per 100 spent, ignore fractional points
    points_earned := FLOOR(NEW.total / 100);
    
    IF points_earned > 0 THEN
      -- Add points to profile
      UPDATE public.profiles 
      SET loyalty_points = loyalty_points + points_earned,
          updated_at = now()
      WHERE id = NEW.user_id;

      -- Log transaction
      INSERT INTO public.loyalty_transactions (user_id, order_id, points, type)
      VALUES (NEW.user_id, NEW.id, points_earned, 'earn');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_delivered_earn_points
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_earn_loyalty_points();

-- 4. SPEND POINTS TRIGGER (BEFORE INSERT on orders)
-- Ensures user actually has enough points before allowing the order to be created.
-- If valid, it deducts the points and logs the transaction.
CREATE OR REPLACE FUNCTION public.handle_spend_loyalty_points()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  current_points INT;
  points_to_spend INT;
BEGIN
  -- Only process if a discount is claimed
  IF NEW.points_discount > 0 THEN
    -- 1 point = 1 Naira discount
    points_to_spend := CAST(NEW.points_discount AS INT);

    -- Get current user points with a row lock to prevent race conditions
    SELECT loyalty_points INTO current_points 
    FROM public.profiles 
    WHERE id = NEW.user_id 
    FOR UPDATE;

    -- Validate balance
    IF current_points IS NULL OR current_points < points_to_spend THEN
      RAISE EXCEPTION 'Insufficient loyalty points. Attempted to spend %, but balance is %.', points_to_spend, COALESCE(current_points, 0);
    END IF;

    -- Deduct points
    UPDATE public.profiles 
    SET loyalty_points = loyalty_points - points_to_spend,
        updated_at = now()
    WHERE id = NEW.user_id;

    -- Note: We can't insert into loyalty_transactions with NEW.id yet because this is BEFORE INSERT
    -- and the order row might not exist in a committed state for the FK constraint.
    -- We can defer the transaction logging or insert it. Actually, if we use gen_random_uuid(), NEW.id is already generated.
    -- Let's just insert it here, since the transaction will rollback if the order insert fails.
    INSERT INTO public.loyalty_transactions (user_id, order_id, points, type)
    VALUES (NEW.user_id, NEW.id, -points_to_spend, 'spend');

  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_and_deduct_loyalty_points
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_spend_loyalty_points();

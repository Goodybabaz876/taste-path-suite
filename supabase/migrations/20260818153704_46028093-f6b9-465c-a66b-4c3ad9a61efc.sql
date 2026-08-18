ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS availability_status text NOT NULL DEFAULT 'available';

UPDATE public.menu_items
  SET availability_status = CASE WHEN is_available THEN 'available' ELSE 'unavailable' END;

ALTER TABLE public.menu_items
  DROP CONSTRAINT IF EXISTS menu_items_availability_status_check;

ALTER TABLE public.menu_items
  ADD CONSTRAINT menu_items_availability_status_check
  CHECK (availability_status IN ('available', 'pending', 'unavailable'));

CREATE OR REPLACE FUNCTION public.sync_menu_item_availability()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.is_available := (NEW.availability_status = 'available');
    RETURN NEW;
  END IF;

  IF NEW.availability_status IS DISTINCT FROM OLD.availability_status THEN
    NEW.is_available := (NEW.availability_status = 'available');
  ELSIF NEW.is_available IS DISTINCT FROM OLD.is_available THEN
    NEW.availability_status := CASE WHEN NEW.is_available THEN 'available' ELSE 'unavailable' END;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS menu_items_sync_availability ON public.menu_items;
CREATE TRIGGER menu_items_sync_availability
  BEFORE INSERT OR UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.sync_menu_item_availability();
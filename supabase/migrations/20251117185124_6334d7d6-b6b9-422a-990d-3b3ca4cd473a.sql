-- Fix function search path security warning
DROP TRIGGER IF EXISTS update_content_items_updated_at ON public.content_items;
DROP FUNCTION IF EXISTS public.update_content_updated_at();

CREATE OR REPLACE FUNCTION public.update_content_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_content_items_updated_at
BEFORE UPDATE ON public.content_items
FOR EACH ROW
EXECUTE FUNCTION public.update_content_updated_at();
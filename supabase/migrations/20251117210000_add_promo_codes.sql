-- Create promo_codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free')),
  discount_value DECIMAL(10, 2),
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_discount CHECK (
    (discount_type = 'free' AND discount_value IS NULL) OR
    (discount_type != 'free' AND discount_value IS NOT NULL)
  )
);

-- Add promo_code field to agencies table
ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS promo_code_used TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'free', 'failed'));

-- Create index for fast lookups
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code) WHERE is_active = true;
CREATE INDEX idx_agencies_promo ON public.agencies(promo_code_used);

-- Enable RLS on promo_codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Public can view active promo codes (for validation)
CREATE POLICY "Anyone can view active promo codes"
ON public.promo_codes
FOR SELECT
USING (is_active = true);

-- Only service role can insert/update promo codes
CREATE POLICY "Service role can manage promo codes"
ON public.promo_codes
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Insert default promo codes
INSERT INTO public.promo_codes (code, description, discount_type, discount_value, max_uses, valid_from)
VALUES
  ('PEYTON', 'Founder free access - No credit card required', 'free', NULL, NULL, now()),
  ('LAUNCH50', 'Launch special - 50% off', 'percentage', 50.00, 100, now()),
  ('EARLYBIRD', 'Early bird - $50 off', 'fixed', 50.00, 50, now())
ON CONFLICT (code) DO NOTHING;

-- Create function to validate and use promo code
CREATE OR REPLACE FUNCTION public.validate_promo_code(promo_code_input TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  discount_type TEXT,
  discount_value DECIMAL,
  message TEXT
) AS $$
DECLARE
  promo_record RECORD;
BEGIN
  -- Get promo code
  SELECT * INTO promo_record
  FROM public.promo_codes
  WHERE UPPER(code) = UPPER(promo_code_input)
    AND is_active = true;

  -- Check if code exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::DECIMAL, 'Invalid promo code'::TEXT;
    RETURN;
  END IF;

  -- Check if code is still valid (date range)
  IF promo_record.valid_from IS NOT NULL AND promo_record.valid_from > now() THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::DECIMAL, 'Promo code not yet active'::TEXT;
    RETURN;
  END IF;

  IF promo_record.valid_until IS NOT NULL AND promo_record.valid_until < now() THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::DECIMAL, 'Promo code has expired'::TEXT;
    RETURN;
  END IF;

  -- Check max uses
  IF promo_record.max_uses IS NOT NULL AND promo_record.current_uses >= promo_record.max_uses THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::DECIMAL, 'Promo code has reached maximum uses'::TEXT;
    RETURN;
  END IF;

  -- Valid!
  RETURN QUERY SELECT
    true,
    promo_record.discount_type,
    promo_record.discount_value,
    'Promo code is valid'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment promo code usage
CREATE OR REPLACE FUNCTION public.increment_promo_usage(promo_code_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.promo_codes
  SET current_uses = current_uses + 1,
      updated_at = now()
  WHERE UPPER(code) = UPPER(promo_code_input)
    AND is_active = true;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON TABLE public.promo_codes IS 'Promotional codes for discounts and free access';
COMMENT ON FUNCTION public.validate_promo_code IS 'Validates a promo code and returns discount info';
COMMENT ON FUNCTION public.increment_promo_usage IS 'Increments the usage count for a promo code';

-- Agency Billing System Migration
-- Enables agencies to bill clients via their own Stripe accounts

-- Add Stripe Connect fields to agencies table
ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'not_connected' CHECK (stripe_account_status IN ('not_connected', 'pending', 'connected', 'disabled')),
ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'usd',
ADD COLUMN IF NOT EXISTS billing_email TEXT,
ADD COLUMN IF NOT EXISTS revenue_share_percentage DECIMAL(5,2) DEFAULT 0.00; -- Future: platform fee if needed

-- Create subscription plans table (agency-defined pricing)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,

  -- Plan details
  name TEXT NOT NULL, -- "Basic Plan", "Pro Plan", etc.
  description TEXT,

  -- Pricing
  price_monthly DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  billing_interval TEXT NOT NULL DEFAULT 'month' CHECK (billing_interval IN ('month', 'year')),

  -- Limits
  max_posts_per_month INTEGER DEFAULT 50,
  max_scheduled_posts INTEGER DEFAULT 100,
  features JSONB DEFAULT '[]'::jsonb, -- ["wordpress", "gmb", "social_media"]

  -- Stripe
  stripe_price_id TEXT, -- Stripe Price ID for this plan
  stripe_product_id TEXT, -- Stripe Product ID

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client subscriptions table
CREATE TABLE IF NOT EXISTS public.client_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,

  -- Stripe subscription info
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,

  -- Subscription details
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete')),
  price_monthly DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  billing_interval TEXT NOT NULL DEFAULT 'month',

  -- Usage tracking
  posts_used_this_month INTEGER DEFAULT 0,
  posts_limit INTEGER DEFAULT 50,

  -- Billing dates
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,

  -- Payment
  next_billing_date TIMESTAMP WITH TIME ZONE,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  last_payment_amount DECIMAL(10,2),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments/invoices table
CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.client_subscriptions(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,

  -- Stripe info
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,

  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),

  -- Metadata
  description TEXT,
  invoice_url TEXT, -- Stripe hosted invoice URL
  receipt_url TEXT, -- Stripe receipt URL

  -- Timing
  payment_date TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create billing events log
CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.client_subscriptions(id) ON DELETE SET NULL,

  -- Event details
  event_type TEXT NOT NULL, -- 'subscription.created', 'payment.succeeded', etc.
  stripe_event_id TEXT,

  -- Data
  event_data JSONB,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Remove BYOK fields from clients table (agencies provide API keys now)
ALTER TABLE public.clients
DROP COLUMN IF EXISTS anthropic_api_key_encrypted,
DROP COLUMN IF EXISTS openai_api_key_encrypted,
DROP COLUMN IF EXISTS google_api_key_encrypted;

-- Add agency API keys (encrypted at agency level)
ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS claude_api_key_encrypted TEXT,
ADD COLUMN IF NOT EXISTS encryption_key_id TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_agency ON public.subscription_plans(agency_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_client ON public.client_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_agency ON public.client_subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_status ON public.client_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_stripe ON public.client_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription ON public.subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_agency ON public.subscription_payments(agency_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_agency ON public.billing_events(agency_id);

-- RLS Policies

-- Agencies can manage their own subscription plans
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can view their own plans"
ON public.subscription_plans
FOR SELECT
USING (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Agencies can create their own plans"
ON public.subscription_plans
FOR INSERT
WITH CHECK (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Agencies can update their own plans"
ON public.subscription_plans
FOR UPDATE
USING (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

-- Client subscriptions policies
ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can view their client subscriptions"
ON public.client_subscriptions
FOR SELECT
USING (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Clients can view their own subscription"
ON public.client_subscriptions
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM public.clients
    WHERE email = auth.jwt() ->> 'email'
  )
);

-- Subscription payments policies
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can view their payments"
ON public.subscription_payments
FOR SELECT
USING (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "Clients can view their own payments"
ON public.subscription_payments
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM public.clients
    WHERE email = auth.jwt() ->> 'email'
  )
);

-- Billing events policies
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies can view their billing events"
ON public.billing_events
FOR SELECT
USING (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

-- Functions

-- Reset monthly usage counter (run via cron monthly)
CREATE OR REPLACE FUNCTION reset_monthly_post_usage()
RETURNS void AS $$
BEGIN
  UPDATE public.client_subscriptions
  SET
    posts_used_this_month = 0,
    updated_at = now()
  WHERE status IN ('active', 'trialing');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment post usage
CREATE OR REPLACE FUNCTION increment_post_usage(client_uuid UUID)
RETURNS boolean AS $$
DECLARE
  current_usage INTEGER;
  usage_limit INTEGER;
BEGIN
  -- Get current usage and limit
  SELECT posts_used_this_month, posts_limit
  INTO current_usage, usage_limit
  FROM public.client_subscriptions
  WHERE client_id = client_uuid
    AND status IN ('active', 'trialing');

  -- Check if limit reached
  IF current_usage >= usage_limit THEN
    RETURN false;
  END IF;

  -- Increment usage
  UPDATE public.client_subscriptions
  SET
    posts_used_this_month = posts_used_this_month + 1,
    updated_at = now()
  WHERE client_id = client_uuid
    AND status IN ('active', 'trialing');

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get agency revenue stats
CREATE OR REPLACE FUNCTION get_agency_revenue_stats(agency_uuid UUID)
RETURNS TABLE (
  total_revenue DECIMAL,
  monthly_recurring_revenue DECIMAL,
  active_subscriptions INTEGER,
  total_clients INTEGER,
  successful_payments INTEGER,
  failed_payments INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN sp.status = 'succeeded' THEN sp.amount ELSE 0 END), 0) as total_revenue,
    COALESCE(SUM(CASE WHEN cs.status = 'active' THEN cs.price_monthly ELSE 0 END), 0) as monthly_recurring_revenue,
    COUNT(DISTINCT CASE WHEN cs.status = 'active' THEN cs.id END)::INTEGER as active_subscriptions,
    COUNT(DISTINCT cs.client_id)::INTEGER as total_clients,
    COUNT(CASE WHEN sp.status = 'succeeded' THEN 1 END)::INTEGER as successful_payments,
    COUNT(CASE WHEN sp.status = 'failed' THEN 1 END)::INTEGER as failed_payments
  FROM public.client_subscriptions cs
  LEFT JOIN public.subscription_payments sp ON sp.subscription_id = cs.id
  WHERE cs.agency_id = agency_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE public.subscription_plans IS 'Agency-defined subscription plans for billing clients';
COMMENT ON TABLE public.client_subscriptions IS 'Active client subscriptions managed via Stripe';
COMMENT ON TABLE public.subscription_payments IS 'Payment history for all subscriptions';
COMMENT ON TABLE public.billing_events IS 'Stripe webhook events log';
COMMENT ON FUNCTION reset_monthly_post_usage IS 'Reset monthly post usage counters (run via cron on 1st of month)';
COMMENT ON FUNCTION increment_post_usage IS 'Increment post usage for a client, returns false if limit reached';
COMMENT ON FUNCTION get_agency_revenue_stats IS 'Get revenue and subscription statistics for an agency';

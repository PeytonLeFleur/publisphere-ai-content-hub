-- Service Packages System
-- Allows agencies to create custom service packages with their own pricing

-- Service packages created by agencies
CREATE TABLE IF NOT EXISTS public.service_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,

  -- Pricing
  price_cents INTEGER NOT NULL, -- Monthly recurring price in cents
  setup_fee_cents INTEGER DEFAULT 0, -- One-time setup fee
  billing_period TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'quarterly', 'yearly', 'one-time')),

  -- Package status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  -- Features included in this package
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example structure:
  -- {
  --   "content_generation": {
  --     "enabled": true,
  --     "monthly_posts": 20,
  --     "article_writing": true,
  --     "gmb_posts": true,
  --     "social_media": true
  --   },
  --   "voice_agents": {
  --     "enabled": true,
  --     "max_agents": 1,
  --     "included_minutes": 1000
  --   },
  --   "automation": {
  --     "enabled": true,
  --     "workflows": true,
  --     "scheduling": true
  --   },
  --   "support": {
  --     "priority": "standard",
  --     "response_time": "24h"
  --   }
  -- }

  -- Usage limits
  monthly_content_limit INTEGER, -- Max content pieces per month (null = unlimited)
  monthly_gmb_posts_limit INTEGER, -- Max GMB posts per month (null = unlimited)
  monthly_articles_limit INTEGER, -- Max articles per month (null = unlimited)
  voice_agents_limit INTEGER, -- Max voice agents (null = unlimited)
  voice_minutes_limit INTEGER, -- Max voice call minutes per month (null = unlimited)
  storage_limit_mb INTEGER, -- Storage limit in MB (null = unlimited)

  -- Stripe integration
  stripe_product_id TEXT UNIQUE,
  stripe_price_id TEXT UNIQUE,

  -- Metadata
  display_order INTEGER DEFAULT 0,
  badge_text TEXT, -- e.g., "Most Popular", "Best Value"
  custom_metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Client package subscriptions (links clients to their packages)
CREATE TABLE IF NOT EXISTS public.client_package_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.service_packages(id) ON DELETE RESTRICT,

  -- Subscription status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'canceled', 'past_due', 'trialing')),

  -- Pricing (captured at subscription time to handle price changes)
  price_cents INTEGER NOT NULL,
  setup_fee_cents INTEGER DEFAULT 0,
  billing_period TEXT NOT NULL,

  -- Dates
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,

  -- Stripe integration
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,

  -- Usage tracking for current period
  usage_stats JSONB DEFAULT '{}'::jsonb,
  -- Example:
  -- {
  --   "content_generated": 15,
  --   "gmb_posts_created": 10,
  --   "articles_written": 5,
  --   "voice_minutes_used": 450,
  --   "storage_used_mb": 120
  -- }

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  UNIQUE(client_id, package_id) -- One subscription per package per client
);

-- Package feature definitions (predefined features agencies can include)
CREATE TABLE IF NOT EXISTS public.package_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key TEXT NOT NULL UNIQUE, -- e.g., "content_generation", "gmb_posts", "voice_agents"
  feature_name TEXT NOT NULL, -- Display name
  feature_description TEXT,
  category TEXT NOT NULL, -- e.g., "content", "voice", "automation", "support"
  icon TEXT, -- Icon name for UI
  is_core BOOLEAN DEFAULT false, -- Core features that should always be shown
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert predefined features
INSERT INTO public.package_features (feature_key, feature_name, feature_description, category, icon, is_core, display_order) VALUES
  ('content_generation', 'Content Generation', 'AI-powered content creation for blogs and social media', 'content', 'FileText', true, 1),
  ('gmb_posts', 'Google Business Posts', 'Create and schedule Google Business Profile posts', 'content', 'MapPin', true, 2),
  ('article_writing', 'Article Writing', 'Long-form article and blog post generation', 'content', 'BookOpen', true, 3),
  ('social_media', 'Social Media Posts', 'Generate social media content for multiple platforms', 'content', 'Share2', true, 4),
  ('content_calendar', 'Content Calendar', 'Plan and schedule content in advance', 'content', 'Calendar', true, 5),
  ('voice_agents', 'AI Voice Agents', 'AI-powered voice agents for customer calls', 'voice', 'Phone', true, 6),
  ('call_recording', 'Call Recording', 'Record and transcribe voice calls', 'voice', 'Mic', false, 7),
  ('call_analytics', 'Call Analytics', 'Detailed analytics and insights on calls', 'voice', 'BarChart3', false, 8),
  ('automation', 'Automation Workflows', 'Automated content publishing and scheduling', 'automation', 'Zap', true, 9),
  ('api_access', 'API Access', 'Programmatic access to platform features', 'advanced', 'Code', false, 10),
  ('white_label', 'White Label', 'Custom branding and white-label options', 'advanced', 'Palette', false, 11),
  ('priority_support', 'Priority Support', 'Priority customer support with faster response times', 'support', 'Headphones', false, 12),
  ('dedicated_account', 'Dedicated Account Manager', 'Personal account manager for assistance', 'support', 'UserCheck', false, 13),
  ('analytics_reporting', 'Analytics & Reporting', 'Advanced analytics and custom reports', 'analytics', 'TrendingUp', true, 14),
  ('wordpress_integration', 'WordPress Integration', 'Direct publishing to WordPress sites', 'integrations', 'Globe', false, 15)
ON CONFLICT (feature_key) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_service_packages_agency ON public.service_packages(agency_id);
CREATE INDEX IF NOT EXISTS idx_service_packages_active ON public.service_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_service_packages_stripe ON public.service_packages(stripe_product_id, stripe_price_id);

CREATE INDEX IF NOT EXISTS idx_client_package_subs_client ON public.client_package_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_package_subs_agency ON public.client_package_subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_client_package_subs_package ON public.client_package_subscriptions(package_id);
CREATE INDEX IF NOT EXISTS idx_client_package_subs_status ON public.client_package_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_client_package_subs_stripe ON public.client_package_subscriptions(stripe_subscription_id);

-- Row-Level Security (RLS)
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_package_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_packages

-- Agencies can manage their own packages
CREATE POLICY "Agencies can manage their service packages"
ON public.service_packages
FOR ALL
USING (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

-- Clients can view packages from their agency
CREATE POLICY "Clients can view their agency's packages"
ON public.service_packages
FOR SELECT
USING (
  is_active = true AND
  agency_id IN (
    SELECT agency_id FROM public.clients
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

-- RLS Policies for client_package_subscriptions

-- Agencies can manage their clients' subscriptions
CREATE POLICY "Agencies can manage client package subscriptions"
ON public.client_package_subscriptions
FOR ALL
USING (
  agency_id IN (
    SELECT id FROM public.agencies
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

-- Clients can view their own subscriptions
CREATE POLICY "Clients can view their own package subscriptions"
ON public.client_package_subscriptions
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM public.clients
    WHERE contact_email = auth.jwt() ->> 'email'
  )
);

-- RLS Policies for package_features

-- Everyone can read feature definitions
CREATE POLICY "Anyone can read package features"
ON public.package_features
FOR SELECT
USING (true);

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_service_packages_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_packages_timestamp
BEFORE UPDATE ON public.service_packages
FOR EACH ROW
EXECUTE FUNCTION update_service_packages_timestamp();

CREATE TRIGGER update_client_package_subscriptions_timestamp
BEFORE UPDATE ON public.client_package_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_service_packages_timestamp();

-- Helper function to check if a client has access to a feature
CREATE OR REPLACE FUNCTION client_has_feature(p_client_id UUID, p_feature_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.client_package_subscriptions cps
    JOIN public.service_packages sp ON cps.package_id = sp.id
    WHERE cps.client_id = p_client_id
      AND cps.status = 'active'
      AND sp.features ? p_feature_key
      AND (sp.features -> p_feature_key ->> 'enabled')::boolean = true
  ) INTO has_access;

  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get client's package usage limits
CREATE OR REPLACE FUNCTION get_client_package_limits(p_client_id UUID)
RETURNS TABLE (
  monthly_content_limit INTEGER,
  monthly_gmb_posts_limit INTEGER,
  monthly_articles_limit INTEGER,
  voice_agents_limit INTEGER,
  voice_minutes_limit INTEGER,
  storage_limit_mb INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.monthly_content_limit,
    sp.monthly_gmb_posts_limit,
    sp.monthly_articles_limit,
    sp.voice_agents_limit,
    sp.voice_minutes_limit,
    sp.storage_limit_mb
  FROM public.client_package_subscriptions cps
  JOIN public.service_packages sp ON cps.package_id = sp.id
  WHERE cps.client_id = p_client_id
    AND cps.status = 'active'
  ORDER BY sp.price_cents DESC -- Get highest tier if multiple subscriptions
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to track usage
CREATE OR REPLACE FUNCTION increment_package_usage(
  p_client_id UUID,
  p_usage_key TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.client_package_subscriptions
  SET usage_stats = jsonb_set(
    usage_stats,
    ARRAY[p_usage_key],
    to_jsonb(COALESCE((usage_stats ->> p_usage_key)::INTEGER, 0) + p_increment)
  )
  WHERE client_id = p_client_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

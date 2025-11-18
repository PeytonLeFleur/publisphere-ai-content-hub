// Service Package Types

export type BillingPeriod = 'monthly' | 'quarterly' | 'yearly' | 'one-time';

export type SubscriptionStatus = 'active' | 'paused' | 'canceled' | 'past_due' | 'trialing';

export type FeatureCategory = 'content' | 'voice' | 'automation' | 'advanced' | 'support' | 'analytics' | 'integrations';

export interface PackageFeatureConfig {
  enabled: boolean;
  [key: string]: any; // Additional feature-specific config
}

export interface PackageFeatures {
  content_generation?: {
    enabled: boolean;
    monthly_posts?: number;
    article_writing?: boolean;
    gmb_posts?: boolean;
    social_media?: boolean;
  };
  voice_agents?: {
    enabled: boolean;
    max_agents?: number;
    included_minutes?: number;
  };
  automation?: {
    enabled: boolean;
    workflows?: boolean;
    scheduling?: boolean;
  };
  support?: {
    priority?: 'standard' | 'priority' | 'dedicated';
    response_time?: string;
  };
  [key: string]: PackageFeatureConfig | undefined;
}

export interface ServicePackage {
  id: string;
  agency_id: string;
  name: string;
  description: string | null;

  // Pricing
  price_cents: number;
  setup_fee_cents: number;
  billing_period: BillingPeriod;

  // Status
  is_active: boolean;
  is_featured: boolean;

  // Features
  features: PackageFeatures;

  // Usage limits
  monthly_content_limit: number | null;
  monthly_gmb_posts_limit: number | null;
  monthly_articles_limit: number | null;
  voice_agents_limit: number | null;
  voice_minutes_limit: number | null;
  storage_limit_mb: number | null;

  // Stripe
  stripe_product_id: string | null;
  stripe_price_id: string | null;

  // Metadata
  display_order: number;
  badge_text: string | null;
  custom_metadata: Record<string, any>;

  created_at: string;
  updated_at: string;
}

export interface UsageStats {
  content_generated?: number;
  gmb_posts_created?: number;
  articles_written?: number;
  voice_minutes_used?: number;
  storage_used_mb?: number;
  [key: string]: number | undefined;
}

export interface ClientPackageSubscription {
  id: string;
  client_id: string;
  agency_id: string;
  package_id: string;

  // Status
  status: SubscriptionStatus;

  // Pricing (snapshot at subscription time)
  price_cents: number;
  setup_fee_cents: number;
  billing_period: BillingPeriod;

  // Dates
  started_at: string;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;

  // Stripe
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;

  // Usage
  usage_stats: UsageStats;

  created_at: string;
  updated_at: string;

  // Joined data
  service_packages?: ServicePackage;
  clients?: {
    business_name: string;
    contact_name: string;
    contact_email: string;
  };
}

export interface PackageFeature {
  id: string;
  feature_key: string;
  feature_name: string;
  feature_description: string | null;
  category: FeatureCategory;
  icon: string | null;
  is_core: boolean;
  display_order: number;
  created_at: string;
}

// Form types
export interface ServicePackageFormData {
  name: string;
  description: string;
  price_cents: number;
  setup_fee_cents: number;
  billing_period: BillingPeriod;
  is_active: boolean;
  is_featured: boolean;
  badge_text: string;

  // Features to enable
  enabled_features: string[]; // Array of feature_key values
  feature_configs: Record<string, any>; // Feature-specific configurations

  // Limits
  monthly_content_limit: number | null;
  monthly_gmb_posts_limit: number | null;
  monthly_articles_limit: number | null;
  voice_agents_limit: number | null;
  voice_minutes_limit: number | null;
  storage_limit_mb: number | null;
}

export interface PackageWithSubscriptionCount extends ServicePackage {
  active_subscriptions: number;
  total_revenue_cents: number;
}

// Package template presets
export interface PackageTemplate {
  name: string;
  description: string;
  suggested_price_cents: number;
  features: PackageFeatures;
  limits: {
    monthly_content_limit: number | null;
    monthly_gmb_posts_limit: number | null;
    monthly_articles_limit: number | null;
    voice_agents_limit: number | null;
    voice_minutes_limit: number | null;
    storage_limit_mb: number | null;
  };
}

export const PACKAGE_TEMPLATES: PackageTemplate[] = [
  {
    name: 'Content Starter',
    description: 'Perfect for businesses just getting started with content marketing',
    suggested_price_cents: 29900, // $299
    features: {
      content_generation: {
        enabled: true,
        monthly_posts: 20,
        article_writing: true,
        gmb_posts: true,
        social_media: true,
      },
      content_calendar: { enabled: true },
      analytics_reporting: { enabled: true },
    },
    limits: {
      monthly_content_limit: 20,
      monthly_gmb_posts_limit: 10,
      monthly_articles_limit: 5,
      voice_agents_limit: null,
      voice_minutes_limit: null,
      storage_limit_mb: 1000,
    },
  },
  {
    name: 'Content Pro',
    description: 'For growing businesses that need more content and features',
    suggested_price_cents: 49900, // $499
    features: {
      content_generation: {
        enabled: true,
        monthly_posts: 50,
        article_writing: true,
        gmb_posts: true,
        social_media: true,
      },
      content_calendar: { enabled: true },
      automation: {
        enabled: true,
        workflows: true,
        scheduling: true,
      },
      analytics_reporting: { enabled: true },
      wordpress_integration: { enabled: true },
    },
    limits: {
      monthly_content_limit: 50,
      monthly_gmb_posts_limit: 25,
      monthly_articles_limit: 15,
      voice_agents_limit: null,
      voice_minutes_limit: null,
      storage_limit_mb: 5000,
    },
  },
  {
    name: 'Voice Agent Starter',
    description: 'AI voice agent for handling customer calls',
    suggested_price_cents: 39900, // $399
    features: {
      voice_agents: {
        enabled: true,
        max_agents: 1,
        included_minutes: 1000,
      },
      call_recording: { enabled: true },
      call_analytics: { enabled: true },
    },
    limits: {
      monthly_content_limit: null,
      monthly_gmb_posts_limit: null,
      monthly_articles_limit: null,
      voice_agents_limit: 1,
      voice_minutes_limit: 1000,
      storage_limit_mb: 2000,
    },
  },
  {
    name: 'All-Inclusive',
    description: 'Everything you need: content, voice agents, and automation',
    suggested_price_cents: 79900, // $799
    features: {
      content_generation: {
        enabled: true,
        monthly_posts: 100,
        article_writing: true,
        gmb_posts: true,
        social_media: true,
      },
      voice_agents: {
        enabled: true,
        max_agents: 3,
        included_minutes: 3000,
      },
      automation: {
        enabled: true,
        workflows: true,
        scheduling: true,
      },
      content_calendar: { enabled: true },
      call_recording: { enabled: true },
      call_analytics: { enabled: true },
      analytics_reporting: { enabled: true },
      wordpress_integration: { enabled: true },
      priority_support: { enabled: true },
    },
    limits: {
      monthly_content_limit: 100,
      monthly_gmb_posts_limit: 50,
      monthly_articles_limit: 30,
      voice_agents_limit: 3,
      voice_minutes_limit: 3000,
      storage_limit_mb: 10000,
    },
  },
  {
    name: 'Enterprise',
    description: 'Unlimited everything for large organizations',
    suggested_price_cents: 149900, // $1499
    features: {
      content_generation: {
        enabled: true,
        article_writing: true,
        gmb_posts: true,
        social_media: true,
      },
      voice_agents: {
        enabled: true,
      },
      automation: {
        enabled: true,
        workflows: true,
        scheduling: true,
      },
      content_calendar: { enabled: true },
      call_recording: { enabled: true },
      call_analytics: { enabled: true },
      analytics_reporting: { enabled: true },
      wordpress_integration: { enabled: true },
      api_access: { enabled: true },
      white_label: { enabled: true },
      priority_support: { enabled: true },
      dedicated_account: { enabled: true },
    },
    limits: {
      monthly_content_limit: null, // Unlimited
      monthly_gmb_posts_limit: null,
      monthly_articles_limit: null,
      voice_agents_limit: null,
      voice_minutes_limit: null,
      storage_limit_mb: null,
    },
  },
];

// Helper to format price
export const formatPrice = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};

// Helper to format billing period
export const formatBillingPeriod = (period: BillingPeriod): string => {
  switch (period) {
    case 'monthly':
      return 'per month';
    case 'quarterly':
      return 'per quarter';
    case 'yearly':
      return 'per year';
    case 'one-time':
      return 'one-time';
    default:
      return period;
  }
};

// Helper to check if usage is over limit
export const isOverLimit = (
  usage: number | undefined,
  limit: number | null
): boolean => {
  if (limit === null) return false; // Unlimited
  if (usage === undefined) return false; // No usage yet
  return usage >= limit;
};

// Helper to calculate usage percentage
export const getUsagePercentage = (
  usage: number | undefined,
  limit: number | null
): number => {
  if (limit === null) return 0; // Unlimited
  if (usage === undefined) return 0; // No usage yet
  return Math.min((usage / limit) * 100, 100);
};

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import Stripe from "https://esm.sh/stripe@14.5.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatePlanRequest {
  name: string;
  description?: string;
  priceMonthly: number;
  currency?: string;
  billingInterval?: 'month' | 'year';
  maxPostsPerMonth?: number;
  features?: string[];
  isDefault?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      name,
      description,
      priceMonthly,
      currency = 'usd',
      billingInterval = 'month',
      maxPostsPerMonth = 50,
      features = [],
      isDefault = false,
    }: CreatePlanRequest = await req.json();

    if (!name || !priceMonthly) {
      throw new Error('Name and price are required');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get agency from auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const { data: agency, error: agencyError } = await supabaseClient
      .from('agencies')
      .select('*')
      .eq('contact_email', user.email)
      .single();

    if (agencyError || !agency) throw new Error('Agency not found');

    if (!agency.stripe_account_id || !agency.stripe_onboarding_completed) {
      throw new Error('Please complete Stripe Connect onboarding first');
    }

    // Create Stripe product
    const product = await stripe.products.create(
      {
        name: `${agency.name} - ${name}`,
        description: description || `${name} subscription plan`,
        metadata: {
          agency_id: agency.id,
          plan_name: name,
        },
      },
      {
        stripeAccount: agency.stripe_account_id,
      }
    );

    // Create Stripe price
    const price = await stripe.prices.create(
      {
        product: product.id,
        unit_amount: Math.round(priceMonthly * 100), // Convert to cents
        currency: currency.toLowerCase(),
        recurring: {
          interval: billingInterval,
        },
        metadata: {
          agency_id: agency.id,
          plan_name: name,
        },
      },
      {
        stripeAccount: agency.stripe_account_id,
      }
    );

    // If this is the default plan, unset other defaults
    if (isDefault) {
      await supabaseClient
        .from('subscription_plans')
        .update({ is_default: false })
        .eq('agency_id', agency.id);
    }

    // Save plan to database
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .insert({
        agency_id: agency.id,
        name,
        description,
        price_monthly: priceMonthly,
        currency,
        billing_interval: billingInterval,
        max_posts_per_month: maxPostsPerMonth,
        features,
        stripe_price_id: price.id,
        stripe_product_id: product.id,
        is_active: true,
        is_default: isDefault,
      })
      .select()
      .single();

    if (planError) {
      // Cleanup Stripe product if DB insert fails
      await stripe.products.del(product.id, {
        stripeAccount: agency.stripe_account_id,
      });
      throw planError;
    }

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        agency_id: agency.id,
        action_type: 'subscription_plan_created',
        description: `Created subscription plan: ${name} ($${priceMonthly}/${billingInterval})`,
      });

    return new Response(
      JSON.stringify({
        success: true,
        plan,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      }
    );

  } catch (error: any) {
    console.error('Create plan error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

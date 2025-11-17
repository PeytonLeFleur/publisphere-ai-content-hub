import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import Stripe from "https://esm.sh/stripe@14.5.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSubscriptionRequest {
  clientId: string;
  planId: string;
  trialDays?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      clientId,
      planId,
      trialDays = 0,
    }: CreateSubscriptionRequest = await req.json();

    if (!clientId || !planId) {
      throw new Error('Client ID and Plan ID are required');
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

    if (!agency.stripe_account_id) {
      throw new Error('Stripe account not connected');
    }

    // Get client
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('agency_id', agency.id)
      .single();

    if (clientError || !client) throw new Error('Client not found');

    // Get subscription plan
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('agency_id', agency.id)
      .single();

    if (planError || !plan) throw new Error('Plan not found');

    if (!plan.stripe_price_id) {
      throw new Error('Plan does not have Stripe price configured');
    }

    // Check if client already has a subscription
    const { data: existingSubscription } = await supabaseClient
      .from('client_subscriptions')
      .select('*')
      .eq('client_id', clientId)
      .in('status', ['active', 'trialing', 'past_due'])
      .maybeSingle();

    if (existingSubscription) {
      throw new Error('Client already has an active subscription');
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = client.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create(
        {
          email: client.email,
          name: client.business_name || client.name,
          metadata: {
            client_id: client.id,
            agency_id: agency.id,
          },
        },
        {
          stripeAccount: agency.stripe_account_id,
        }
      );

      stripeCustomerId = customer.id;

      // Update client with Stripe customer ID
      await supabaseClient
        .from('clients')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', clientId);
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create(
      {
        customer: stripeCustomerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.stripe_price_id,
            quantity: 1,
          },
        ],
        subscription_data: {
          trial_period_days: trialDays > 0 ? trialDays : undefined,
          metadata: {
            client_id: clientId,
            agency_id: agency.id,
            plan_id: planId,
          },
        },
        success_url: `${Deno.env.get('APP_URL')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${Deno.env.get('APP_URL')}/subscription/canceled`,
        metadata: {
          client_id: clientId,
          agency_id: agency.id,
          plan_id: planId,
        },
      },
      {
        stripeAccount: agency.stripe_account_id,
      }
    );

    // Create pending subscription record
    const { data: subscription, error: subscriptionError } = await supabaseClient
      .from('client_subscriptions')
      .insert({
        client_id: clientId,
        agency_id: agency.id,
        plan_id: planId,
        stripe_customer_id: stripeCustomerId,
        status: 'pending',
        price_monthly: plan.price_monthly,
        currency: plan.currency,
        billing_interval: plan.billing_interval,
        posts_limit: plan.max_posts_per_month,
      })
      .select()
      .single();

    if (subscriptionError) throw subscriptionError;

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        agency_id: agency.id,
        client_id: clientId,
        action_type: 'subscription_initiated',
        description: `Initiated subscription for ${client.business_name || client.name} - ${plan.name}`,
      });

    return new Response(
      JSON.stringify({
        success: true,
        checkout_url: session.url,
        subscription_id: subscription.id,
        session_id: session.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Create subscription error:', error);
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

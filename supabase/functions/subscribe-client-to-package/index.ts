import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const {
      client_id,
      package_id,
      create_stripe_subscription = true,
      trial_days = 0,
    } = await req.json();

    if (!client_id || !package_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: client_id, package_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get agency
    const { data: agency, error: agencyError } = await supabaseClient
      .from('agencies')
      .select('id, stripe_account_id')
      .eq('contact_email', user.email)
      .single();

    if (agencyError || !agency) {
      return new Response(
        JSON.stringify({ error: 'Agency not found for user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify client belongs to agency
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('*')
      .eq('id', client_id)
      .eq('agency_id', agency.id)
      .single();

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ error: 'Client not found or does not belong to your agency' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get package details
    const { data: servicePackage, error: packageError } = await supabaseClient
      .from('service_packages')
      .select('*')
      .eq('id', package_id)
      .eq('agency_id', agency.id)
      .single();

    if (packageError || !servicePackage) {
      return new Response(
        JSON.stringify({ error: 'Package not found or does not belong to your agency' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if client already has an active subscription to this package
    const { data: existingSub } = await supabaseClient
      .from('client_package_subscriptions')
      .select('id, status')
      .eq('client_id', client_id)
      .eq('package_id', package_id)
      .eq('status', 'active')
      .single();

    if (existingSub) {
      return new Response(
        JSON.stringify({ error: 'Client already has an active subscription to this package' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const trialEndsAt = trial_days > 0 ? new Date(now.getTime() + trial_days * 24 * 60 * 60 * 1000) : null;

    // Create subscription record
    const subscriptionData: any = {
      client_id,
      agency_id: agency.id,
      package_id,
      status: trial_days > 0 ? 'trialing' : 'active',
      price_cents: servicePackage.price_cents,
      setup_fee_cents: servicePackage.setup_fee_cents,
      billing_period: servicePackage.billing_period,
      started_at: now.toISOString(),
      trial_ends_at: trialEndsAt?.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      usage_stats: {},
    };

    // Create Stripe subscription if enabled
    if (create_stripe_subscription && servicePackage.stripe_price_id) {
      try {
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (stripeKey) {
          // Get or create Stripe customer for client
          let stripeCustomerId = client.stripe_customer_id;

          if (!stripeCustomerId) {
            const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${stripeKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                email: client.contact_email,
                name: client.business_name,
                metadata: JSON.stringify({
                  client_id: client.id,
                  agency_id: agency.id,
                }),
              }).toString(),
            });

            if (customerResponse.ok) {
              const customer = await customerResponse.json();
              stripeCustomerId = customer.id;

              // Update client with Stripe customer ID
              await supabaseClient
                .from('clients')
                .update({ stripe_customer_id: stripeCustomerId })
                .eq('id', client_id);
            }
          }

          if (stripeCustomerId) {
            // Create Stripe subscription
            const subscriptionParams = new URLSearchParams({
              customer: stripeCustomerId,
              'items[0][price]': servicePackage.stripe_price_id,
              metadata: JSON.stringify({
                client_id,
                agency_id: agency.id,
                package_id,
              }),
            });

            if (trial_days > 0) {
              subscriptionParams.append('trial_period_days', trial_days.toString());
            }

            const subscriptionResponse = await fetch('https://api.stripe.com/v1/subscriptions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${stripeKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: subscriptionParams.toString(),
            });

            if (subscriptionResponse.ok) {
              const subscription = await subscriptionResponse.json();
              subscriptionData.stripe_subscription_id = subscription.id;
              subscriptionData.stripe_customer_id = stripeCustomerId;
              subscriptionData.current_period_start = new Date(subscription.current_period_start * 1000).toISOString();
              subscriptionData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
            }
          }
        }
      } catch (stripeError) {
        console.error('Error creating Stripe subscription:', stripeError);
        // Continue anyway - subscription can be set up manually later
      }
    }

    // Insert subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from('client_package_subscriptions')
      .insert(subscriptionData)
      .select(`
        *,
        service_packages (
          name,
          description,
          features
        ),
        clients (
          business_name,
          contact_name
        )
      `)
      .single();

    if (subError) {
      console.error('Error creating subscription:', subError);
      return new Response(
        JSON.stringify({ error: 'Failed to create subscription', details: subError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Client subscribed to package successfully',
        subscription,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in subscribe-client-to-package:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

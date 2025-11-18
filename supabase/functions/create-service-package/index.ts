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
      name,
      description,
      price_cents,
      setup_fee_cents = 0,
      billing_period = 'monthly',
      is_active = true,
      is_featured = false,
      badge_text,
      enabled_features = [],
      feature_configs = {},
      monthly_content_limit,
      monthly_gmb_posts_limit,
      monthly_articles_limit,
      voice_agents_limit,
      voice_minutes_limit,
      storage_limit_mb,
      create_stripe_product = true,
    } = await req.json();

    // Validate required fields
    if (!name || price_cents === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, price_cents' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get agency
    const { data: agency, error: agencyError } = await supabaseClient
      .from('agencies')
      .select('id')
      .eq('contact_email', user.email)
      .single();

    if (agencyError || !agency) {
      return new Response(
        JSON.stringify({ error: 'Agency not found for user' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build features object
    const features: Record<string, any> = {};
    enabled_features.forEach((featureKey: string) => {
      features[featureKey] = {
        enabled: true,
        ...(feature_configs[featureKey] || {}),
      };
    });

    // Create package
    const { data: servicePackage, error: createError } = await supabaseClient
      .from('service_packages')
      .insert({
        agency_id: agency.id,
        name,
        description,
        price_cents,
        setup_fee_cents,
        billing_period,
        is_active,
        is_featured,
        badge_text,
        features,
        monthly_content_limit,
        monthly_gmb_posts_limit,
        monthly_articles_limit,
        voice_agents_limit,
        voice_minutes_limit,
        storage_limit_mb,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating service package:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create package', details: createError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optionally create Stripe product and price
    let stripeProductId = null;
    let stripePriceId = null;

    if (create_stripe_product) {
      try {
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (stripeKey) {
          // Create Stripe Product
          const productResponse = await fetch('https://api.stripe.com/v1/products', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${stripeKey}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              name,
              description: description || '',
              metadata: JSON.stringify({
                agency_id: agency.id,
                package_id: servicePackage.id,
              }),
            }).toString(),
          });

          if (productResponse.ok) {
            const product = await productResponse.json();
            stripeProductId = product.id;

            // Create Stripe Price
            const priceParams = new URLSearchParams({
              product: stripeProductId,
              unit_amount: price_cents.toString(),
              currency: 'usd',
            });

            // Add recurring interval if not one-time
            if (billing_period !== 'one-time') {
              priceParams.append('recurring[interval]', billing_period === 'yearly' ? 'year' : 'month');
              if (billing_period === 'quarterly') {
                priceParams.append('recurring[interval]', 'month');
                priceParams.append('recurring[interval_count]', '3');
              }
            }

            const priceResponse = await fetch('https://api.stripe.com/v1/prices', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${stripeKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: priceParams.toString(),
            });

            if (priceResponse.ok) {
              const price = await priceResponse.json();
              stripePriceId = price.id;

              // Update package with Stripe IDs
              await supabaseClient
                .from('service_packages')
                .update({
                  stripe_product_id: stripeProductId,
                  stripe_price_id: stripePriceId,
                })
                .eq('id', servicePackage.id);
            }
          }
        }
      } catch (stripeError) {
        console.error('Error creating Stripe product:', stripeError);
        // Continue anyway - package is created, Stripe can be set up later
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Service package created successfully',
        package: {
          ...servicePackage,
          stripe_product_id: stripeProductId,
          stripe_price_id: stripePriceId,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-service-package:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

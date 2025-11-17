import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import Stripe from "https://esm.sh/stripe@14.5.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get agency from auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get agency record
    const { data: agency, error: agencyError } = await supabaseClient
      .from('agencies')
      .select('*')
      .eq('contact_email', user.email)
      .single();

    if (agencyError || !agency) {
      throw new Error('Agency not found');
    }

    // Check if agency already has Stripe account
    if (agency.stripe_account_id && agency.stripe_onboarding_completed) {
      // Return account link for updating details
      const accountLink = await stripe.accountLinks.create({
        account: agency.stripe_account_id,
        refresh_url: `${Deno.env.get('APP_URL')}/agency/billing?refresh=true`,
        return_url: `${Deno.env.get('APP_URL')}/agency/billing?success=true`,
        type: 'account_update',
      });

      return new Response(
        JSON.stringify({
          success: true,
          url: accountLink.url,
          account_id: agency.stripe_account_id,
          already_connected: true,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    let stripeAccountId = agency.stripe_account_id;

    // Create new Stripe Connect account if needed
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'standard',
        email: agency.billing_email || agency.contact_email,
        business_type: 'company',
        metadata: {
          agency_id: agency.id,
          agency_name: agency.name,
        },
      });

      stripeAccountId = account.id;

      // Save Stripe account ID
      await supabaseClient
        .from('agencies')
        .update({
          stripe_account_id: stripeAccountId,
          stripe_account_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', agency.id);
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${Deno.env.get('APP_URL')}/agency/billing?refresh=true`,
      return_url: `${Deno.env.get('APP_URL')}/agency/billing?success=true`,
      type: 'account_onboarding',
    });

    return new Response(
      JSON.stringify({
        success: true,
        url: accountLink.url,
        account_id: stripeAccountId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Stripe Connect error:', error);
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SignupRequest {
  agencyName: string;
  contactEmail: string;
  password: string;
  subdomain: string;
  promoCode?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agencyName, contactEmail, password, subdomain, promoCode }: SignupRequest = await req.json();

    // Validate input
    if (!agencyName || !contactEmail || !password || !subdomain) {
      throw new Error('Missing required fields');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Validate promo code if provided
    let promoValidation: any = null;
    let paymentStatus = 'pending';

    if (promoCode) {
      const { data: promoData, error: promoError } = await supabaseClient
        .rpc('validate_promo_code', { promo_code_input: promoCode });

      if (promoError) {
        console.error('Promo validation error:', promoError);
        throw new Error('Failed to validate promo code');
      }

      if (promoData && promoData.length > 0) {
        promoValidation = promoData[0];

        if (!promoValidation.is_valid) {
          throw new Error(promoValidation.message || 'Invalid promo code');
        }

        // Set payment status based on promo type
        if (promoValidation.discount_type === 'free') {
          paymentStatus = 'free';
        }
      } else {
        throw new Error('Invalid promo code');
      }
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    if (subdomain.length < 3) {
      throw new Error('Subdomain must be at least 3 characters');
    }

    // Validate subdomain format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      throw new Error('Subdomain can only contain lowercase letters, numbers, and hyphens');
    }

    // Reserved subdomains
    const reserved = ['www', 'app', 'api', 'admin', 'dashboard', 'support', 'help', 'docs', 'blog'];
    if (reserved.includes(subdomain)) {
      throw new Error('This subdomain is reserved');
    }

    // Check if subdomain already exists
    const { data: existingAgency } = await supabaseClient
      .from('agencies')
      .select('id')
      .eq('subdomain', subdomain.toLowerCase())
      .maybeSingle();

    if (existingAgency) {
      throw new Error('This subdomain is already taken');
    }

    // Check if email already exists
    const { data: existingEmail } = await supabaseClient
      .from('agencies')
      .select('id')
      .eq('contact_email', contactEmail.toLowerCase())
      .maybeSingle();

    if (existingEmail) {
      throw new Error('An agency with this email already exists');
    }

    // Create Supabase Auth user for the agency
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email: contactEmail.toLowerCase(),
      password: password,
      email_confirm: true, // Auto-confirm for now (add email verification later)
      user_metadata: {
        role: 'agency',
        agency_name: agencyName,
        subdomain: subdomain.toLowerCase(),
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      if (authError.message.includes('already registered')) {
        throw new Error('This email is already registered');
      }
      throw new Error(`Failed to create account: ${authError.message}`);
    }

    if (!authUser.user) {
      throw new Error('Failed to create user');
    }

    // Create agency record
    const { data: agency, error: agencyError } = await supabaseClient
      .from('agencies')
      .insert({
        name: agencyName,
        contact_email: contactEmail.toLowerCase(),
        subdomain: subdomain.toLowerCase(),
        primary_color: '#333333',
        secondary_color: '#595959',
        max_clients: 25,
        plan_type: 'lifetime',
        purchase_date: paymentStatus === 'free' ? new Date().toISOString() : null,
        onboarding_completed: false,
        promo_code_used: promoCode ? promoCode.toUpperCase() : null,
        payment_status: paymentStatus,
      })
      .select()
      .single();

    if (agencyError) {
      console.error('Agency creation error:', agencyError);
      // Cleanup: delete auth user if agency creation failed
      await supabaseClient.auth.admin.deleteUser(authUser.user.id);
      throw new Error('Failed to create agency record');
    }

    // Increment promo code usage if valid promo was used
    if (promoCode && promoValidation?.is_valid) {
      await supabaseClient.rpc('increment_promo_usage', {
        promo_code_input: promoCode
      });
    }

    // Create activity log
    await supabaseClient
      .from('activity_logs')
      .insert({
        agency_id: agency.id,
        action_type: 'agency_signup',
        description: `Agency "${agencyName}" signed up${promoCode ? ` with promo code ${promoCode.toUpperCase()}` : ''}`,
      });

    console.log('Agency created successfully:', agency.id);

    // Create a session for the new user
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: contactEmail.toLowerCase(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Agency account created successfully',
        agency: {
          id: agency.id,
          name: agency.name,
          subdomain: agency.subdomain,
          payment_status: paymentStatus,
        },
        user: {
          id: authUser.user.id,
          email: authUser.user.email,
        },
        promo: promoValidation ? {
          code: promoCode?.toUpperCase(),
          type: promoValidation.discount_type,
          value: promoValidation.discount_value,
        } : null,
        requiresPayment: paymentStatus !== 'free',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      }
    );

  } catch (error: any) {
    console.error('Agency signup error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred during signup',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

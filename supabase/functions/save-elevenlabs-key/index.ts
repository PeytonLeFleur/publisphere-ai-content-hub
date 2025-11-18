import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encrypt } from "../_shared/encryption.ts";

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
    const { api_key } = await req.json();

    if (!api_key) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: api_key' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate ElevenLabs API key format (starts with sk_ or similar)
    if (!api_key || api_key.length < 20) {
      return new Response(
        JSON.stringify({ error: 'Invalid ElevenLabs API key format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get agency for this user
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

    // Verify credentials with ElevenLabs API
    const verifyResponse = await fetch(
      'https://api.elevenlabs.io/v1/user',
      {
        method: 'GET',
        headers: {
          'xi-api-key': api_key,
        },
      }
    );

    if (!verifyResponse.ok) {
      return new Response(
        JSON.stringify({
          error: 'Invalid ElevenLabs API key. Please check your credentials.',
          is_verified: false
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user info for confirmation
    const elevenLabsUser = await verifyResponse.json();

    // Encrypt the API key
    const {
      encrypted: encryptedApiKey,
      iv,
      authTag
    } = await encrypt(api_key);

    // Upsert credentials (update if exists, insert if not)
    const { data: credentials, error: saveError } = await supabaseClient
      .from('elevenlabs_credentials')
      .upsert({
        agency_id: agency.id,
        encrypted_api_key: encryptedApiKey,
        iv,
        auth_tag: authTag,
        is_verified: true,
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'agency_id'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving ElevenLabs credentials:', saveError);
      return new Response(
        JSON.stringify({ error: 'Failed to save credentials', details: saveError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'ElevenLabs API key saved and verified successfully',
        is_verified: true,
        user_info: {
          subscription: elevenLabsUser.subscription?.tier || 'free',
          character_count: elevenLabsUser.subscription?.character_count || 0,
          character_limit: elevenLabsUser.subscription?.character_limit || 10000,
        },
        credentials: {
          id: credentials.id,
          is_verified: credentials.is_verified,
          last_verified_at: credentials.last_verified_at,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in save-elevenlabs-key:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

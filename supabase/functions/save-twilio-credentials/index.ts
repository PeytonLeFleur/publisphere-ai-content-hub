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
    const { account_sid, auth_token } = await req.json();

    if (!account_sid || !auth_token) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: account_sid, auth_token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate Twilio Account SID format
    if (!account_sid.startsWith('AC') || account_sid.length !== 34) {
      return new Response(
        JSON.stringify({ error: 'Invalid Twilio Account SID format. Should start with "AC" and be 34 characters.' }),
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

    // Verify credentials with Twilio API
    const twilioAuth = btoa(`${account_sid}:${auth_token}`);
    const verifyResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${account_sid}.json`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${twilioAuth}`,
        },
      }
    );

    if (!verifyResponse.ok) {
      return new Response(
        JSON.stringify({
          error: 'Invalid Twilio credentials. Please check your Account SID and Auth Token.',
          is_verified: false
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Encrypt the credentials
    const {
      encrypted: encryptedAccountSid,
      iv: ivAccountSid,
      authTag: authTagAccountSid
    } = await encrypt(account_sid);

    const {
      encrypted: encryptedAuthToken,
      iv: ivAuthToken,
      authTag: authTagAuthToken
    } = await encrypt(auth_token);

    // Store both encrypted values with the SAME iv and auth_tag structure
    // We'll combine them into single storage fields for simplicity
    const combinedIv = JSON.stringify({ account_sid: ivAccountSid, auth_token: ivAuthToken });
    const combinedAuthTag = JSON.stringify({ account_sid: authTagAccountSid, auth_token: authTagAuthToken });

    // Upsert credentials (update if exists, insert if not)
    const { data: credentials, error: saveError } = await supabaseClient
      .from('twilio_credentials')
      .upsert({
        agency_id: agency.id,
        encrypted_account_sid: encryptedAccountSid,
        encrypted_auth_token: encryptedAuthToken,
        iv: combinedIv,
        auth_tag: combinedAuthTag,
        is_verified: true,
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'agency_id'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving Twilio credentials:', saveError);
      return new Response(
        JSON.stringify({ error: 'Failed to save credentials', details: saveError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Twilio credentials saved and verified successfully',
        is_verified: true,
        credentials: {
          id: credentials.id,
          is_verified: credentials.is_verified,
          last_verified_at: credentials.last_verified_at,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in save-twilio-credentials:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decrypt } from "../_shared/encryption.ts";

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
    const { area_code, country_code = 'US', client_id, friendly_name } = await req.json();

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

    // Get Twilio credentials
    const { data: twilioCredsData, error: twilioCredsError } = await supabaseClient
      .from('twilio_credentials')
      .select('*')
      .eq('agency_id', agency.id)
      .single();

    if (twilioCredsError || !twilioCredsData || !twilioCredsData.is_verified) {
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not found or not verified. Please configure your Twilio credentials first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt Twilio credentials
    const ivData = JSON.parse(twilioCredsData.iv);
    const authTagData = JSON.parse(twilioCredsData.auth_tag);

    const accountSid = await decrypt(
      twilioCredsData.encrypted_account_sid,
      ivData.account_sid,
      authTagData.account_sid
    );

    const authToken = await decrypt(
      twilioCredsData.encrypted_auth_token,
      ivData.auth_token,
      authTagData.auth_token
    );

    const twilioAuth = btoa(`${accountSid}:${authToken}`);

    // Step 1: Search for available phone numbers
    let searchUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/AvailablePhoneNumbers/${country_code}/Local.json?`;

    if (area_code) {
      searchUrl += `AreaCode=${area_code}&`;
    }

    searchUrl += 'VoiceEnabled=true&Limit=1';

    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${twilioAuth}`,
      },
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      return new Response(
        JSON.stringify({ error: 'Failed to search for available phone numbers', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchResults = await searchResponse.json();

    if (!searchResults.available_phone_numbers || searchResults.available_phone_numbers.length === 0) {
      return new Response(
        JSON.stringify({ error: `No available phone numbers found${area_code ? ` for area code ${area_code}` : ''}. Try a different area code.` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const availableNumber = searchResults.available_phone_numbers[0];
    const phoneNumber = availableNumber.phone_number;

    // Step 2: Purchase the phone number
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/twilio-webhook`;
    const statusCallbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/twilio-status-callback`;

    const purchaseParams = new URLSearchParams({
      PhoneNumber: phoneNumber,
      VoiceUrl: webhookUrl,
      VoiceMethod: 'POST',
      StatusCallback: statusCallbackUrl,
      StatusCallbackMethod: 'POST',
      FriendlyName: friendly_name || `Voice Agent - ${phoneNumber}`,
    });

    const purchaseResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${twilioAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: purchaseParams.toString(),
      }
    );

    if (!purchaseResponse.ok) {
      const errorText = await purchaseResponse.text();
      return new Response(
        JSON.stringify({ error: 'Failed to purchase phone number', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const purchasedNumber = await purchaseResponse.json();

    // Step 3: Save to database
    const { data: savedNumber, error: saveError } = await supabaseClient
      .from('voice_agent_phone_numbers')
      .insert({
        agency_id: agency.id,
        client_id: client_id || null,
        phone_number: purchasedNumber.phone_number,
        twilio_sid: purchasedNumber.sid,
        friendly_name: purchasedNumber.friendly_name,
        status: 'active',
        monthly_cost_cents: 115, // $1.15/month standard Twilio cost
        purchase_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving phone number to database:', saveError);
      // Note: The number WAS purchased, but we failed to save it to DB
      // Agency should be notified to manually reconcile
      return new Response(
        JSON.stringify({
          error: 'Phone number purchased but failed to save to database',
          purchased_number: purchasedNumber.phone_number,
          twilio_sid: purchasedNumber.sid,
          details: saveError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Phone number provisioned successfully',
        phone_number: savedNumber,
        cost_info: {
          monthly_cost: '$1.15',
          one_time_purchase: '$0.00'
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in provision-phone-number:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

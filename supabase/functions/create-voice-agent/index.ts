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
      phone_number_id,
      name,
      system_prompt,
      first_message = 'Hello! How can I help you today?',
      voice_id,
      voice_name,
      transfer_phone_number,
      recording_enabled = true,
      transcription_enabled = true,
      max_duration_seconds = 600,
      use_knowledge_base = true,
      settings = {}
    } = await req.json();

    // Validate required fields
    if (!client_id || !name || !system_prompt || !voice_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: client_id, name, system_prompt, voice_id' }),
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

    // Verify client belongs to agency
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('id, business_name')
      .eq('id', client_id)
      .eq('agency_id', agency.id)
      .single();

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ error: 'Client not found or does not belong to your agency' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If phone_number_id provided, verify it's available and belongs to agency
    if (phone_number_id) {
      const { data: phoneNumber, error: phoneError } = await supabaseClient
        .from('voice_agent_phone_numbers')
        .select('id, phone_number, client_id')
        .eq('id', phone_number_id)
        .eq('agency_id', agency.id)
        .single();

      if (phoneError || !phoneNumber) {
        return new Response(
          JSON.stringify({ error: 'Phone number not found or does not belong to your agency' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if phone number is already assigned to another voice agent
      const { data: existingAgent } = await supabaseClient
        .from('voice_agents')
        .select('id, name')
        .eq('phone_number_id', phone_number_id)
        .neq('status', 'deleted')
        .single();

      if (existingAgent) {
        return new Response(
          JSON.stringify({
            error: `Phone number is already assigned to voice agent "${existingAgent.name}". Please choose a different phone number or remove it from the existing agent first.`
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update phone number to link it to this client
      await supabaseClient
        .from('voice_agent_phone_numbers')
        .update({ client_id: client_id })
        .eq('id', phone_number_id);
    }

    // Get knowledge base context if enabled
    let knowledgeBaseContext = null;
    if (use_knowledge_base) {
      const { data: contextData, error: contextError } = await supabaseClient
        .rpc('get_client_knowledge_base_context', {
          p_client_id: client_id,
          p_max_chunks: 20
        });

      if (!contextError && contextData) {
        knowledgeBaseContext = contextData;
      }
    }

    // Create voice agent
    const { data: voiceAgent, error: createError } = await supabaseClient
      .from('voice_agents')
      .insert({
        client_id,
        agency_id: agency.id,
        phone_number_id: phone_number_id || null,
        name,
        status: 'active',
        system_prompt,
        first_message,
        voice_id,
        voice_name: voice_name || null,
        transfer_phone_number: transfer_phone_number || null,
        recording_enabled,
        transcription_enabled,
        max_duration_seconds,
        use_knowledge_base,
        knowledge_base_context: knowledgeBaseContext,
        settings,
        total_calls: 0,
        total_minutes: 0,
      })
      .select(`
        *,
        clients (
          business_name,
          contact_name
        ),
        voice_agent_phone_numbers (
          phone_number,
          friendly_name
        )
      `)
      .single();

    if (createError) {
      console.error('Error creating voice agent:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create voice agent', details: createError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Voice agent created successfully',
        voice_agent: voiceAgent,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-voice-agent:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

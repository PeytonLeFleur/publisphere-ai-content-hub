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
    const { voice_agent_id } = await req.json();

    if (!voice_agent_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: voice_agent_id' }),
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

    // Get voice agent to verify ownership
    const { data: voiceAgent, error: agentError } = await supabaseClient
      .from('voice_agents')
      .select('id, name, phone_number_id, agency_id')
      .eq('id', voice_agent_id)
      .eq('agency_id', agency.id)
      .single();

    if (agentError || !voiceAgent) {
      return new Response(
        JSON.stringify({ error: 'Voice agent not found or does not belong to your agency' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perform soft delete (set status to 'deleted')
    const { error: deleteError } = await supabaseClient
      .from('voice_agents')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', voice_agent_id);

    if (deleteError) {
      console.error('Error deleting voice agent:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete voice agent', details: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optionally unlink phone number (set client_id to null)
    if (voiceAgent.phone_number_id) {
      await supabaseClient
        .from('voice_agent_phone_numbers')
        .update({ client_id: null })
        .eq('id', voiceAgent.phone_number_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Voice agent "${voiceAgent.name}" deleted successfully`,
        note: 'Call history has been preserved. Phone number has been unlinked and is available for reuse.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-voice-agent:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

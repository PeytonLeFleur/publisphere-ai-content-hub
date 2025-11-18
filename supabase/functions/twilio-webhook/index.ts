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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Service role for webhook access
    );

    // Parse Twilio webhook payload (x-www-form-urlencoded)
    const formData = await req.formData();
    const CallSid = formData.get('CallSid') as string;
    const From = formData.get('From') as string;
    const To = formData.get('To') as string;
    const CallStatus = formData.get('CallStatus') as string;
    const Direction = formData.get('Direction') as string;

    console.log(`Twilio webhook: CallSid=${CallSid}, From=${From}, To=${To}, Status=${CallStatus}`);

    if (!CallSid || !From || !To) {
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Invalid call parameters</Say></Response>',
        {
          status: 400,
          headers: { 'Content-Type': 'text/xml' }
        }
      );
    }

    // Find voice agent by phone number
    const { data: phoneNumber, error: phoneError } = await supabaseClient
      .from('voice_agent_phone_numbers')
      .select(`
        *,
        voice_agents!inner (
          *,
          clients (
            business_name
          )
        )
      `)
      .eq('phone_number', To)
      .eq('status', 'active')
      .single();

    if (phoneError || !phoneNumber || !phoneNumber.voice_agents || phoneNumber.voice_agents.length === 0) {
      console.error('No active voice agent found for phone number:', To);
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>This number is not configured for voice services</Say></Response>',
        {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        }
      );
    }

    // Get the active voice agent (there should only be one per phone number)
    const voiceAgent = Array.isArray(phoneNumber.voice_agents)
      ? phoneNumber.voice_agents.find((agent: any) => agent.status === 'active')
      : phoneNumber.voice_agents;

    if (!voiceAgent) {
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>No active agent configured</Say></Response>',
        {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        }
      );
    }

    // Get ElevenLabs credentials for the agency
    const { data: elevenLabsCredsData, error: elevenLabsError } = await supabaseClient
      .from('elevenlabs_credentials')
      .select('*')
      .eq('agency_id', voiceAgent.agency_id)
      .single();

    if (elevenLabsError || !elevenLabsCredsData || !elevenLabsCredsData.is_verified) {
      console.error('ElevenLabs credentials not found or not verified');
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Voice service is not configured. Please contact support.</Say></Response>',
        {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        }
      );
    }

    // Decrypt ElevenLabs API key
    const elevenLabsApiKey = await decrypt(
      elevenLabsCredsData.encrypted_api_key,
      elevenLabsCredsData.iv,
      elevenLabsCredsData.auth_tag
    );

    // Get knowledge base context if enabled
    let knowledgeContext = voiceAgent.knowledge_base_context;
    if (voiceAgent.use_knowledge_base && !knowledgeContext) {
      const { data: contextData } = await supabaseClient
        .rpc('get_client_knowledge_base_context', {
          p_client_id: voiceAgent.client_id,
          p_max_chunks: 20
        });
      knowledgeContext = contextData || '';
    }

    // Build enhanced system prompt with knowledge base
    let enhancedPrompt = voiceAgent.system_prompt;
    if (knowledgeContext && knowledgeContext.trim().length > 0) {
      enhancedPrompt = `${voiceAgent.system_prompt}\n\n## KNOWLEDGE BASE\nUse this information to answer questions:\n\n${knowledgeContext}`;
    }

    // Create ElevenLabs Conversational AI session
    const elevenLabsConfig = {
      agent: {
        prompt: {
          prompt: enhancedPrompt,
          llm: "gpt-4o",
          temperature: 0.7,
          max_tokens: 500,
        },
        first_message: voiceAgent.first_message,
        language: "en",
      },
      tts: {
        voice_id: voiceAgent.voice_id,
        model_id: "eleven_turbo_v2",
        optimize_streaming_latency: 3,
      },
      conversation_config: {
        max_duration_seconds: voiceAgent.max_duration_seconds,
      }
    };

    // Create ElevenLabs conversation session
    const elevenLabsResponse = await fetch(
      'https://api.elevenlabs.io/v1/convai/conversation',
      {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(elevenLabsConfig),
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('ElevenLabs API error:', errorText);
      return new Response(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Say>Unable to start voice service. Please try again later.</Say></Response>',
        {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        }
      );
    }

    const elevenLabsSession = await elevenLabsResponse.json();
    const conversationId = elevenLabsSession.conversation_id;

    // Create call record in database
    const { data: callRecord, error: callError } = await supabaseClient
      .from('voice_calls')
      .insert({
        voice_agent_id: voiceAgent.id,
        client_id: voiceAgent.client_id,
        agency_id: voiceAgent.agency_id,
        twilio_call_sid: CallSid,
        from_number: From,
        to_number: To,
        status: CallStatus,
        direction: Direction,
        started_at: new Date().toISOString(),
        transcript: [],
        metadata: {
          elevenlabs_conversation_id: conversationId,
          voice_id: voiceAgent.voice_id,
          voice_name: voiceAgent.voice_name,
        }
      })
      .select()
      .single();

    if (callError) {
      console.error('Error creating call record:', callError);
    }

    // Get WebSocket URL for ElevenLabs streaming
    const websocketUrl = `wss://api.elevenlabs.io/v1/convai/conversation?conversation_id=${conversationId}`;

    // Build TwiML response with WebSocket stream
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${websocketUrl}">
      <Parameter name="xi-api-key" value="${elevenLabsApiKey}" />
    </Stream>
  </Connect>
  ${voiceAgent.recording_enabled ? '<Record maxLength="' + voiceAgent.max_duration_seconds + '" transcribe="' + (voiceAgent.transcription_enabled ? 'true' : 'false') + '" />' : ''}
</Response>`;

    console.log('TwiML Response:', twiml);

    return new Response(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' }
    });

  } catch (error) {
    console.error('Error in twilio-webhook:', error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Say>An error occurred. Please try again later.</Say></Response>',
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      }
    );
  }
});

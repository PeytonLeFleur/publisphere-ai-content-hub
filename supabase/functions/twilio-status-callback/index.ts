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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Parse Twilio status callback payload
    const formData = await req.formData();
    const CallSid = formData.get('CallSid') as string;
    const CallStatus = formData.get('CallStatus') as string;
    const CallDuration = formData.get('CallDuration') as string;
    const RecordingUrl = formData.get('RecordingUrl') as string | null;
    const RecordingDuration = formData.get('RecordingDuration') as string | null;
    const TranscriptionText = formData.get('TranscriptionText') as string | null;

    console.log(`Twilio status callback: CallSid=${CallSid}, Status=${CallStatus}, Duration=${CallDuration}`);

    if (!CallSid) {
      return new Response(
        JSON.stringify({ error: 'Missing CallSid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get call record
    const { data: call, error: callError } = await supabaseClient
      .from('voice_calls')
      .select('*, voice_agents(*)')
      .eq('twilio_call_sid', CallSid)
      .single();

    if (callError || !call) {
      console.error('Call record not found:', CallSid);
      return new Response(
        JSON.stringify({ error: 'Call record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const durationSeconds = parseInt(CallDuration || '0');
    const recordingDurationSeconds = parseInt(RecordingDuration || '0');

    // Calculate costs
    // Twilio: ~$0.013/min for voice, $0.05 for recording per minute
    // ElevenLabs: varies by plan, estimate ~$0.30 per 1000 characters (rough estimate for voice minutes)
    const twilioVoiceCostCents = Math.ceil((durationSeconds / 60) * 1.3); // $0.013/min in cents
    const twilioRecordingCostCents = recordingDurationSeconds > 0 ? Math.ceil((recordingDurationSeconds / 60) * 5) : 0;
    const twilioCostCents = twilioVoiceCostCents + twilioRecordingCostCents;

    // Estimate ElevenLabs cost (this is approximate - actual cost should come from their API)
    // Assume ~150 words/min, ~750 characters/min
    const estimatedCharacters = (durationSeconds / 60) * 750;
    const elevenLabsCostCents = Math.ceil((estimatedCharacters / 1000) * 30); // $0.30 per 1k chars

    const totalCostCents = twilioCostCents + elevenLabsCostCents;

    // Build transcript from TranscriptionText if available
    let transcript = call.transcript || [];
    if (TranscriptionText) {
      transcript = [
        ...transcript,
        {
          role: 'transcript',
          content: TranscriptionText,
          timestamp: new Date().toISOString(),
        }
      ];
    }

    // Perform simple sentiment analysis on transcript
    let sentiment = 'neutral';
    if (TranscriptionText) {
      const positiveWords = ['great', 'excellent', 'perfect', 'thanks', 'thank you', 'wonderful', 'love', 'amazing'];
      const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'problem', 'issue', 'wrong', 'upset', 'angry'];

      const lowerText = TranscriptionText.toLowerCase();
      const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
      const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

      if (positiveCount > negativeCount + 1) {
        sentiment = 'positive';
      } else if (negativeCount > positiveCount + 1) {
        sentiment = 'negative';
      }
    }

    // Extract key topics (simple keyword extraction)
    const keyTopics: string[] = [];
    if (TranscriptionText) {
      const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'was', 'are', 'were'];
      const words = TranscriptionText.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 4 && !commonWords.includes(word));

      const wordCounts = words.reduce((acc: Record<string, number>, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});

      keyTopics.push(...Object.entries(wordCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word));
    }

    // Check for appointment-related keywords
    const appointmentScheduled = TranscriptionText
      ? /\b(appointment|scheduled|booking|book|reserve|meeting)\b/i.test(TranscriptionText)
      : false;

    // Update call record with final details
    const { error: updateError } = await supabaseClient
      .from('voice_calls')
      .update({
        status: CallStatus,
        ended_at: new Date().toISOString(),
        answered_at: call.answered_at || (CallStatus === 'completed' ? call.started_at : null),
        duration_seconds: durationSeconds,
        recording_url: RecordingUrl,
        recording_duration_seconds: recordingDurationSeconds,
        transcript,
        sentiment,
        key_topics: keyTopics.length > 0 ? keyTopics : null,
        appointment_scheduled: appointmentScheduled,
        twilio_cost_cents: twilioCostCents,
        elevenlabs_cost_cents: elevenLabsCostCents,
        total_cost_cents: totalCostCents,
      })
      .eq('id', call.id);

    if (updateError) {
      console.error('Error updating call record:', updateError);
    }

    // Update voice agent statistics
    if (CallStatus === 'completed' && durationSeconds > 0) {
      const { error: statsError } = await supabaseClient.rpc(
        'update_voice_agent_stats',
        {
          p_agent_id: call.voice_agent_id,
          p_call_duration_seconds: durationSeconds,
        }
      );

      if (statsError) {
        console.error('Error updating voice agent stats:', statsError);
      }
    }

    console.log(`Call ${CallSid} completed. Duration: ${durationSeconds}s, Cost: $${(totalCostCents / 100).toFixed(2)}`);

    return new Response(
      JSON.stringify({
        success: true,
        call_sid: CallSid,
        status: CallStatus,
        duration_seconds: durationSeconds,
        total_cost_cents: totalCostCents,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in twilio-status-callback:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

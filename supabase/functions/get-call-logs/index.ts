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

    // Get query parameters
    const url = new URL(req.url);
    const voice_agent_id = url.searchParams.get('voice_agent_id');
    const client_id = url.searchParams.get('client_id');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const status = url.searchParams.get('status'); // e.g., 'completed', 'no-answer'
    const start_date = url.searchParams.get('start_date');
    const end_date = url.searchParams.get('end_date');

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

    // Build query
    let query = supabaseClient
      .from('voice_calls')
      .select(`
        *,
        voice_agents (
          name,
          voice_name
        ),
        clients (
          business_name,
          contact_name
        )
      `, { count: 'exact' })
      .eq('agency_id', agency.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (voice_agent_id) {
      query = query.eq('voice_agent_id', voice_agent_id);
    }

    if (client_id) {
      query = query.eq('client_id', client_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (start_date) {
      query = query.gte('started_at', start_date);
    }

    if (end_date) {
      query = query.lte('started_at', end_date);
    }

    const { data: calls, error: callsError, count } = await query;

    if (callsError) {
      console.error('Error fetching call logs:', callsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch call logs', details: callsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate analytics
    const analytics = {
      total_calls: count || 0,
      total_minutes: 0,
      total_cost_cents: 0,
      answered_calls: 0,
      missed_calls: 0,
      avg_duration_seconds: 0,
    };

    if (calls && calls.length > 0) {
      calls.forEach(call => {
        if (call.duration_seconds) {
          analytics.total_minutes += call.duration_seconds / 60;
        }
        if (call.total_cost_cents) {
          analytics.total_cost_cents += call.total_cost_cents;
        }
        if (call.status === 'completed') {
          analytics.answered_calls++;
        } else if (call.status === 'no-answer' || call.status === 'busy') {
          analytics.missed_calls++;
        }
      });

      analytics.avg_duration_seconds = analytics.answered_calls > 0
        ? (analytics.total_minutes * 60) / analytics.answered_calls
        : 0;
    }

    return new Response(
      JSON.stringify({
        success: true,
        calls,
        analytics: {
          ...analytics,
          total_minutes: Math.round(analytics.total_minutes * 100) / 100,
          avg_duration_seconds: Math.round(analytics.avg_duration_seconds),
          total_cost: `$${(analytics.total_cost_cents / 100).toFixed(2)}`,
        },
        pagination: {
          limit,
          offset,
          total: count || 0,
          has_more: (offset + limit) < (count || 0),
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-call-logs:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

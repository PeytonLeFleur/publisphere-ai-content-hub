import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateClientRequest {
  businessName: string;
  email: string;
  password?: string; // Optional, will generate if not provided
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, businessName, email, password, clientId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get agency user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify this is an agency user and get agency_id
    const { data: agency, error: agencyError } = await supabaseClient
      .from('agencies')
      .select('id, max_clients, name')
      .eq('contact_email', user.email)
      .single();

    if (agencyError || !agency) {
      throw new Error('Agency not found. Only agencies can manage clients.');
    }

    // CREATE CLIENT
    if (action === 'create') {
      if (!businessName || !email) {
        throw new Error('Business name and email are required');
      }

      // Check client limit
      const { count: clientCount } = await supabaseClient
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('agency_id', agency.id);

      if (clientCount && clientCount >= agency.max_clients) {
        throw new Error(`Client limit reached (${agency.max_clients} max). Please upgrade your plan.`);
      }

      // Check if email already exists
      const { data: existingClient } = await supabaseClient
        .from('clients')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (existingClient) {
        throw new Error('A client with this email already exists');
      }

      // Generate password if not provided
      const clientPassword = password || generatePassword();

      // Create Supabase Auth user for the client
      const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
        email: email.toLowerCase(),
        password: clientPassword,
        email_confirm: true,
        user_metadata: {
          role: 'client',
          business_name: businessName,
          agency_id: agency.id,
          agency_name: agency.name,
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw new Error(`Failed to create client account: ${authError.message}`);
      }

      if (!authUser.user) {
        throw new Error('Failed to create user');
      }

      // Create client record (without password_hash for now, using Supabase Auth)
      const { data: client, error: clientError } = await supabaseClient
        .from('clients')
        .insert({
          agency_id: agency.id,
          business_name: businessName,
          email: email.toLowerCase(),
          password_hash: '', // We're using Supabase Auth, so this is just a placeholder
          is_active: true,
        })
        .select()
        .single();

      if (clientError) {
        console.error('Client creation error:', clientError);
        // Cleanup: delete auth user if client creation failed
        await supabaseClient.auth.admin.deleteUser(authUser.user.id);
        throw new Error('Failed to create client record');
      }

      // Log activity
      await supabaseClient
        .from('activity_logs')
        .insert({
          agency_id: agency.id,
          client_id: client.id,
          action_type: 'client_created',
          description: `Client "${businessName}" created`,
        });

      console.log('Client created successfully:', client.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Client created successfully',
          client: {
            id: client.id,
            business_name: client.business_name,
            email: client.email,
            is_active: client.is_active,
          },
          credentials: {
            email: email.toLowerCase(),
            password: clientPassword,
            login_url: `https://${agency.subdomain}.publisphere.com/login`, // Adjust domain as needed
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        }
      );
    }

    // LIST CLIENTS
    if (action === 'list') {
      const { data: clients, error: listError } = await supabaseClient
        .from('clients')
        .select('id, business_name, email, is_active, created_at')
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false });

      if (listError) {
        throw listError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          clients: clients || [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE CLIENT
    if (action === 'delete') {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      // Get client to find auth user
      const { data: client } = await supabaseClient
        .from('clients')
        .select('email')
        .eq('id', clientId)
        .eq('agency_id', agency.id)
        .single();

      if (!client) {
        throw new Error('Client not found');
      }

      // Find and delete auth user
      const { data: authUsers } = await supabaseClient.auth.admin.listUsers();
      const authUser = authUsers.users.find(u => u.email === client.email);

      if (authUser) {
        await supabaseClient.auth.admin.deleteUser(authUser.id);
      }

      // Delete client (CASCADE will handle related records)
      const { error: deleteError } = await supabaseClient
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('agency_id', agency.id);

      if (deleteError) {
        throw deleteError;
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Client deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TOGGLE CLIENT STATUS
    if (action === 'toggle_status') {
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      const { data: client } = await supabaseClient
        .from('clients')
        .select('is_active')
        .eq('id', clientId)
        .eq('agency_id', agency.id)
        .single();

      if (!client) {
        throw new Error('Client not found');
      }

      const { error: updateError } = await supabaseClient
        .from('clients')
        .update({ is_active: !client.is_active })
        .eq('id', clientId);

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Client ${!client.is_active ? 'activated' : 'deactivated'}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error('Client management error:', error);
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

/**
 * Generate a random password
 */
function generatePassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => charset[byte % charset.length]).join('');
}

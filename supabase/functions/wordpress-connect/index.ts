import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { encrypt, decrypt } from "../_shared/encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WordPressUser {
  id: number;
  name: string;
  url: string;
  description: string;
}

interface WordPressSiteInfo {
  name: string;
  description: string;
  url: string;
  version: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, site_name, site_url, username, app_password, site_id } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get client_id from email
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('id')
      .eq('email', user.email)
      .single();

    if (clientError || !client) {
      throw new Error('Client not found');
    }

    if (action === 'connect') {
      // Test WordPress connection
      const cleanUrl = site_url.replace(/\/$/, '');
      const credentials = btoa(`${username}:${app_password}`);
      
      console.log('Testing WordPress connection:', { cleanUrl, username });
      
      const testResponse = await fetch(`${cleanUrl}/wp-json/wp/v2/users/me`, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      });

      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error('WordPress auth failed:', testResponse.status, errorText);
        
        if (testResponse.status === 401) {
          throw new Error('WordPress authentication failed. Please check your username and application password.');
        } else if (testResponse.status === 404) {
          throw new Error('WordPress REST API not found. Please ensure REST API is enabled.');
        } else {
          throw new Error(`WordPress connection failed: ${testResponse.statusText}`);
        }
      }

      const userData: WordPressUser = await testResponse.json();
      
      // Fetch site info
      const siteInfoResponse = await fetch(`${cleanUrl}/wp-json`, {
        headers: {
          'Authorization': `Basic ${credentials}`,
        },
      });
      
      const siteInfo: WordPressSiteInfo = await siteInfoResponse.json();

      // Fetch categories and tags
      const [categoriesResponse, tagsResponse] = await Promise.all([
        fetch(`${cleanUrl}/wp-json/wp/v2/categories?per_page=100`, {
          headers: { 'Authorization': `Basic ${credentials}` },
        }),
        fetch(`${cleanUrl}/wp-json/wp/v2/tags?per_page=100`, {
          headers: { 'Authorization': `Basic ${credentials}` },
        }),
      ]);

      const categories = await categoriesResponse.json();
      const tags = await tagsResponse.json();

      // Encrypt the app password before storing
      const encryptedPassword = await encrypt(app_password);

      // Save to database
      const { data: wpSite, error: insertError } = await supabaseClient
        .from('wordpress_sites')
        .insert({
          client_id: client.id,
          site_name,
          site_url: cleanUrl,
          username,
          app_password: encryptedPassword,
          is_connected: true,
          site_info: {
            name: siteInfo.name,
            description: siteInfo.description,
            url: siteInfo.url,
            version: siteInfo.version,
            user: userData,
            categories,
            tags,
          },
          last_sync: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
      }

      console.log('WordPress site connected successfully:', wpSite.id);

      return new Response(
        JSON.stringify({
          success: true,
          site: wpSite,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'sync') {
      // Get site from database
      const { data: wpSite, error: siteError } = await supabaseClient
        .from('wordpress_sites')
        .select('*')
        .eq('id', site_id)
        .eq('client_id', client.id)
        .single();

      if (siteError || !wpSite) {
        throw new Error('WordPress site not found');
      }

      // Decrypt password before use
      const decryptedPassword = await decrypt(wpSite.app_password);
      const credentials = btoa(`${wpSite.username}:${decryptedPassword}`);

      // Fetch updated site info
      const siteInfoResponse = await fetch(`${wpSite.site_url}/wp-json`, {
        headers: { 'Authorization': `Basic ${credentials}` },
      });

      if (!siteInfoResponse.ok) {
        throw new Error('Failed to connect to WordPress site');
      }

      const siteInfo: WordPressSiteInfo = await siteInfoResponse.json();

      // Fetch categories and tags
      const [categoriesResponse, tagsResponse] = await Promise.all([
        fetch(`${wpSite.site_url}/wp-json/wp/v2/categories?per_page=100`, {
          headers: { 'Authorization': `Basic ${credentials}` },
        }),
        fetch(`${wpSite.site_url}/wp-json/wp/v2/tags?per_page=100`, {
          headers: { 'Authorization': `Basic ${credentials}` },
        }),
      ]);

      const categories = await categoriesResponse.json();
      const tags = await tagsResponse.json();

      // Update database
      const { error: updateError } = await supabaseClient
        .from('wordpress_sites')
        .update({
          site_info: {
            ...wpSite.site_info,
            name: siteInfo.name,
            description: siteInfo.description,
            version: siteInfo.version,
            categories,
            tags,
          },
          last_sync: new Date().toISOString(),
          is_connected: true,
        })
        .eq('id', site_id);

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error('WordPress connect error:', error);
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

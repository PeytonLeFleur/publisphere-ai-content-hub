import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { decrypt } from "../_shared/encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishRequest {
  site_id: string;
  title: string;
  content: string;
  status: 'draft' | 'publish';
  categories?: number[];
  tags?: number[];
  featured_image_url?: string;
  seo?: {
    title?: string;
    description?: string;
    focus_keyword?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const publishData: PublishRequest = await req.json();
    
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

    // Get client_id
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('id')
      .eq('email', user.email)
      .single();

    if (clientError || !client) {
      throw new Error('Client not found');
    }

    // Get WordPress site
    const { data: wpSite, error: siteError } = await supabaseClient
      .from('wordpress_sites')
      .select('*')
      .eq('id', publishData.site_id)
      .eq('client_id', client.id)
      .single();

    if (siteError || !wpSite) {
      throw new Error('WordPress site not found');
    }

    if (!wpSite.is_connected) {
      throw new Error('WordPress site is not connected');
    }

    // Decrypt password before use
    const decryptedPassword = await decrypt(wpSite.app_password);
    const credentials = btoa(`${wpSite.username}:${decryptedPassword}`);
    let featuredMediaId: number | undefined;

    // Upload featured image if provided
    if (publishData.featured_image_url) {
      console.log('Uploading featured image:', publishData.featured_image_url);
      
      try {
        const imageResponse = await fetch(publishData.featured_image_url);
        if (!imageResponse.ok) {
          throw new Error('Failed to fetch image');
        }

        const imageBlob = await imageResponse.blob();
        const filename = `image-${Date.now()}.jpg`;

        const uploadResponse = await fetch(`${wpSite.site_url}/wp-json/wp/v2/media`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': imageBlob.type,
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
          body: imageBlob,
        });

        if (uploadResponse.ok) {
          const mediaData = await uploadResponse.json();
          featuredMediaId = mediaData.id;
          console.log('Featured image uploaded:', featuredMediaId);
        } else {
          console.error('Image upload failed:', await uploadResponse.text());
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }

    // Prepare post data
    const postData: any = {
      title: publishData.title,
      content: publishData.content,
      status: publishData.status,
    };

    if (publishData.categories && publishData.categories.length > 0) {
      postData.categories = publishData.categories;
    }

    if (publishData.tags && publishData.tags.length > 0) {
      postData.tags = publishData.tags;
    }

    if (featuredMediaId) {
      postData.featured_media = featuredMediaId;
    }

    // Add SEO meta fields if provided
    if (publishData.seo) {
      postData.meta = {
        // Yoast SEO fields
        _yoast_wpseo_title: publishData.seo.title || '',
        _yoast_wpseo_metadesc: publishData.seo.description || '',
        _yoast_wpseo_focuskw: publishData.seo.focus_keyword || '',
        // Rank Math fields
        rank_math_title: publishData.seo.title || '',
        rank_math_description: publishData.seo.description || '',
        rank_math_focus_keyword: publishData.seo.focus_keyword || '',
      };
    }

    console.log('Publishing post to WordPress:', { title: publishData.title, status: publishData.status });

    // Create post in WordPress
    const response = await fetch(`${wpSite.site_url}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WordPress publish failed:', response.status, errorText);
      
      if (response.status === 401) {
        throw new Error('WordPress authentication failed. Please reconnect your site.');
      } else if (response.status === 403) {
        throw new Error('Permission denied. Your WordPress user may lack publishing permissions.');
      } else {
        throw new Error(`Failed to publish to WordPress: ${response.statusText}`);
      }
    }

    const postResult = await response.json();
    console.log('Post published successfully:', postResult.id);

    return new Response(
      JSON.stringify({
        success: true,
        post: {
          id: postResult.id,
          title: postResult.title.rendered,
          link: postResult.link,
          status: postResult.status,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('WordPress publish error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred while publishing',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

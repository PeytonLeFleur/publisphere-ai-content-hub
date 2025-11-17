import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { decrypt } from "../_shared/encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      throw new Error('Unauthorized');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const now = new Date().toISOString();

    // Find jobs that are due to run
    const { data: dueJobs, error: jobsError } = await supabaseClient
      .from('jobs')
      .select(`
        *,
        clients (id, email),
        content_items (
          id,
          title,
          content,
          meta_description,
          focus_keyword,
          featured_image_url,
          wordpress_site_id
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .lt('attempts', supabaseClient.rpc('max_attempts'))
      .limit(10);

    if (jobsError) {
      throw jobsError;
    }

    if (!dueJobs || dueJobs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No jobs to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${dueJobs.length} jobs...`);

    const results = [];

    for (const job of dueJobs) {
      try {
        // Mark job as running
        await supabaseClient
          .from('jobs')
          .update({
            status: 'running',
            started_at: new Date().toISOString(),
            attempts: job.attempts + 1,
          })
          .eq('id', job.id);

        // Process based on job type
        if (job.job_type === 'publish_article') {
          await processPublishArticle(supabaseClient, job);
        } else if (job.job_type === 'publish_gmb') {
          await processPublishGMB(supabaseClient, job);
        } else if (job.job_type === 'send_email') {
          await processSendEmail(supabaseClient, job);
        }

        // Mark as completed
        await supabaseClient
          .from('jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', job.id);

        results.push({ id: job.id, status: 'success' });
        console.log(`Job ${job.id} completed successfully`);

      } catch (error: any) {
        console.error(`Job ${job.id} failed:`, error);

        // Check if we should retry
        const shouldRetry = job.attempts + 1 < job.max_attempts;

        await supabaseClient
          .from('jobs')
          .update({
            status: shouldRetry ? 'pending' : 'failed',
            error_message: error.message,
            // Schedule retry with exponential backoff
            scheduled_for: shouldRetry
              ? new Date(Date.now() + Math.pow(2, job.attempts) * 60000).toISOString()
              : job.scheduled_for,
          })
          .eq('id', job.id);

        results.push({ id: job.id, status: 'failed', error: error.message });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'failed').length;

    return new Response(
      JSON.stringify({
        success: true,
        processed: dueJobs.length,
        succeeded: successCount,
        failed: failCount,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Process jobs error:', error);
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

async function processPublishArticle(supabase: any, job: any) {
  const contentItem = job.content_items;

  if (!contentItem) {
    throw new Error('Content item not found');
  }

  if (!contentItem.wordpress_site_id) {
    throw new Error('No WordPress site specified');
  }

  // Get WordPress site details
  const { data: wpSite, error: siteError } = await supabase
    .from('wordpress_sites')
    .select('*')
    .eq('id', contentItem.wordpress_site_id)
    .single();

  if (siteError || !wpSite) {
    throw new Error('WordPress site not found');
  }

  if (!wpSite.is_connected) {
    throw new Error('WordPress site is not connected');
  }

  // Decrypt password
  const decryptedPassword = await decrypt(wpSite.app_password);
  const credentials = btoa(`${wpSite.username}:${decryptedPassword}`);

  // Upload featured image if provided
  let featuredMediaId: number | undefined;

  if (contentItem.featured_image_url) {
    try {
      const imageResponse = await fetch(contentItem.featured_image_url);
      if (imageResponse.ok) {
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
        }
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      // Continue without image
    }
  }

  // Create post in WordPress
  const postData: any = {
    title: contentItem.title || 'Untitled',
    content: contentItem.content,
    status: 'publish',
  };

  if (featuredMediaId) {
    postData.featured_media = featuredMediaId;
  }

  if (contentItem.meta_description || contentItem.focus_keyword) {
    postData.meta = {
      _yoast_wpseo_title: contentItem.title || '',
      _yoast_wpseo_metadesc: contentItem.meta_description || '',
      _yoast_wpseo_focuskw: contentItem.focus_keyword || '',
      rank_math_title: contentItem.title || '',
      rank_math_description: contentItem.meta_description || '',
      rank_math_focus_keyword: contentItem.focus_keyword || '',
    };
  }

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
    throw new Error(`WordPress publish failed: ${response.status} - ${errorText}`);
  }

  const postResult = await response.json();

  // Update content item
  await supabase
    .from('content_items')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      wordpress_post_id: postResult.id,
    })
    .eq('id', contentItem.id);

  console.log(`Published article to WordPress: ${postResult.link}`);
}

async function processPublishGMB(supabase: any, job: any) {
  // GMB publishing would require Google My Business API integration
  // For now, just mark as completed
  // TODO: Implement GMB API integration
  console.log('GMB publishing not yet implemented');
  throw new Error('GMB publishing not yet implemented');
}

async function processSendEmail(supabase: any, job: any) {
  // Email sending would use SMTP or email service
  // TODO: Implement email sending
  console.log('Email sending not yet implemented');
  throw new Error('Email sending not yet implemented');
}

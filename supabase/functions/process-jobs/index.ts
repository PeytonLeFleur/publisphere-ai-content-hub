import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get jobs that are due to be processed
    const now = new Date().toISOString();
    const { data: dueJobs, error: fetchError } = await supabaseClient
      .from("jobs")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", now)
      .lt("attempts", 3)
      .limit(10);

    if (fetchError) throw fetchError;

    console.log(`Found ${dueJobs?.length || 0} jobs to process`);

    const results = [];

    for (const job of dueJobs || []) {
      try {
        // Update job status to running
        await supabaseClient
          .from("jobs")
          .update({
            status: "running",
            started_at: new Date().toISOString(),
            attempts: job.attempts + 1,
          })
          .eq("id", job.id);

        // Process the job based on type
        let success = false;
        let errorMessage = null;

        switch (job.job_type) {
          case "publish_article":
            success = await processPublishArticle(job, supabaseClient);
            break;
          case "publish_gmb":
            success = await processPublishGMB(job, supabaseClient);
            break;
          case "send_email":
            success = await processSendEmail(job, supabaseClient);
            break;
          case "generate_content":
            success = await processGenerateContent(job, supabaseClient);
            break;
          default:
            errorMessage = `Unknown job type: ${job.job_type}`;
        }

        // Update job status
        if (success) {
          await supabaseClient
            .from("jobs")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", job.id);

          results.push({ id: job.id, status: "completed" });
        } else {
          // Check if we should retry
          if (job.attempts + 1 >= job.max_attempts) {
            await supabaseClient
              .from("jobs")
              .update({
                status: "failed",
                completed_at: new Date().toISOString(),
                error_message: errorMessage || "Job failed after max attempts",
              })
              .eq("id", job.id);

            results.push({ id: job.id, status: "failed" });
          } else {
            // Schedule retry with exponential backoff
            const retryDelay = Math.pow(2, job.attempts) * 5; // 5, 10, 20 minutes
            const nextAttempt = new Date(Date.now() + retryDelay * 60 * 1000);

            await supabaseClient
              .from("jobs")
              .update({
                status: "pending",
                scheduled_for: nextAttempt.toISOString(),
                error_message: errorMessage,
              })
              .eq("id", job.id);

            results.push({ id: job.id, status: "retrying" });
          }
        }
      } catch (error: any) {
        console.error(`Error processing job ${job.id}:`, error);
        results.push({ id: job.id, status: "error", error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in process-jobs function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function processPublishArticle(job: any, supabaseClient: any): Promise<boolean> {
  try {
    // Get content item
    const { data: content } = await supabaseClient
      .from("content_items")
      .select("*")
      .eq("id", job.content_item_id)
      .single();

    if (!content) return false;

    // Here you would call WordPress publish function
    // For now, just mark as published
    await supabaseClient
      .from("content_items")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", job.content_item_id);

    return true;
  } catch (error) {
    console.error("Error publishing article:", error);
    return false;
  }
}

async function processPublishGMB(job: any, supabaseClient: any): Promise<boolean> {
  try {
    // Get GMB post
    const { data: post } = await supabaseClient
      .from("content_items")
      .select("*")
      .eq("id", job.content_item_id)
      .single();

    if (!post) return false;

    // Send reminder email (would integrate with email service)
    console.log(`Sending GMB reminder for post: ${post.title}`);

    return true;
  } catch (error) {
    console.error("Error processing GMB post:", error);
    return false;
  }
}

async function processSendEmail(job: any, supabaseClient: any): Promise<boolean> {
  try {
    // Would integrate with Resend or other email service
    console.log(`Sending email:`, job.job_data);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

async function processGenerateContent(job: any, supabaseClient: any): Promise<boolean> {
  try {
    // Would call content generation function
    console.log(`Generating content:`, job.job_data);
    return true;
  } catch (error) {
    console.error("Error generating content:", error);
    return false;
  }
}

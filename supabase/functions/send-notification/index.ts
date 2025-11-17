import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "publish_success" | "publish_failure" | "content_ready" | "weekly_summary";
  recipient: string;
  data: {
    title?: string;
    url?: string;
    error?: string;
    site_name?: string;
    date?: string;
    time?: string;
    articles?: number;
    gmb_posts?: number;
    published?: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recipient, data }: NotificationRequest = await req.json();

    let subject = "";
    let html = "";

    switch (type) {
      case "publish_success":
        subject = `✅ Article Published: ${data.title}`;
        html = `
          <h1>Article Published Successfully</h1>
          <p>Your article "<strong>${data.title}</strong>" was successfully published to ${data.site_name}.</p>
          <p><a href="${data.url}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Article</a></p>
          <p style="margin-top: 20px; color: #666;">Need help? Reply to this email.</p>
        `;
        break;

      case "publish_failure":
        subject = `❌ Publishing Failed: ${data.title}`;
        html = `
          <h1>Publishing Failed</h1>
          <p>We couldn't publish "<strong>${data.title}</strong>" to ${data.site_name}.</p>
          <div style="background-color: #fee; border-left: 4px solid #f44; padding: 15px; margin: 20px 0;">
            <strong>Error:</strong> ${data.error}
          </div>
          <h3>What to do:</h3>
          <ul>
            <li>Check your WordPress connection</li>
            <li>Review article content</li>
            <li>Try publishing manually</li>
          </ul>
          <p><a href="${data.url}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Article</a></p>
        `;
        break;

      case "content_ready":
        subject = `📅 Content Ready to Publish Tomorrow`;
        html = `
          <h1>Content Ready for Review</h1>
          <p>Your scheduled article is ready to publish tomorrow:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Title:</strong> ${data.title}<br>
            <strong>WordPress:</strong> ${data.site_name}<br>
            <strong>Scheduled:</strong> ${data.date} at ${data.time}
          </div>
          <p><a href="${data.url}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">Review Now</a></p>
        `;
        break;

      case "weekly_summary":
        subject = `📊 Your Weekly Content Summary`;
        html = `
          <h1>Weekly Content Summary</h1>
          <p>Here's what happened this week:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Content Statistics</h3>
            <p><strong>Articles Generated:</strong> ${data.articles || 0}</p>
            <p><strong>GMB Posts Created:</strong> ${data.gmb_posts || 0}</p>
            <p><strong>Content Published:</strong> ${data.published || 0}</p>
          </div>
          <p>Keep up the great work!</p>
        `;
        break;

      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    const emailResponse = await resend.emails.send({
      from: "Publisphere <onboarding@resend.dev>",
      to: [recipient],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

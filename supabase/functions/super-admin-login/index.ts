import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify super admin credentials using the helper function
    const { data: adminData, error: verifyError } = await supabaseClient.rpc(
      "verify_super_admin_password",
      {
        p_email: email,
        p_password: password,
      }
    );

    if (verifyError || !adminData || adminData.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const admin = adminData[0];

    // Create a Supabase auth session for the super admin
    // We'll use a special email format to identify super admins in the auth system
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    });

    // If auth fails, try to create the user
    if (authError) {
      // Create auth user for super admin if it doesn't exist
      const { data: createData, error: createError } = await supabaseClient.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          is_super_admin: true,
          full_name: admin.full_name,
        },
      });

      if (createError) {
        return new Response(
          JSON.stringify({ error: "Authentication setup failed" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Try signing in again
      const { data: retryAuthData, error: retryAuthError } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (retryAuthError) {
        return new Response(
          JSON.stringify({ error: "Authentication failed" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          admin: {
            id: admin.id,
            email: admin.email,
            full_name: admin.full_name,
          },
          session: retryAuthData.session,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        admin: {
          id: admin.id,
          email: admin.email,
          full_name: admin.full_name,
        },
        session: authData.session,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Super admin login error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

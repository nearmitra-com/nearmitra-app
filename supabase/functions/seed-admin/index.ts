import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const adminEmail = "saksham_ nearmitra@ nearmitra.admin";
    const adminPassword = "saksham10";

    // Check if admin already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find(
      (u) => u.email === adminEmail
    );

    if (existingAdmin) {
      // Check if role already exists
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", existingAdmin.id)
        .eq("role", "admin")
        .maybeSingle();

      if (existingRole) {
        return new Response(
          JSON.stringify({ message: "Admin already exists", userId: existingAdmin.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Add admin role if missing
      await supabase.from("user_roles").insert({
        user_id: existingAdmin.id,
        role: "admin",
      });

      return new Response(
        JSON.stringify({ message: "Admin role added", userId: existingAdmin.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (createError) {
      throw createError;
    }

    // Add admin role
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: newUser.user.id,
      role: "admin",
    });

    if (roleError) {
      throw roleError;
    }

    return new Response(
      JSON.stringify({ 
        message: "Admin created successfully", 
        userId: newUser.user.id,
        email: adminEmail 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error seeding admin:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

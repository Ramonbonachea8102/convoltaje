import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Manejo de preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Verificar autenticación del usuario solicitante mediante JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No autorizado. Token de autorización requerido." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Token de usuario inválido o expirado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Obtener secreto de servidor del Webhook de Make.com (¡NUNCA expuesto al navegador!)
    const makeWebhookUrl = Deno.env.get("MAKE_WEBHOOK_URL");

    if (!makeWebhookUrl) {
      console.warn("MAKE_WEBHOOK_URL no configurado en los secretos de Supabase.");
      return new Response(
        JSON.stringify({ message: "Notificación ignorada. Webhook no configurado." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = await req.json();

    // 3. Reenviar evento a Make.com desde el servidor de forma 100% segura
    const makeResponse = await fetch(makeWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Invoked-By": user.email || user.id,
      },
      body: JSON.stringify({
        ...payload,
        authenticatedUserId: user.id,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
      }),
    });

    return new Response(
      JSON.stringify({ success: true, status: makeResponse.status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error en Edge Function notify-make:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

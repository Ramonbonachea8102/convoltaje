import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Manejar preflight OPTIONS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Verificar JWT de quien invoca
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No autorizado. Token de autorización requerido." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Cliente estándar con el token del usuario invocador
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: callerError } = await supabaseUserClient.auth.getUser();

    if (callerError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Token de usuario inválido o expirado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Verificar que quien invoca tenga rol 'admin' o 'ceo' en la tabla perfiles
    const { data: callerProfile, error: profileError } = await supabaseUserClient
      .from("perfiles")
      .select("rol_id, rol")
      .eq("id", callerUser.id)
      .single();

    const callerRole = callerProfile?.rol_id || callerProfile?.rol || "";

    if (profileError || !["admin", "ceo"].includes(callerRole.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: "Acceso denegado. Se requieren permisos de Administrador o CEO." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Crear cliente con Service Role Key (SOLO servidor, para gestión administrativa)
    if (!supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Configuración del servidor incompleta (SUPABASE_SERVICE_ROLE_KEY no definida)." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 4. Obtener datos del nuevo usuario
    const body = await req.json();
    const { email, password, nombre, telefono, rol_id } = body;

    if (!email || !nombre || !rol_id) {
      return new Response(
        JSON.stringify({ error: "Campos obligatorios requeridos: email, nombre, rol_id." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Crear usuario en Supabase Auth (o enviar invitación si no se pasa password)
    let newAuthUser: any;
    if (password && password.length >= 6) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: nombre, role: rol_id, phone: telefono },
      });
      if (error) throw error;
      newAuthUser = data.user;
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { name: nombre, role: rol_id, phone: telefono },
      });
      if (error) throw error;
      newAuthUser = data.user;
    }

    // 6. Insertar o actualizar la fila correspondiente en la tabla perfiles
    const { data: insertedProfile, error: insertError } = await supabaseAdmin
      .from("perfiles")
      .upsert({
        id: newAuthUser.id,
        nombre,
        email,
        telefono: telefono || "",
        rol_id,
        rol: rol_id,
        activo: true,
        descripcion_corta: `Rol: ${rol_id}`,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error al insertar perfil de usuario:", insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Usuario creado exitosamente desde el panel de admin.",
        user: {
          id: newAuthUser.id,
          email: newAuthUser.email,
          nombre,
          rol_id,
          telefono,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error en Edge Function admin-create-user:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Error al crear usuario en Supabase." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

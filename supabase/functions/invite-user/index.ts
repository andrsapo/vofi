import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Admin-Client mit service_role key (nur serverseitig sicher)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Aufrufenden Nutzer prüfen (muss Administrator sein)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const { data: { user: caller }, error: callerErr } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (callerErr || !caller) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

    const callerMeta = caller.user_metadata ?? {}
    if (callerMeta.rolle !== 'Administrator') {
      return new Response('Forbidden: only administrators can invite users', { status: 403, headers: corsHeaders })
    }

    const { email, name, rolle } = await req.json() as { email: string; name: string; rolle: string }

    if (!email || !name || !rolle) {
      return new Response('email, name and rolle are required', { status: 400, headers: corsHeaders })
    }

    // Nutzer über Supabase Admin API einladen — versendet automatisch eine E-Mail
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { name, rolle, mustSetPassword: true },
      redirectTo: `${Deno.env.get('SITE_URL') ?? 'http://localhost:5173'}/?type=invite`,
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ id: data.user?.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

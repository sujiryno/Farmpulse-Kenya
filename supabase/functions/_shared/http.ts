// Shared helpers for FarmPulse Edge Functions.
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2'

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*' // set to your Vercel URL in production

export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/** Returns a Response for OPTIONS / non-POST requests, otherwise null. */
export function handleMethod(req: Request): Response | null {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  return null
}

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
}

/** Constant-time string compare for secrets. */
export function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const x = enc.encode(a), y = enc.encode(b)
  if (x.length !== y.length) return false
  let diff = 0
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i]
  return diff === 0
}

/** True when the request carries `Authorization: Bearer <CRON_SECRET>`. */
export function hasCronSecret(req: Request): boolean {
  const secret = Deno.env.get('CRON_SECRET')
  if (!secret) return false
  const header = req.headers.get('Authorization') ?? ''
  return safeEqual(header, `Bearer ${secret}`)
}

/**
 * Identify the caller from their Supabase session JWT and load their farmers row.
 * Never trust a phone number sent in the request body.
 */
export async function requireFarmer(
  req: Request,
  supabase: SupabaseClient,
  columns = 'id, phone',
): Promise<{ farmer: Record<string, any> } | { error: Response }> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return { error: json({ error: 'Not signed in.' }, 401) }
  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData?.user) return { error: json({ error: 'Invalid or expired session.' }, 401) }
  const { data: farmer, error } = await supabase
    .from('farmers').select(columns).eq('user_id', userData.user.id).maybeSingle()
  if (error || !farmer) return { error: json({ error: 'Farmer profile not found. Please complete registration.' }, 404) }
  return { farmer: farmer as unknown as Record<string, any> }
}

// ---- Africa/Nairobi (EAT, UTC+3, no DST) day boundaries ----
const EAT_MS = 3 * 60 * 60 * 1000
export function startOfTodayEAT(): string {
  const startMs = Math.floor((Date.now() + EAT_MS) / 86_400_000) * 86_400_000 - EAT_MS
  return new Date(startMs).toISOString()
}
export function todayEAT(): string {
  return new Date(Date.now() + EAT_MS).toISOString().slice(0, 10)
}

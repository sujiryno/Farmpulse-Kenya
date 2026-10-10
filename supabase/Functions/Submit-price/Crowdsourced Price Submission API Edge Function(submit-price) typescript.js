import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  try {
    const body = await req.json()
    const { type, data, farmerPhone } = body  // type: 'feed' or 'medicine'
    
    if (!type || !data || !farmerPhone) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: corsHeaders })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // Get farmer ID from phone
    const { data: farmer, error: farmerError } = await supabase
      .from('farmers')
      .select('id')
      .eq('phone', farmerPhone)
      .single()
    
    if (farmerError || !farmer) {
      return new Response(JSON.stringify({ error: 'Farmer not found' }), { status: 404, headers: corsHeaders })
    }

    let result
    if (type === 'feed') {
      result = await supabase.from('feed_prices').insert({
        ...data,
        submitted_by: farmer.id,
        verified: false,
        submitted_at: new Date().toISOString()
      })
    } else if (type === 'medicine') {
      result = await supabase.from('medicine_prices').insert({
        ...data,
        submitted_by: farmer.id,
        verified: false,
        submitted_at: new Date().toISOString()
      })
    } else {
      return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers: corsHeaders })
    }

    if (result.error) throw result.error

    return new Response(JSON.stringify({ success: true, message: 'Price submitted for moderation' }), { status: 200, headers: corsHeaders })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders })
  }
})
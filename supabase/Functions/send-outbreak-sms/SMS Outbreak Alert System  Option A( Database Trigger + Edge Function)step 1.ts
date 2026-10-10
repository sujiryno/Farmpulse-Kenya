import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const AT_API_KEY = Deno.env.get('AFRICASTALKING_API_KEY')!
const AT_USERNAME = Deno.env.get('AFRICASTALKING_USERNAME')!  // sandbox or live

const corsHeaders = { 'Access-Control-Allow-Origin': '*' }

Deno.serve(async (req: Request) => {
  // Called manually or via cron/trigger
  const { alertId } = await req.json()
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  
  // Fetch alert details
  const { data: alert } = await supabase
    .from('outbreak_alerts')
    .select('*')
    .eq('id', alertId)
    .single()
  
  if (!alert) return new Response('Alert not found', { status: 404 })
  
  // Fetch affected farmers (by county and poultry type)
  let query = supabase.from('farmers').select('phone, county, poultry_types')
  if (alert.counties && alert.counties.length > 0) {
    query = query.in('county', alert.counties)
  }
  // Note: poultry_types is an array column; need overlap check
  // For simplicity, we filter in memory after fetching (acceptable for MVP)
  
  const { data: farmers } = await query
  
  const targetFarmers = farmers?.filter(f => {
    if (!alert.poultry_types || alert.poultry_types.length === 0) return true
    return f.poultry_types?.some((pt: string) => alert.poultry_types.includes(pt))
  }) || []
  
  // Send SMS via Africa's Talking
  const message = `🚨 ${alert.title}\n${alert.message}\n- FarmPulse Kenya`
  
  const at = require('https://esm.sh/africastalking')({
    apiKey: AT_API_KEY,
    username: AT_USERNAME
  })
  
  const sms = at.SMS
  
  const phoneNumbers = targetFarmers.map(f => f.phone)
  const results = []
  
  // Send in batches of 100 (AT limit)
  for (let i = 0; i < phoneNumbers.length; i += 100) {
    const batch = phoneNumbers.slice(i, i + 100)
    const result = await sms.send({ to: batch, message, from: 'FarmPulse' })
    results.push(result)
  }
  
  // Log that SMS were sent (optional: create notifications table)
  await supabase.from('outbreak_alerts').update({ sms_sent_at: new Date().toISOString() }).eq('id', alertId)
  
  return new Response(JSON.stringify({ sent: phoneNumbers.length, results }), { headers: corsHeaders })
})
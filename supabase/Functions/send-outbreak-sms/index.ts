// supabase/functions/send-outbreak-sms/index.ts
// verify_jwt = false (see config.toml); caller must send `Authorization: Bearer <CRON_SECRET>`.
import { adminClient, hasCronSecret, json } from '../_shared/http.ts'

const AT_API_KEY = Deno.env.get('AFRICASTALKING_API_KEY')!
const AT_USERNAME = Deno.env.get('AFRICASTALKING_USERNAME')! // 'sandbox' while testing
const AT_SENDER_ID = Deno.env.get('AFRICASTALKING_SENDER_ID') // optional; omit unless registered
const AT_URL = AT_USERNAME === 'sandbox'
  ? 'https://api.sandbox.africastalking.com/version1/messaging'
  : 'https://api.africastalking.com/version1/messaging'
const BATCH = 100

function toE164(raw: string): string | null {
  const d = String(raw).replace(/\D/g, '')
  const m = d.startsWith('0') ? '254' + d.slice(1) : d
  return /^254[17]\d{8}$/.test(m) ? '+' + m : null
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!hasCronSecret(req)) return json({ error: 'Unauthorized' }, 401)

  const { alertId } = await req.json().catch(() => ({}))
  if (!alertId) return json({ error: 'alertId required' }, 400)

  const supabase = adminClient()

  // Atomically claim the alert so retries/duplicate triggers cannot send it twice.
  const { data: alert } = await supabase.from('outbreak_alerts')
    .update({ sms_sent_at: new Date().toISOString() })
    .eq('id', alertId).is('sms_sent_at', null).select('*').maybeSingle()
  if (!alert) return json({ error: 'Alert not found or already sent' }, 409)

  let q = supabase.from('farmers').select('phone')
  if (alert.counties?.length) q = q.in('county', alert.counties)
  if (alert.poultry_types?.length) q = q.overlaps('poultry_types', alert.poultry_types)
  const { data: farmers, error } = await q
  if (error) {
    await supabase.from('outbreak_alerts').update({ sms_sent_at: null }).eq('id', alertId)
    return json({ error: error.message }, 500)
  }

  const numbers = [...new Set((farmers ?? []).map((f: any) => toE164(f.phone)).filter(Boolean) as string[])]
  const message = `FarmPulse ALERT: ${alert.title}\n${alert.message}`.slice(0, 450)

  let sent = 0, failed = 0
  for (let i = 0; i < numbers.length; i += BATCH) {
    const params = new URLSearchParams({ username: AT_USERNAME, to: numbers.slice(i, i + BATCH).join(','), message })
    if (AT_SENDER_ID) params.set('from', AT_SENDER_ID)
    try {
      const res = await fetch(AT_URL, {
        method: 'POST',
        headers: { apiKey: AT_API_KEY, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      })
      const data = await res.json()
      const recipients = data?.SMSMessageData?.Recipients ?? []
      sent += recipients.filter((r: any) => r.statusCode === 101).length
      failed += recipients.filter((r: any) => r.statusCode !== 101).length
    } catch (err) {
      console.error("Africa's Talking batch failed:", err)
      failed += numbers.slice(i, i + BATCH).length
    }
  }

  return json({ success: true, targeted: numbers.length, sent, failed })
})

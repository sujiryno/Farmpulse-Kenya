// supabase/functions/mpesa-daily-pass/index.ts  (JWT verified; farmer comes from the session)
import { adminClient, handleMethod, json, requireFarmer } from '../_shared/http.ts'

const MPESA_CONSUMER_KEY = Deno.env.get('MPESA_CONSUMER_KEY')!
const MPESA_CONSUMER_SECRET = Deno.env.get('MPESA_CONSUMER_SECRET')!
const MPESA_PASSKEY = Deno.env.get('MPESA_PASSKEY')!
const MPESA_SHORTCODE = Deno.env.get('MPESA_SHORTCODE')!
const MPESA_ENV = Deno.env.get('MPESA_ENV') ?? 'sandbox' // 'sandbox' | 'production'
const MPESA_CALLBACK_SECRET = Deno.env.get('MPESA_CALLBACK_SECRET')! // random string, also checked by mpesa-callback
const DAILY_PASS_PRICE = 30 // KES

const BASE = MPESA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke'
// The callback is a Supabase function, not a Next.js route.
const CALLBACK_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-callback?token=${encodeURIComponent(MPESA_CALLBACK_SECRET)}`

function toMsisdn(raw: string): string | null {
  const d = String(raw).replace(/\D/g, '')
  const m = /^0[17]\d{8}$/.test(d) ? '254' + d.slice(1) : /^[17]\d{8}$/.test(d) ? '254' + d : d
  return /^254[17]\d{8}$/.test(m) ? m : null
}

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${btoa(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`)}` },
  })
  if (!res.ok) throw new Error('Failed to get M-Pesa token')
  return (await res.json()).access_token
}

async function stkPush(msisdn: string, amount: number, accountRef: string): Promise<string> {
  const token = await getAccessToken()
  const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14) // YYYYMMDDHHmmss
  const res = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: MPESA_SHORTCODE,
      Password: btoa(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`),
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: msisdn,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: msisdn,
      CallBackURL: CALLBACK_URL,
      AccountReference: accountRef.slice(0, 12),
      TransactionDesc: 'FarmPulse Pass',
    }),
  })
  const data = await res.json()
  if (data.ResponseCode !== '0') throw new Error(`STK Push failed: ${data.ResponseDescription ?? data.errorMessage ?? 'unknown'}`)
  return data.CheckoutRequestID
}

Deno.serve(async (req: Request) => {
  const early = handleMethod(req)
  if (early) return early

  try {
    const supabase = adminClient()
    const auth = await requireFarmer(req, supabase, 'id, phone')
    if ('error' in auth) return auth.error
    const farmer = auth.farmer

    const body = await req.json().catch(() => ({}))
    const msisdn = toMsisdn(body?.mpesaPhone ?? farmer.phone)
    if (!msisdn) return json({ error: 'Enter a valid Safaricom number, e.g. 0712345678.' }, 400)

    const { data: active } = await supabase.from('daily_passes').select('id')
      .eq('farmer_id', farmer.id).eq('status', 'confirmed').gt('expires_at', new Date().toISOString()).limit(1)
    if (active && active.length > 0) return json({ error: 'You already have an active daily pass.' }, 409)

    const checkoutRequestID = await stkPush(msisdn, DAILY_PASS_PRICE, `FP${farmer.id}`)

    // expires_at is NOT NULL, so use "now"; mpesa-callback sets the real 24h expiry on confirmation.
    const { error: insertError } = await supabase.from('daily_passes').insert({
      farmer_id: farmer.id,
      mpesa_tx_id: checkoutRequestID, // replaced by the M-Pesa receipt number on confirmation
      amount_kes: DAILY_PASS_PRICE,
      expires_at: new Date().toISOString(),
      status: 'pending',
    })
    if (insertError) {
      console.error('Failed to record pending pass:', insertError)
      return json({ error: 'Could not record the payment request. If you receive an M-Pesa prompt, do not enter your PIN; try again.' }, 500)
    }

    return json({ success: true, checkoutRequestID, message: 'STK Push sent. Check your phone and enter your M-Pesa PIN.' })
  } catch (error) {
    console.error('M-Pesa error:', error)
    return json({ error: 'Payment initiation failed. Please try again.' }, 502)
  }
})

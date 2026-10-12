// supabase/functions/mpesa-callback/index.ts
// verify_jwt = false (Safaricom calls this); protected by a secret token in the URL.
import { adminClient, safeEqual } from '../_shared/http.ts'

const ack = (status = 200) =>
  new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req: Request) => {
  const secret = Deno.env.get('MPESA_CALLBACK_SECRET') ?? ''
  const token = new URL(req.url).searchParams.get('token') ?? ''
  if (!secret || !safeEqual(token, secret)) return new Response('Unauthorized', { status: 401 })

  try {
    const body = await req.json()
    const cb = body?.Body?.stkCallback
    if (!cb) return ack()

    const { ResultCode, CheckoutRequestID, CallbackMetadata } = cb
    const supabase = adminClient()

    if (ResultCode !== 0) {
      await supabase.from('daily_passes').update({ status: 'failed' })
        .eq('mpesa_tx_id', CheckoutRequestID).eq('status', 'pending')
      return ack()
    }

    let receipt = '', amount = 0
    for (const item of CallbackMetadata?.Item ?? []) {
      if (item.Name === 'MpesaReceiptNumber') receipt = String(item.Value)
      if (item.Name === 'Amount') amount = Number(item.Value)
    }

    // Only a still-pending row can be confirmed, so duplicate callbacks are harmless.
    const { data: pass } = await supabase.from('daily_passes').select('id, amount_kes')
      .eq('mpesa_tx_id', CheckoutRequestID).eq('status', 'pending').maybeSingle()
    if (!pass) {
      console.warn('No pending pass for CheckoutRequestID (duplicate or unknown):', CheckoutRequestID)
      return ack()
    }
    if (!receipt || amount < (pass.amount_kes ?? 0)) {
      console.error('Callback amount/receipt mismatch', { CheckoutRequestID, amount, receipt })
      await supabase.from('daily_passes').update({ status: 'failed' }).eq('id', pass.id).eq('status', 'pending')
      return ack()
    }

    const now = new Date()
    const { error } = await supabase.from('daily_passes').update({
      mpesa_tx_id: receipt,
      status: 'confirmed',
      activated_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    }).eq('id', pass.id).eq('status', 'pending')
    if (error) console.error('Failed to confirm daily_pass:', error)

    return ack()
  } catch (err) {
    console.error('Callback error:', err)
    return ack() // always 200 so Safaricom does not retry-storm; errors are in logs
  }
})

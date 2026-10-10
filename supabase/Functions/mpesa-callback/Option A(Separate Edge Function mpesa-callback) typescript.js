// supabase/functions/mpesa-callback/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req: Request) => {
  try {
    const body = await req.json()
    console.log('M-Pesa callback body:', JSON.stringify(body))
    
    // Extract relevant data
    const stkCallback = body.Body?.stkCallback
    if (!stkCallback) {
      return new Response('OK', { status: 200 }) // Acknowledge receipt
    }
    
    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = stkCallback
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    if (ResultCode === 0) {
      // Payment successful
      // Extract transaction ID and amount from metadata
      let transactionId = ''
      let amount = 0
      let phoneNumber = ''
      
      if (CallbackMetadata?.Item) {
        for (const item of CallbackMetadata.Item) {
          if (item.Name === 'MpesaReceiptNumber') transactionId = item.Value
          if (item.Name === 'Amount') amount = item.Value
          if (item.Name === 'PhoneNumber') phoneNumber = item.Value
        }
      }
      
      // Find the pending daily_pass by CheckoutRequestID (stored as mpesa_tx_id)
      const { data: pendingPass, error: findError } = await supabase
        .from('daily_passes')
        .select('id, farmer_id')
        .eq('mpesa_tx_id', CheckoutRequestID)
        .eq('status', 'pending')
        .maybeSingle()
      
      if (findError || !pendingPass) {
        console.error('No pending pass found for CheckoutRequestID:', CheckoutRequestID)
        return new Response('OK', { status: 200 })
      }
      
      // Update the daily pass with confirmed transaction details
      const { error: updateError } = await supabase
        .from('daily_passes')
        .update({
          mpesa_tx_id: transactionId,
          status: 'confirmed',
          activated_at: new Date().toISOString()
        })
        .eq('id', pendingPass.id)
      
      if (updateError) {
        console.error('Failed to update daily_pass:', updateError)
      }
      
      // Also ensure expires_at is set correctly (already set, but extend if needed)
      // You could also notify the user via push/SMS that pass is active
      
    } else {
      // Payment failed or cancelled
      // Update the pending pass to failed (or delete)
      await supabase
        .from('daily_passes')
        .update({ status: 'failed' })
        .eq('mpesa_tx_id', CheckoutRequestID)
        .eq('status', 'pending')
    }
    
    // Always respond with OK to M-Pesa
    return new Response('OK', { status: 200 })
    
  } catch (err) {
    console.error('Callback error:', err)
    return new Response('OK', { status: 200 }) // Still return OK to avoid retries
  }
})
// supabase/functions/mpesa-daily-pass/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// Environment variables
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// M-Pesa Daraja config
const MPESA_CONSUMER_KEY = Deno.env.get('MPESA_CONSUMER_KEY')!
const MPESA_CONSUMER_SECRET = Deno.env.get('MPESA_CONSUMER_SECRET')!
const MPESA_PASSKEY = Deno.env.get('MPESA_PASSKEY')!  // shortcode passkey
const MPESA_SHORTCODE = Deno.env.get('MPESA_SHORTCODE')!  // e.g., '174379'
const MPESA_ENV = Deno.env.get('MPESA_ENV') || 'sandbox'  // sandbox or production
const APP_BASE_URL = Deno.env.get('APP_BASE_URL')!  // e.g., https://your-app.com

// Daily pass price (KES)
const DAILY_PASS_PRICE = 30

// CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Helper: get M-Pesa access token
async function getMpesaAccessToken(): Promise<string> {
  const auth = btoa(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`)
  const url = MPESA_ENV === 'sandbox' 
    ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
  
  const response = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` }
  })
  
  if (!response.ok) {
    throw new Error('Failed to get M-Pesa token')
  }
  
  const data = await response.json()
  return data.access_token
}

// Helper: generate password for STK push
function generatePassword(shortcode: string, passkey: string, timestamp: string): string {
  const str = `${shortcode}${passkey}${timestamp}`
  return btoa(str)
}

// Helper: initiate STK push
async function stkPush(
  phoneNumber: string, 
  amount: number, 
  accountReference: string,
  transactionDesc: string
): Promise<{ checkoutRequestID: string; responseCode: string }> {
  const token = await getMpesaAccessToken()
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14) // YYYYMMDDHHMMSS
  const password = generatePassword(MPESA_SHORTCODE, MPESA_PASSKEY, timestamp)
  
  // Format phone to 2547XXXXXXXX (no leading 0 or +)
  let formattedPhone = phoneNumber.replace(/\D/g, '')
  if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1)
  if (!formattedPhone.startsWith('254')) formattedPhone = '254' + formattedPhone
  
  const url = MPESA_ENV === 'sandbox'
    ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
    : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: formattedPhone,
      CallBackURL: `${APP_BASE_URL}/api/mpesa-callback`, // Your callback endpoint
      AccountReference: accountReference.slice(0, 12),
      TransactionDesc: transactionDesc.slice(0, 13)
    })
  })
  
  const data = await response.json()
  if (data.ResponseCode !== '0') {
    throw new Error(`STK Push failed: ${data.ResponseDescription || data.errorMessage}`)
  }
  
  return {
    checkoutRequestID: data.CheckoutRequestID,
    responseCode: data.ResponseCode
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })
  }
  
  try {
    const { phoneNumber } = await req.json()
    
    if (!phoneNumber) {
      return new Response(JSON.stringify({ error: 'Phone number required' }), { status: 400, headers: corsHeaders })
    }
    
    // Initialize Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // Find farmer by phone
    const { data: farmer, error: farmerError } = await supabase
      .from('farmers')
      .select('id')
      .eq('phone', phoneNumber)
      .single()
    
    if (farmerError || !farmer) {
      return new Response(JSON.stringify({ error: 'Farmer not found. Please register first.' }), { status: 404, headers: corsHeaders })
    }
    
    // Generate unique account reference (using farmer ID + timestamp)
    const accountRef = `FP${farmer.id}${Date.now().toString().slice(-6)}`
    const transactionDesc = 'FarmPulse Daily Pass'
    
    // Initiate STK push
    const { checkoutRequestID, responseCode } = await stkPush(
      phoneNumber,
      DAILY_PASS_PRICE,
      accountRef,
      transactionDesc
    )
    
    // Store pending transaction in daily_passes (optional, but useful for tracking)
    // We'll create a record with status 'pending' and later update on callback
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 1) // 24 hours from now
    
    const { error: insertError } = await supabase
      .from('daily_passes')
      .insert({
        farmer_id: farmer.id,
        mpesa_tx_id: checkoutRequestID, // temp, will be replaced with real transaction ID later
        amount_kes: DAILY_PASS_PRICE,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      })
    
    if (insertError) {
      console.error('Failed to record pending pass:', insertError)
      // Still return success to user, but log error
    }
    
    return new Response(JSON.stringify({
      success: true,
      checkoutRequestID,
      message: 'STK Push sent. Please check your phone and enter M-Pesa PIN.'
    }), { status: 200, headers: corsHeaders })
    
  } catch (error) {
    console.error('M-Pesa error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Payment initiation failed' 
    }), { status: 500, headers: corsHeaders })
  }
})
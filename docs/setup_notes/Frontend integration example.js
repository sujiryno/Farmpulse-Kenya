// Request daily pass purchase
async function buyDailyPass(phoneNumber) {
  const response = await fetch('https://your-project.supabase.co/functions/v1/mpesa-daily-pass', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber })
  })
  
  const data = await response.json()
  if (data.success) {
    // Show "Check your phone and enter PIN" message
    // Poll for pass activation or rely on webhook to update UI
    startPollingForPassActivation()
  } else {
    alert(data.error)
  }
}

// Poll daily for active pass status (or use websockets)
async function checkActivePass(phoneNumber) {
  const { data } = await supabase
    .from('daily_passes')
    .select('expires_at')
    .eq('status', 'confirmed')
    .gte('expires_at', new Date().toISOString())
    .maybeSingle()
  
  return !!data
}
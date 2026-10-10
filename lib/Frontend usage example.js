// Call from your web/mobile app
const response = await fetch('https://your-project.supabase.co/functions/v1/disease-predictor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '254712345678',
    poultryType: 'layer',
    symptoms: ['drooping wings', 'bloody droppings', 'lethargy'],
    photoBase64: 'data:image/jpeg;base64,...' // optional
  })
})

const data = await response.json()
if (data.error === 'FREE_LIMIT_REACHED') {
  // Show M-Pesa daily pass paywall
} else if (data.success) {
  console.log(data.diagnoses)
  console.log(`Remaining free sessions today: ${data.usage.remainingFree}`)
}
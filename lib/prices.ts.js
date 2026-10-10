await fetch('/functions/v1/submit-price', {
  method: 'POST',
  body: JSON.stringify({
    type: 'feed',
    farmerPhone: '254712345678',
    data: {
      brand: 'Unga Farmcare',
      poultry_type: 'broiler',
      feed_type: 'starter',
      price_kes: 3200,
      county: 'Kiambu'
    }
  })
})
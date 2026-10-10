// ... (previous code with additional checks)

// For feed prices: prevent duplicate unverified submissions from same user within 24h
const { data: existing } = await supabase
  .from('feed_prices')
  .select('id')
  .eq('brand', data.brand)
  .eq('poultry_type', data.poultry_type)
  .eq('feed_type', data.feed_type)
  .eq('county', data.county)
  .eq('submitted_by', farmer.id)
  .gte('submitted_at', new Date(Date.now() - 24*60*60*1000).toISOString())
  .maybeSingle();

if (existing) {
  return new Response(JSON.stringify({ error: 'You already submitted this price recently. Pending moderation.' }), { status: 409 });
}
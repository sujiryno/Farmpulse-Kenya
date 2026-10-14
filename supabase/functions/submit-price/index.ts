// supabase/functions/submit-price/index.ts  (JWT verified; farmer comes from the session)
import { adminClient, handleMethod, json, requireFarmer } from '../_shared/http.ts'

type Spec = { table: string; fields: Record<string, 'text' | 'number'>; dupeKeys: string[] }

// Whitelisted columns only: the client can never set verified, submitted_by, etc.
// TODO: adjust medicine fields to match your medicine_prices table once it exists.
const SPECS: Record<string, Spec> = {
  feed: {
    table: 'feed_prices',
    fields: { brand: 'text', poultry_type: 'text', feed_type: 'text', price_kes: 'number', county: 'text' },
    dupeKeys: ['brand', 'poultry_type', 'feed_type', 'county'],
  },
  medicine: {
  table: 'medicine_prices',
  fields: { name: 'text', active_ingredient: 'text', pack_size: 'text', supplier: 'text', price_kes: 'number', county: 'text' },
  dupeKeys: ['name', 'supplier', 'county'],
 },
}

Deno.serve(async (req: Request) => {
  const early = handleMethod(req)
  if (early) return early

  try {
    const body = await req.json().catch(() => null)
    const spec = SPECS[body?.type]
    if (!spec || typeof body?.data !== 'object' || body.data === null) return json({ error: "type must be 'feed' or 'medicine' with a data object." }, 400)

    const row: Record<string, string | number> = {}
    for (const [key, kind] of Object.entries(spec.fields)) {
      const v = body.data[key]
      if (v === undefined || v === null || v === '') continue
      if (kind === 'number') {
        const n = Number(v)
        if (!Number.isFinite(n) || n <= 0 || n > 1_000_000) return json({ error: `${key} must be a positive number.` }, 400)
        row[key] = n
      } else {
        row[key] = String(v).trim().slice(0, 100)
      }
    }
    if (row.price_kes === undefined) return json({ error: 'price_kes is required.' }, 400)

    const supabase = adminClient()
    const auth = await requireFarmer(req, supabase, 'id')
    if ('error' in auth) return auth.error
    const farmerId = auth.farmer.id

    // Duplicate guard: same item/county from the same farmer within 24h
    let dupe = supabase.from(spec.table).select('id').eq('submitted_by', farmerId)
      .gte('submitted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    for (const k of spec.dupeKeys) if (row[k] !== undefined) dupe = dupe.eq(k, row[k])
    const { data: existing } = await dupe.limit(1)
    if (existing && existing.length > 0) return json({ error: 'You already submitted this price recently. It is pending moderation.' }, 409)

    const { error } = await supabase.from(spec.table).insert({
      ...row, submitted_by: farmerId, verified: false, submitted_at: new Date().toISOString(),
    })
    if (error) {
      console.error('submit-price insert error:', error)
      return json({ error: 'Could not save price.' }, 500)
    }
    return json({ success: true, message: 'Price submitted for moderation.' })
  } catch (err) {
    console.error('submit-price error:', err)
    return json({ error: 'Internal server error' }, 500)
  }
})

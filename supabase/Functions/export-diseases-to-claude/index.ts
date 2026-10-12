// supabase/functions/export-diseases-to-claude/index.ts
// verify_jwt = false (see config.toml); protected by CRON_SECRET instead.
import { adminClient, hasCronSecret, json } from '../_shared/http.ts'

Deno.serve(async (req: Request) => {
  if (!hasCronSecret(req)) return json({ error: 'Unauthorized' }, 401)

  const supabase = adminClient()
  const { data: diseases, error } = await supabase.from('diseases').select('*').order('id')
  if (error) {
    console.error('Error fetching diseases:', error)
    return json({ error: error.message }, 500)
  }
  if (!diseases || diseases.length === 0) return json({ warning: 'No diseases found' })

  const claudeArray = diseases.map((d: any) => ({
    name: d.name,
    poultry_types: d.poultry_types,
    symptoms: d.symptoms,
    cause: d.cause,
    treatment: d.treatment,
    prevention: d.prevention,
    mortality_rate: d.mortality_rate,
    recommended_medicines: d.recommended_medicines ?? [],
  }))

  const updated_at = new Date().toISOString()
  const { error: upsertError } = await supabase
    .from('app_config')
    .upsert({ key: 'claude_disease_library', value: JSON.stringify(claudeArray), updated_at }, { onConflict: 'key' })
  if (upsertError) {
    console.error('Error upserting config:', upsertError)
    return json({ error: upsertError.message }, 500)
  }
  return json({ success: true, count: diseases.length, updated_at })
})

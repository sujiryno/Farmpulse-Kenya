// app/page.tsx
import { createClient } from '@/lib/supabase/server'
// app/page.tsx
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'  // ← ADD THIS LINE

export default async function Home() {
  const supabase = await createClient()
  const { data, error, count } = await supabase
    .from('diseases')
    .select('id, name', { count: 'exact' })
    .order('name')
    .limit(5)

  // ... rest of the file stays the same
}
export default async function Home() {
  const supabase = await createClient()
  const { data, error, count } = await supabase
    .from('diseases')
    .select('id, name', { count: 'exact' })
    .order('name')
    .limit(5)

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-green-800">FarmPulse Kenya</h1>
      {error ? (
        <p className="mt-4 text-red-600">❌ Error: {error.message}</p>
      ) : (
        <div className="mt-4">
          <p className="font-semibold text-green-600">✅ Connected to Supabase!</p>
          <p className="mt-2">Found <strong>{count}</strong> diseases.</p>
          <ul className="mt-4 space-y-1">
            {data?.map((d) => <li key={d.id}>• {d.name}</li>)}
          </ul>
        </div>
      )}
    </main>
  )
}
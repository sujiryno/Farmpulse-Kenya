import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data, error, count } = await supabase
    .from('diseases')
    .select('*', { count: 'exact' })

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-green-800">FarmPulse Kenya</h1>
      {error ? (
        <p className="mt-4 text-red-600">❌ Error: {error.message}</p>
      ) : (
        <div className="mt-4">
          <p className="text-green-600 font-semibold">✅ Connected to Supabase!</p>
          <p className="mt-2">Found <strong>{count}</strong> diseases.</p>
          <ul className="mt-4 space-y-1">
            {data?.slice(0, 5).map((d) => (
              <li key={d.id}>• {d.name}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  )
}
// app/vets/page.tsx
import { connection } from 'next/server'
import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const COUNTIES = ['All', 'Kiambu', 'Nairobi', 'Nakuru', 'Kisumu', 'Mombasa']

async function VetList({
  searchParams,
}: {
  searchParams: Promise<{ county?: string }>
}) {
  await connection()  
  const params = await searchParams
  const county = params.county ?? 'All'

  const supabase = await createClient()

  let query = supabase
    .from('vets')
    .select('id, name, phone, email, county, specialisation, kvb_number, verified')
    .eq('verified', true)
    .order('name')

  if (county && county !== 'All') {
    query = query.eq('county', county)
  }

  const { data, error } = await query

  if (error) return <p className="text-red-600 py-6">❌ {error.message}</p>

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
        <p className="text-gray-500 mb-2">
          No verified vets yet{county !== 'All' ? ` in ${county}` : ''}.
        </p>
        <p className="text-sm text-gray-400">
          Vet registration is coming soon.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {data.map((vet) => (
        <div
          key={vet.id}
          className="bg-white rounded-lg border border-gray-100 p-5 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl flex-shrink-0">
              👨‍⚕️
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-green-800">{vet.name}</h3>
              {vet.specialisation && (
                <p className="text-sm text-gray-600">{vet.specialisation}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                📍 {vet.county} · KVB: {vet.kvb_number}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <a
              href={`tel:${vet.phone}`}
              className="block text-sm font-medium text-green-700 hover:underline"
            >
              📞 {vet.phone}
            </a>
            {vet.email && (
              <a
                href={`mailto:${vet.email}`}
                className="block text-sm text-gray-600 hover:underline"
              >
                ✉️ {vet.email}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-gray-100 p-5 animate-pulse h-32"
        />
      ))}
    </div>
  )
}

export default function VetsPage({
  searchParams,
}: {
  searchParams: Promise<{ county?: string }>
}) {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-green-700 hover:underline">
        ← Back to home
      </Link>

      <h1 className="text-3xl font-bold text-green-800 mt-3 mb-2">
        Find a Vet
      </h1>
      <p className="text-gray-600 mb-6">
        Registered veterinarians across Kenya. Contact them directly.
      </p>

      <form method="GET" className="mb-6">
        <div className="flex flex-wrap gap-2">
          {COUNTIES.map((c) => (
            <button
              key={c}
              type="submit"
              name="county"
              value={c}
              className="px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-green-50 hover:border-green-300 transition-colors"
            >
              {c}
            </button>
          ))}
        </div>
      </form>

      <Suspense fallback={<Skeleton />}>
        <VetList searchParams={searchParams} />
      </Suspense>
    </main>
  )
}
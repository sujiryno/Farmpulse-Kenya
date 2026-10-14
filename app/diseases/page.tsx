// app/diseases/page.tsx
import { connection } from 'next/server'
import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const POULTRY_TYPES = [
  { value: 'all', label: 'All Birds' },
  { value: 'broiler', label: 'Broilers' },
  { value: 'layer', label: 'Layers' },
  { value: 'kienyeji', label: 'Kienyeji' },
]

// ─────────────────────────────────────────────────────────
// Async child that reads searchParams + fetches data
// ─────────────────────────────────────────────────────────
async function DiseaseResults({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>
}) {
   await connection()
  const params = await searchParams
  const q = params.q ?? ''
  const type = params.type ?? 'all'

  const supabase = await createClient()

  let query = supabase
    .from('diseases')
    .select('id, name, poultry_types, symptoms, mortality_rate')
    .order('name')

  if (q) {
  // Search name OR any symptom
  query = query.or(`name.ilike.%${q}%,symptoms.cs.{${q}}`)
}
  if (type && type !== 'all') query = query.contains('poultry_types', [type])

  const { data, error } = await query

  if (error) {
    return (
      <p className="text-center text-red-600 py-8">
        ❌ Error loading diseases: {error.message}
      </p>
    )
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">
        No diseases match your search.
      </p>
    )
  }

  return (
    <>
      <p className="text-sm text-gray-500 mb-4">
        Showing {data.length} {data.length === 1 ? 'disease' : 'diseases'}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((disease) => (
          <Link
            key={disease.id}
            href={`/diseases/${disease.id}`}
            className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-5 border border-gray-100"
          >
            <h3 className="font-bold text-lg text-green-800 mb-2">
              {disease.name}
            </h3>

            <div className="flex flex-wrap gap-1 mb-3">
              {disease.poultry_types?.map((t: string) => (
                <span
                  key={t}
                  className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full capitalize"
                >
                  {t}
                </span>
              ))}
            </div>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {disease.symptoms?.slice(0, 3).join(', ')}
              {disease.symptoms && disease.symptoms.length > 3 ? '…' : ''}
            </p>

            {disease.mortality_rate && (
              <p className="text-xs text-red-600 font-medium">
                ⚠️ Mortality: {disease.mortality_rate}
              </p>
            )}
          </Link>
        ))}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────
// Loading skeleton shown while DiseaseResults is fetching
// ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-lg p-5 border border-gray-100 animate-pulse"
        >
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Static shell — renders instantly
// ─────────────────────────────────────────────────────────
export default function DiseasesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>
}) {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="text-sm text-green-700 hover:underline">
            ← Back to home
          </Link>
          <h1 className="text-3xl font-bold text-green-800 mt-3 mb-2">
            Disease Library
          </h1>
          <p className="text-gray-600">
            Browse common poultry diseases in Kenya
          </p>
        </div>

        {/* Static search form (uses GET, no client JS needed) */}
        <form method="GET" className="mb-6 space-y-3">
          <input
            type="text"
            name="q"
            placeholder="Search diseases by name..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />

          <div className="flex flex-wrap gap-2">
            {POULTRY_TYPES.map((pt) => (
              <button
                key={pt.value}
                type="submit"
                name="type"
                value={pt.value}
                className="px-4 py-2 rounded-full text-sm font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                {pt.label}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="w-full md:w-auto bg-green-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-800 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Dynamic results streamed in */}
        <Suspense fallback={<LoadingSkeleton />}>
          <DiseaseResults searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  )
}
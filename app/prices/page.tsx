// app/prices/page.tsx
import { connection } from 'next/server'
import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const COUNTIES = ['All', 'Kiambu', 'Nairobi', 'Nakuru', 'Kisumu', 'Mombasa']

async function PriceList({
  searchParams,
}: {
  searchParams: Promise<{ county?: string }>
}) {
  await connection()
  const params = await searchParams
  const county = params.county ?? 'All'

  const supabase = await createClient()

  let query = supabase
    .from('feed_prices')
    .select('id, brand, poultry_type, feed_type, price_kes, county, verified, submitted_at')
    .eq('verified', true)
    .order('price_kes')

  if (county && county !== 'All') {
    query = query.eq('county', county)
  }

  const { data, error } = await query

  if (error) {
    return <p className="text-red-600 py-6">❌ Error: {error.message}</p>
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
        <p className="text-gray-500 mb-2">
          No verified prices yet{county !== 'All' ? ` for ${county}` : ''}.
        </p>
        <p className="text-sm text-gray-400">
          Prices appear here once farmers and agrovets submit and admins verify them.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-100">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 text-left">
          <tr>
            <th className="p-3 font-medium">Brand</th>
            <th className="p-3 font-medium">Type</th>
            <th className="p-3 font-medium">Feed</th>
            <th className="p-3 font-medium">County</th>
            <th className="p-3 font-medium text-right">Price (KES)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => (
            <tr key={p.id} className="border-t border-gray-100">
              <td className="p-3 font-medium text-gray-800">{p.brand}</td>
              <td className="p-3 text-gray-600 capitalize">{p.poultry_type}</td>
              <td className="p-3 text-gray-600 capitalize">{p.feed_type}</td>
              <td className="p-3 text-gray-600">{p.county}</td>
              <td className="p-3 text-right font-bold text-green-800">
                {Number(p.price_kes).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-100 animate-pulse">
      <div className="h-12 bg-gray-100"></div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-12 border-t border-gray-100"></div>
      ))}
    </div>
  )
}

export default function PricesPage({
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
        Feed Prices
      </h1>
      <p className="text-gray-600 mb-6">
        Compare current poultry feed prices across Kenya.
      </p>

      <form method="GET" className="mb-6 space-y-3">
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

      <Suspense fallback={<LoadingSkeleton />}>
        <PriceList searchParams={searchParams} />
      </Suspense>

      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-5">
        <p className="text-sm text-green-800">
          💡 <strong>Want to add a price?</strong> Farmer submissions are coming soon.
        </p>
      </div>
    </main>
  )
}
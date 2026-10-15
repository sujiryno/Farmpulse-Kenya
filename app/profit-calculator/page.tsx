// app/profit-calculator/page.tsx
import { connection } from 'next/server'
import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ProfitForm from '@/components/ProfitForm'
import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Profit Calculator',
  description: 'Estimate profit or loss for your flock cycle.',
}

async function Calculator() {
  await connection() 
  const supabase = await createClient()
  const { data } = await supabase
    .from('feed_prices')
    .select('brand, feed_type, price_kes, county')
    .eq('verified', true)
    .order('brand')

  return <ProfitForm feedPrices={data ?? []} />
}

export default function ProfitPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-green-700 hover:underline">
        ← Back to home
      </Link>

      <h1 className="text-3xl font-bold text-green-800 mt-3 mb-2">
        Profit Calculator
      </h1>
      <p className="text-gray-600 mb-6">
        Estimate profit or loss for your flock cycle. Feed prices are pulled
        from the live database.
      </p>

      <Suspense fallback={<p className="text-gray-500">Loading…</p>}>
        <Calculator />
      </Suspense>
    </main>
  )
}
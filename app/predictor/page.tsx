// app/predictor/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'          // ← ADD THIS IMPORT
import { createClient } from '@/lib/supabase/server'
import PredictorClient from '@/components/PredictorClient'

async function AuthenticatedPredictor() {
  await connection()                               // ← ADD THIS FIRST LINE
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <PredictorClient />
}

export default function PredictorPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="text-sm text-green-700 hover:underline">
          ← Back to home
        </Link>
        <h1 className="text-3xl font-bold text-green-800 mt-3 mb-2">
          AI Disease Predictor
        </h1>
        <p className="text-gray-600 mb-6">
          Select symptoms and optionally upload a photo — get an instant AI
          diagnosis.
        </p>
        <Suspense
          fallback={
            <div className="bg-white rounded-lg p-8 border border-gray-100 text-center text-gray-500">
              Checking your session…
            </div>
          }
        >
          <AuthenticatedPredictor />
        </Suspense>
      </div>
    </main>
  )
}
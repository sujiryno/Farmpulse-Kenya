// app/diseases/[id]/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ─────────────────────────────────────────────────────────
// Async child that fetches the disease by ID
// ─────────────────────────────────────────────────────────
async function DiseaseDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: disease, error } = await supabase
    .from('diseases')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return (
      <p className="text-center text-red-600 py-8">
        ❌ Error loading disease: {error.message}
      </p>
    )
  }

  if (!disease) {
    notFound()
  }

  return (
    <article className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-green-800 mb-3">
          {disease.name}
        </h1>

        <div className="flex flex-wrap gap-1 mb-3">
          {disease.poultry_types?.map((t: string) => (
            <span
              key={t}
              className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full capitalize font-medium"
            >
              {t}
            </span>
          ))}
        </div>

        {disease.mortality_rate && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <strong>⚠️ Estimated Mortality:</strong> {disease.mortality_rate}
            </p>
          </div>
        )}
      </header>

      {/* Symptoms */}
      <Section title="🩺 Symptoms" color="blue">
        <ul className="space-y-2">
          {disease.symptoms?.map((s: string, i: number) => (
            <li
              key={i}
              className="flex items-start gap-2 text-gray-700 capitalize"
            >
              <span className="text-blue-500 mt-1">•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Cause */}
      <Section title="🔬 Cause" color="purple">
        <p className="text-gray-700">{disease.cause}</p>
      </Section>

      {/* Treatment */}
      <Section title="💊 Treatment" color="green">
        <p className="text-gray-700 whitespace-pre-line">
          {disease.treatment}
        </p>
      </Section>

      {/* Prevention */}
      <Section title="🛡️ Prevention" color="amber">
        <p className="text-gray-700 whitespace-pre-line">
          {disease.prevention}
        </p>
      </Section>

      {/* Recommended Medicines */}
      {disease.recommended_medicines &&
        disease.recommended_medicines.length > 0 && (
          <Section title="💉 Recommended Medicines" color="teal">
            <ul className="space-y-2">
              {disease.recommended_medicines.map(
                (med: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-gray-700"
                  >
                    <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />
                    <span>{med}</span>
                  </li>
                )
              )}
            </ul>
            <p className="text-xs text-gray-500 mt-3 italic">
              Always confirm dosages with a licensed veterinarian or agrovet.
            </p>
          </Section>
        )}

      {/* Call to Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
        <Link
          href="/predictor"
          className="block text-center bg-green-700 hover:bg-green-800 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          🤖 Run AI Diagnosis
        </Link>
        <Link
          href="/vets"
          className="block text-center bg-white hover:bg-gray-50 text-green-700 font-medium py-3 px-4 rounded-lg border-2 border-green-700 transition-colors"
        >
          👨‍⚕️ Find a Vet
        </Link>
      </div>
    </article>
  )
}

// ─────────────────────────────────────────────────────────
// Reusable section component
// ─────────────────────────────────────────────────────────
function Section({
  title,
  children,
  color,
}: {
  title: string
  children: React.ReactNode
  color: 'blue' | 'purple' | 'green' | 'amber' | 'teal'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
    amber: 'bg-amber-50 border-amber-200',
    teal: 'bg-teal-50 border-teal-200',
  }

  return (
    <section
      className={`rounded-lg border p-5 ${colorClasses[color]}`}
    >
      <h2 className="text-lg font-bold text-gray-800 mb-3">{title}</h2>
      {children}
    </section>
  )
}

// ─────────────────────────────────────────────────────────
// Loading skeleton
// ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 bg-gray-200 rounded w-2/3 mb-3"></div>
        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 bg-white p-5"
        >
          <div className="h-5 bg-gray-200 rounded w-1/4 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Static shell
// ─────────────────────────────────────────────────────────
export default function DiseaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/diseases"
          className="text-sm text-green-700 hover:underline inline-block mb-6"
        >
          ← Back to library
        </Link>

        <Suspense fallback={<LoadingSkeleton />}>
          <DiseaseDetail params={params} />
        </Suspense>
      </div>
    </main>
  )
}
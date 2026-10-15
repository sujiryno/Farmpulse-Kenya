// components/PredictorClient.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Diagnosis = {
  disease_name: string
  confidence: number
  symptom_match_summary: string
  recommended_medicines: string[]
  preventive_advice: string
}

type Result = {
  success: boolean
  diagnoses: Diagnosis[]
  urgent: boolean
  urgent_reason: string
  usage: { usedToday: number; remainingFree: number; hasActivePass: boolean }
  disclaimer: string
}

const SYMPTOM_GROUPS = [
  {
    name: 'Behaviour',
    symptoms: ['Lethargy', 'Hunched posture', 'Twisted neck', 'Sudden death', 'Reduced feed intake'],
  },
  {
    name: 'Breathing',
    symptoms: ['Laboured breathing', 'Gasping', 'Coughing', 'Sneezing'],
  },
  {
    name: 'Eyes & Face',
    symptoms: ['Dull eyes', 'Watery eyes', 'Swollen eyes', 'Facial swelling', 'Pale comb'],
  },
  {
    name: 'Feathers & Body',
    symptoms: ['Ruffled feathers', 'Drooping wings', 'Feather loss', 'Weight loss', 'Poor growth'],
  },
  {
    name: 'Droppings',
    symptoms: ['Greenish diarrhoea', 'Bloody droppings', 'White pasted vent', 'Watery droppings'],
  },
  {
    name: 'Legs & Movement',
    symptoms: ['Leg paralysis', 'Lameness', 'Swollen joints'],
  },
]

const POULTRY_TYPES = [
  { value: 'broiler', label: 'Broiler' },
  { value: 'layer', label: 'Layer' },
  { value: 'kienyeji', label: 'Kienyeji' },
]

export default function PredictorClient() {

  const [poultryType, setPoultryType] = useState('broiler')
  const [selected, setSelected] = useState<string[]>([])
  const [photoBase64, setPhotoBase64] = useState<string | null>(null)
  const [photoMime, setPhotoMime] = useState('image/jpeg')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  function toggleSymptom(s: string) {
    setSelected((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Photo must be JPEG or PNG.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be 5MB or smaller.')
      return
    }

    setError('')
    setPhotoMime(file.type)

    const reader = new FileReader()
    reader.onload = () => {
      setPhotoBase64(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    setError('')
    setResult(null)

    if (selected.length === 0) {
      setError('Please select at least one symptom.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('You must be signed in. Please log in first.')
        setLoading(false)
        return
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/disease-predictor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            poultryType,
            symptoms: selected,
            photoBase64: photoBase64 ?? undefined,
            photoMimeType: photoMime,
          }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'FREE_LIMIT_REACHED') {
          setError(
            'You have used your 2 free sessions today. Buy a daily pass to continue.'
          )
        } else {
          setError(data.error ?? 'Diagnosis failed. Please try again.')
        }
        return
      }

      setResult(data as Result)
    } catch (err: any) {
      setError(err.message ?? 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Poultry Type */}
      <section className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-lg text-green-800 mb-3">
          1. Select poultry type
        </h2>
        <div className="flex flex-wrap gap-2">
          {POULTRY_TYPES.map((pt) => (
            <button
              key={pt.value}
              onClick={() => setPoultryType(pt.value)}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                poultryType === pt.value
                  ? 'bg-green-700 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {pt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Symptoms */}
      <section className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-lg text-green-800 mb-3">
          2. Select symptoms
        </h2>
        <div className="space-y-4">
          {SYMPTOM_GROUPS.map((group) => (
            <div key={group.name}>
              <p className="text-sm font-semibold text-gray-500 mb-2">
                {group.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.symptoms.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSymptom(s)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      selected.includes(s)
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {selected.length > 0 && (
          <p className="text-sm text-gray-500 mt-3">
            {selected.length} symptom{selected.length > 1 ? 's' : ''} selected
          </p>
        )}
      </section>

      {/* Photo (optional) */}
      <section className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-lg text-green-800 mb-3">
          3. Upload a photo (optional)
        </h2>
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={handlePhoto}
          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
        />
        {photoBase64 && (
          <p className="text-sm text-green-700 mt-2">
            ✅ Photo attached — the AI will analyse it.
          </p>
        )}
      </section>

      {/* Submit */}
      {error && (
        <p className="text-red-600 bg-red-50 p-3 rounded">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || selected.length === 0}
        className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-white font-bold py-4 rounded-lg transition-colors text-lg"
      >
        {loading ? 'Analysing…' : '🤖 Get AI Diagnosis'}
      </button>

      {/* Results */}
      {result && (
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold text-xl text-green-800">Diagnosis</h2>
            <p className="text-sm text-gray-500">
              Free sessions left today: {result.usage.remainingFree}
            </p>
          </div>

          {result.urgent && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="font-bold text-red-800">⚠️ Urgent</p>
              <p className="text-sm text-red-700">{result.urgent_reason}</p>
            </div>
          )}

          {result.diagnoses.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
              No matching diseases found. Please consult a veterinarian.
            </p>
          ) : (
            result.diagnoses.map((d, i) => (
              <div
                key={i}
                className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg text-green-800">
                    {d.disease_name}
                  </h3>
                  <span
                    className={`text-sm font-bold px-2 py-1 rounded ${
                      d.confidence >= 70
                        ? 'bg-red-100 text-red-700'
                        : d.confidence >= 40
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {d.confidence}%
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-3">
                  {d.symptom_match_summary}
                </p>

                {d.recommended_medicines.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Medicines
                    </p>
                    <ul className="text-sm text-gray-700 mb-3 list-disc list-inside">
                      {d.recommended_medicines.map((m, j) => (
                        <li key={j}>{m}</li>
                      ))}
                    </ul>
                  </>
                )}

                {d.preventive_advice && (
                  <>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Prevention
                    </p>
                    <p className="text-sm text-gray-700">
                      {d.preventive_advice}
                    </p>
                  </>
                )}
              </div>
            ))
          )}

          <p className="text-xs text-gray-500 italic text-center pt-2">
            {result.disclaimer}
          </p>
        </section>
      )}
    </div>
  )
}
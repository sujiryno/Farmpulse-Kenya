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

// ─────────────────────────────────────────────────────────
// Symptom library — bilingual, emoji-coded
// 'value' is what we send to the AI (matches disease library)
// 'en' / 'sw' are what the farmer sees
// ─────────────────────────────────────────────────────────
type Symptom = {
  value: string
  en: string
  sw: string
  emoji: string
}

type SymptomGroup = {
  name_en: string
  name_sw: string
  symptoms: Symptom[]
}

const SYMPTOM_GROUPS: SymptomGroup[] = [
  {
    name_en: 'Behaviour',
    name_sw: 'Tabia',
    symptoms: [
      { value: 'lethargy', en: 'Very tired / no energy', sw: 'Mnyonge / Hana nguvu', emoji: '😴' },
      { value: 'hunched posture', en: 'Sitting hunched', sw: 'Amejikunyata', emoji: '🪑' },
      { value: 'twisted neck', en: 'Twisted / bent neck', sw: 'Shingo iliyopinda', emoji: '🔄' },
      { value: 'sudden death', en: 'Sudden death', sw: 'Kifo cha ghafla', emoji: '⚰️' },
      { value: 'reduced feed intake', en: 'Not eating well', sw: 'Hakuli vizuri', emoji: '🍽️' },
    ],
  },
  {
    name_en: 'Breathing',
    name_sw: 'Kupumua',
    symptoms: [
      { value: 'laboured breathing', en: 'Breathing with difficulty', sw: 'Kupumua kwa shida', emoji: '😮‍💨' },
      { value: 'gasping', en: 'Gasping for air', sw: 'Kupumua kwa shida sana', emoji: '🌬️' },
      { value: 'coughing', en: 'Coughing', sw: 'Kukohoa', emoji: '🤧' },
      { value: 'sneezing', en: 'Sneezing', sw: 'Kupiga chafya', emoji: '🤧' },
    ],
  },
  {
    name_en: 'Eyes & Face',
    name_sw: 'Macho na Uso',
    symptoms: [
      { value: 'dull eyes', en: 'Dull / sleepy eyes', sw: 'Macho hafifu', emoji: '👁️' },
      { value: 'watery eyes', en: 'Watery eyes', sw: 'Macho yenye maji', emoji: '💧' },
      { value: 'swollen eyes', en: 'Swollen eyes', sw: 'Macho yaliyovimba', emoji: '🫧' },
      { value: 'facial swelling', en: 'Swollen face', sw: 'Uso umevimba', emoji: '😷' },
      { value: 'pale comb', en: 'Pale or white comb', sw: 'Kibaba cheupe', emoji: '🤍' },
    ],
  },
  {
    name_en: 'Feathers & Body',
    name_sw: 'Manyoya na Mwili',
    symptoms: [
      { value: 'ruffled feathers', en: 'Feathers standing up', sw: 'Manyoya yaliyosimama', emoji: '🪶' },
      { value: 'drooping wings', en: 'Wings hanging down', sw: 'Mbawa zimelegea', emoji: '🐦' },
      { value: 'feather loss', en: 'Losing feathers', sw: 'Manyoya kumwagika', emoji: '🍂' },
      { value: 'weight loss', en: 'Getting thin', sw: 'Kukonda', emoji: '📉' },
      { value: 'poor growth', en: 'Growing slowly', sw: 'Kukua polepole', emoji: '🐤' },
    ],
  },
  {
    name_en: 'Droppings',
    name_sw: 'Kinyesi',
    symptoms: [
      { value: 'greenish diarrhoea', en: 'Green diarrhoea', sw: 'Kuhara kijani', emoji: '🟢' },
      { value: 'bloody droppings', en: 'Blood in droppings', sw: 'Kuhara damu', emoji: '🩸' },
      { value: 'white pasted vent', en: 'White paste on vent', sw: 'Kinyesi cheupe kwenye tundu', emoji: '⚪' },
      { value: 'watery droppings', en: 'Watery droppings', sw: 'Kuhara maji', emoji: '💧' },
    ],
  },
  {
    name_en: 'Legs & Movement',
    name_sw: 'Miguu na Mwendo',
    symptoms: [
      { value: 'leg paralysis', en: 'Cannot move legs', sw: 'Miguu kupooza', emoji: '🦵' },
      { value: 'lameness', en: 'Limping', sw: 'Kuchechemea', emoji: '🦶' },
      { value: 'swollen joints', en: 'Swollen joints', sw: 'Viungo kuvimba', emoji: '🦴' },
    ],
  },
]

const POULTRY_TYPES = [
  { value: 'broiler', en: 'Broiler', sw: 'Kuku wa nyama' },
  { value: 'layer', en: 'Layer', sw: 'Kuku wa mayai' },
  { value: 'kienyeji', en: 'Kienyeji', sw: 'Kienyeji' },
]

export default function PredictorClient() {
  const [lang, setLang] = useState<'en' | 'sw'>('en')   // ← ADD THIS

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
  <div className="flex items-center justify-between mb-3">
    <h2 className="font-bold text-lg text-green-800">
      {lang === 'en' ? '1. Select poultry type' : '1. Chagua aina ya kuku'}
    </h2>
    <button
      onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}
      className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-800 hover:bg-green-200"
    >
      {lang === 'en' ? '🇰🇪 SW' : '🇬🇧 EN'}
    </button>
  </div>
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
        {lang === 'en' ? pt.en : pt.sw}
      </button>
    ))}
  </div>
</section>

     {/* Symptoms */}
<section className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
  <h2 className="font-bold text-lg text-green-800 mb-3">
    {lang === 'en' ? '2. Select symptoms' : '2. Chagua dalili'}
  </h2>
  <div className="space-y-4">
    {SYMPTOM_GROUPS.map((group) => (
      <div key={group.name_en}>
        <p className="text-sm font-semibold text-gray-500 mb-2">
          {lang === 'en' ? group.name_en : group.name_sw}
        </p>
        <div className="flex flex-wrap gap-2">
          {group.symptoms.map((s) => {
            const isSelected = selected.includes(s.value)
            return (
              <button
                key={s.value}
                onClick={() => toggleSymptom(s.value)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-colors ${
                  isSelected
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50 hover:border-green-300'
                }`}
              >
                <span className="text-base">{s.emoji}</span>
                <span>{lang === 'en' ? s.en : s.sw}</span>
              </button>
            )
          })}
        </div>
      </div>
    ))}
  </div>
  {selected.length > 0 && (
    <p className="text-sm text-gray-500 mt-3">
      {lang === 'en'
        ? `${selected.length} symptom${selected.length > 1 ? 's' : ''} selected`
        : `Dalili ${selected.length} zimechaguliwa`}
    </p>
  )}
</section>

      {/* Photo (optional) */}
      <section className="bg-white rounded-lg p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-lg text-green-800 mb-3">
          {lang === 'en' ? '3. Upload a photo (optional)' : '3. Pakia picha (si lazima)'}
          
        </h2>
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={handlePhoto}
          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
        />
        {photoBase64 && (
         <p className="text-sm text-green-700 mt-2">
          {lang === 'en'
            ? '✅ Photo attached — the AI will analyse it.'
            : '✅ Picha imepakiwa — AI itaichunguza.'}
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
       {loading
  ? (lang === 'en' ? 'Analysing…' : 'Inachunguza…')
  : (lang === 'en' ? '🤖 Get AI Diagnosis' : '🤖 Pata Uchunguzi wa AI')}
      </button>

      {/* Results */}
      {result && (
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold text-xl text-green-800">
  {lang === 'en' ? 'Diagnosis' : 'Uchunguzi'}
</h2>
            <p className="text-sm text-gray-500">
  {lang === 'en'
    ? `Free sessions left today: ${result.usage.remainingFree}`
    : `Vikao vya bure vilivyobaki leo: ${result.usage.remainingFree}`}
</p>
          </div>

          {result.urgent && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="font-bold text-red-800">
  {lang === 'en' ? '⚠️ Urgent' : '⚠️ Dharura'}
</p>
              <p className="text-sm text-red-700">{result.urgent_reason}</p>
            </div>
          )}

          {result.diagnoses.length === 0 ? (
            <p className="text-gray-500 text-center py-6">
               {lang === 'en'
    ? 'No matching diseases found. Please consult a veterinarian.'
    : 'Hakuna ugonjwa unaolingana. Tafadhali wasiliana na daktari wa mifugo.'}
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
                       {lang === 'en' ? 'Medicines' : 'Dawa'}
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
                      {lang === 'en' ? 'Prevention' : 'Kuzuia'}
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
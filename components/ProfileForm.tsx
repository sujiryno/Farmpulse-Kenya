// components/ProfileForm.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { KENYA_COUNTIES, POULTRY_TYPES } from '@/lib/constants'


type Farmer = {
  id: string
  name: string
  phone: string
  county: string
  poultry_types: string[]
  flock_size: number | null
  market_channel: string | null
  role: string
}

export default function ProfileForm({ farmer }: { farmer: Farmer }) {
  const [name, setName] = useState(farmer.name ?? '')
  const [phone, setPhone] = useState(farmer.phone ?? '')
  const [county, setCounty] = useState(farmer.county ?? 'Kiambu')
  const [poultryTypes, setPoultryTypes] = useState<string[]>(
    farmer.poultry_types ?? []
  )
  const [flockSize, setFlockSize] = useState(
    farmer.flock_size ? String(farmer.flock_size) : ''
  )
  const [marketChannel, setMarketChannel] = useState(
    farmer.market_channel ?? 'local'
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  function toggleType(t: string) {
    setPoultryTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    )
  }

  async function save() {
    setSaving(true)
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase
      .from('farmers')
      .update({
        name,
        county,
        poultry_types: poultryTypes,
        flock_size: flockSize ? parseInt(flockSize) : null,
        market_channel: marketChannel,
      })
      .eq('id', farmer.id)

    setSaving(false)
    if (error) {
      setMessage('❌ ' + error.message)
    } else {
      setMessage('✅ Saved!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Basic info */}
      <section className="bg-white rounded-lg border border-gray-100 p-5">
        <h2 className="font-bold text-green-800 mb-4">Basic info</h2>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 mb-3 focus:outline-none focus:ring-2 focus:ring-green-600"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone (read-only)
        </label>
        <input
          value={phone}
          disabled
          className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 mb-3"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          County
        </label>
        <select
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          {KENYA_COUNTIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </section>

      {/* Flock info */}
      <section className="bg-white rounded-lg border border-gray-100 p-5">
        <h2 className="font-bold text-green-800 mb-4">Your flock</h2>

        <label className="block text-sm font-medium text-gray-700 mb-2">
          Poultry types you keep
        </label>
        <div className="flex flex-wrap gap-2 mb-4">
          {POULTRY_TYPES.map((pt) => (
            <button
              key={pt.value}
              type="button"
              onClick={() => toggleType(pt.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                poultryTypes.includes(pt.value)
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'
              }`}
            >
              {pt.label}
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Flock size (number of birds)
        </label>
        <input
          type="number"
          value={flockSize}
          onChange={(e) => setFlockSize(e.target.value)}
          placeholder="e.g. 200"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 mb-3 focus:outline-none focus:ring-2 focus:ring-green-600"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Primary market channel
        </label>
        <select
          value={marketChannel}
          onChange={(e) => setMarketChannel(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          <option value="local">Local market</option>
          <option value="broker">Broker</option>
          <option value="direct">Direct buyer</option>
        </select>
      </section>

      {message && (
        <p className="text-sm bg-green-50 border border-green-200 text-green-800 p-3 rounded">
          {message}
        </p>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-green-700 hover:bg-green-800 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}
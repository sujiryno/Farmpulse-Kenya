// components/ProfitForm.tsx
'use client'

import { useState, useMemo } from 'react'

const POULTRY_TYPES = [
  { value: 'broiler', label: 'Broilers' },
  { value: 'layer', label: 'Layers' },
  { value: 'kienyeji', label: 'Kienyeji' },
]

type FeedOption = { brand: string; feed_type: string; price_kes: number; county: string }

export default function ProfitForm({ feedPrices }: { feedPrices: FeedOption[] }) {
  const [poultryType, setPoultryType] = useState('broiler')
  const [birdCount, setBirdCount] = useState('100')
  const [chickCost, setChickCost] = useState('100')
  const [mortality, setMortality] = useState('5')
  const [sellingWeight, setSellingWeight] = useState('2')
  const [pricePerKg, setPricePerKg] = useState('450')
  const [layRate, setLayRate] = useState('80')
  const [eggPrice, setEggPrice] = useState('15')
  const [selectedFeed, setSelectedFeed] = useState(0)
  const [feedBags, setFeedBags] = useState('5')

  const result = useMemo(() => {
    const birds = parseInt(birdCount) || 0
    const cost = parseFloat(chickCost) || 0
    const mortPct = parseFloat(mortality) || 0
    const feedBagPrice = feedPrices[selectedFeed]?.price_kes ?? 0
    const bags = parseFloat(feedBags) || 0

    const surviving = Math.floor(birds * (1 - mortPct / 100))
    const chickTotal = birds * cost
    const feedTotal = bags * feedBagPrice
    const totalCost = chickTotal + feedTotal

    let revenue = 0
    if (poultryType === 'layer') {
      const layRatePct = parseFloat(layRate) || 0
      const eggPriceKes = parseFloat(eggPrice) || 0
      // 300-day cycle assumption
      const eggs = surviving * (layRatePct / 100) * 300
      revenue = eggs * eggPriceKes
    } else {
      const weight = parseFloat(sellingWeight) || 0
      const ppk = parseFloat(pricePerKg) || 0
      revenue = surviving * weight * ppk
    }

    const profit = revenue - totalCost
    const perBirdCost = birds > 0 ? totalCost / birds : 0
    const breakEven = revenue > 0 ? totalCost / (revenue / birds) : 0

    return {
      surviving,
      totalCost,
      revenue,
      profit,
      perBirdCost,
      breakEven: Math.ceil(breakEven),
      margin: revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0',
    }
  }, [poultryType, birdCount, chickCost, mortality, sellingWeight, pricePerKg, layRate, eggPrice, selectedFeed, feedBags, feedPrices])

  const isProfit = result.profit >= 0

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <section className="bg-white rounded-lg border border-gray-100 p-5 space-y-4">
        <h2 className="font-bold text-green-800">Your flock</h2>

        <div>
          <label className="block text-sm text-gray-600 mb-2">Poultry type</label>
          <div className="flex flex-wrap gap-2">
            {POULTRY_TYPES.map((pt) => (
              <button
                key={pt.value}
                type="button"
                onClick={() => setPoultryType(pt.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  poultryType === pt.value
                    ? 'bg-green-700 text-white border-green-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50'
                }`}
              >
                {pt.label}
              </button>
            ))}
          </div>
        </div>

        <Field label="Number of birds" value={birdCount} onChange={setBirdCount} type="number" />
        <Field label="Chick cost per bird (KES)" value={chickCost} onChange={setChickCost} type="number" />
        <Field label="Expected mortality (%)" value={mortality} onChange={setMortality} type="number" />

        {poultryType === 'layer' ? (
          <>
            <Field label="Lay rate (%)" value={layRate} onChange={setLayRate} type="number" />
            <Field label="Egg price (KES)" value={eggPrice} onChange={setEggPrice} type="number" />
          </>
        ) : (
          <>
            <Field label="Selling weight per bird (kg)" value={sellingWeight} onChange={setSellingWeight} type="number" />
            <Field label="Selling price per kg (KES)" value={pricePerKg} onChange={setPricePerKg} type="number" />
          </>
        )}
      </section>

      {/* Feed */}
      <section className="bg-white rounded-lg border border-gray-100 p-5 space-y-4">
        <h2 className="font-bold text-green-800">Feed</h2>

        {feedPrices.length === 0 ? (
          <p className="text-sm text-gray-500">No feed prices available yet.</p>
        ) : (
          <>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Feed brand</label>
              <select
                value={selectedFeed}
                onChange={(e) => setSelectedFeed(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                {feedPrices.map((fp, i) => (
                  <option key={i} value={i}>
                    {fp.brand} · {fp.feed_type} · KES {fp.price_kes} ({fp.county})
                  </option>
                ))}
              </select>
            </div>

            <Field
              label="Number of 50kg bags needed"
              value={feedBags}
              onChange={setFeedBags}
              type="number"
            />
          </>
        )}
      </section>

      {/* Result */}
      <section
        className={`rounded-lg p-6 border-2 ${
          isProfit
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}
      >
        <p className="text-sm font-medium text-gray-600 mb-2">Estimated result</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Stat label="Total cost" value={`KES ${result.totalCost.toLocaleString()}`} />
          <Stat label="Expected revenue" value={`KES ${result.revenue.toLocaleString()}`} />
        </div>

        <div
          className={`text-2xl font-bold mb-3 ${
            isProfit ? 'text-green-800' : 'text-red-700'
          }`}
        >
          {isProfit ? '📈 Profit' : '📉 Loss'}: KES{' '}
          {Math.abs(result.profit).toLocaleString()}
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Margin</p>
            <p className="font-bold">{result.margin}%</p>
          </div>
          <div>
            <p className="text-gray-500">Surviving birds</p>
            <p className="font-bold">{result.surviving}</p>
          </div>
          <div>
            <p className="text-gray-500">Cost per bird</p>
            <p className="font-bold">KES {Math.round(result.perBirdCost)}</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 italic mt-4">
          Estimates only. Actual results vary with feed quality, disease, and market prices.
        </p>
      </section>
    </div>
  )
}

function Field({
  label, value, onChange, type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-600"
      />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-bold text-gray-800">{value}</p>
    </div>
  )
}
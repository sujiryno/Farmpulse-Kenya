// app/page.tsx
import Link from 'next/link'

const features = [
  {
    href: '/diseases',
    title: 'Disease Library',
    description: 'Browse 20+ common poultry diseases with symptoms, causes and treatments.',
    emoji: '📚',
  },
  {
    href: '/predictor',
    title: 'AI Disease Predictor',
    description: 'Select symptoms or upload a photo to get an instant AI diagnosis.',
    emoji: '🤖',
  },
  {
    href: '/prices',
    title: 'Feed & Medicine Prices',
    description: 'Compare current prices from Kenyan suppliers in your county.',
    emoji: '💰',
  },
  {
    href: '/vets',
    title: 'Find a Vet',
    description: 'Connect with registered veterinarians near you.',
    emoji: '👨‍⚕️',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-green-800 mb-3">
            FarmPulse Kenya
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            AI-powered poultry health &amp; farm management for Kenyan farmers
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100"
            >
              <div className="text-3xl mb-3">{f.emoji}</div>
              <h2 className="text-xl font-bold text-green-800 mb-2">{f.title}</h2>
              <p className="text-gray-600 text-sm">{f.description}</p>
            </Link>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-12">
          © 2026 FarmPulse Kenya · MVP
        </p>
      </div>
    </main>
  )
}
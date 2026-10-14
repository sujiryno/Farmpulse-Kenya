// app/page.tsx
import Link from 'next/link'

const features = [
  {
    href: '/predictor',
    title: 'AI Disease Predictor',
    description:
      'Select symptoms or upload a photo to get an instant AI diagnosis for your flock.',
    emoji: '🤖',
    highlight: true,
  },
  {
    href: '/diseases',
    title: 'Disease Library',
    description:
      'Browse 20+ common poultry diseases with symptoms, causes and treatment guides.',
    emoji: '📚',
  },
  {
    href: '/prices',
    title: 'Feed & Medicine Prices',
    description:
      'Compare current prices from Kenyan suppliers in your county.',
    emoji: '💰',
  },
  {
    href: '/vets',
    title: 'Find a Vet',
    description:
      'Connect with registered veterinarians near you.',
    emoji: '👨‍⚕️',
  },
]

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-green-50 to-white">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🐔</div>
        <h1 className="text-4xl md:text-5xl font-bold text-green-800 mb-4">
          FarmPulse Kenya
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          AI-powered poultry health &amp; farm management. Diagnose diseases,
          compare prices, and find vets — all in one place.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/predictor"
            className="bg-green-700 hover:bg-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            🤖 Try AI Diagnosis
          </Link>
          <Link
            href="/diseases"
            className="bg-white hover:bg-gray-50 text-green-700 font-semibold py-3 px-6 rounded-lg border-2 border-green-700 transition-colors"
          >
            📚 Browse Diseases
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Everything farmers need
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={`block rounded-xl p-6 border transition-all hover:shadow-md ${
                f.highlight
                  ? 'bg-gradient-to-br from-green-600 to-green-700 text-white border-green-700'
                  : 'bg-white border-gray-100 hover:border-green-200'
              }`}
            >
              <div className="text-3xl mb-3">{f.emoji}</div>
              <h3
                className={`text-xl font-bold mb-2 ${
                  f.highlight ? 'text-white' : 'text-green-800'
                }`}
              >
                {f.title}
              </h3>
              <p
                className={`text-sm ${
                  f.highlight ? 'text-green-50' : 'text-gray-600'
                }`}
              >
                {f.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
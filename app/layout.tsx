// app/layout.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'FarmPulse Kenya — AI Poultry Health',
  description:
    'AI-powered poultry disease diagnosis, feed & medicine prices, and vet directory for Kenyan farmers.',
}

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/diseases', label: 'Diseases' },
  { href: '/predictor', label: 'Predictor' },
  { href: '/prices', label: 'Prices' },
  { href: '/vets', label: 'Vets' },
  { href: '/profit-calculator', label: 'Calculator' },
  { href: '/profile', label: 'Profile' },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-lg text-green-800"
            >
              <span className="text-2xl">🐔</span>
              <span className="hidden sm:inline">FarmPulse</span>
            </Link>

            <nav className="flex items-center gap-1 overflow-x-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm px-3 py-2 rounded-lg text-gray-600 hover:text-green-800 hover:bg-green-50 transition-colors whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
            © 2026 FarmPulse Kenya · MVP
          </div>
        </footer>
      </body>
    </html>
  )
}
// app/profile/page.tsx
import { connection } from 'next/server'
import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/ProfileForm'
import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'My Profile',
  description: 'Manage your farmer profile.',
}

async function LoadProfile() {
  await connection() // ← was: await cookies()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: farmer } = await supabase
    .from('farmers')
    .select('id, name, phone, county, poultry_types, flock_size, market_channel, role')
    .eq('user_id', user.id)
    .single()

  if (!farmer) {
    return (
      <p className="text-red-600">
        Profile not found. Please contact support.
      </p>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-100 p-5 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl">
          🧑‍🌾
        </div>
        <div>
          <p className="text-sm text-gray-500">
            {user.email}
          </p>
          <p className="font-bold text-green-800 capitalize">
            {farmer.role}
          </p>
        </div>
      </div>

      <ProfileForm farmer={farmer} />
    </>
  )
}

export default function ProfilePage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm text-green-700 hover:underline">
        ← Back to home
      </Link>
      <h1 className="text-3xl font-bold text-green-800 mt-3 mb-6">
        My Profile
      </h1>

      <Suspense fallback={<p className="text-gray-500">Loading…</p>}>
        <LoadProfile />
      </Suspense>
    </main>
  )
}
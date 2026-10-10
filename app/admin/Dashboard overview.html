import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminDashboard() {
  const supabase = await createClient()
  
  // Fetch counts
  const [pendingVets, pendingFeed, pendingMedicine, totalFarmers, todayPredictions, revenue] = await Promise.all([
    supabase.from('vets').select('*', { count: 'exact', head: true }).eq('verified', false),
    supabase.from('feed_prices').select('*', { count: 'exact', head: true }).eq('verified', false),
    supabase.from('medicine_prices').select('*', { count: 'exact', head: true }).eq('verified', false),
    supabase.from('farmers').select('*', { count: 'exact', head: true }).eq('role', 'farmer'),
    supabase.from('predictor_sessions').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
    supabase.from('daily_passes').select('amount_kes').eq('status', 'confirmed').gte('activated_at', new Date().toISOString().split('T')[0])
  ])
  
  const totalRevenue = revenue.data?.reduce((sum, p) => sum + (p.amount_kes || 0), 0) || 0
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Pending Vets</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{pendingVets.count || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pending Feed Prices</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{pendingFeed.count || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pending Medicine Prices</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{pendingMedicine.count || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Farmers</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalFarmers.count || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Predictions Today</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{todayPredictions.count || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Revenue Today (KES)</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalRevenue}</p></CardContent>
        </Card>
      </div>
    </div>
  )
}
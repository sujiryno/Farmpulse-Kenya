// app/api/admin/medicine-prices/[id]/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  
  // Admin check (same as above)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { data: profile } = await supabase
    .from('farmers')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  
  const { verified } = await req.json();
  if (typeof verified !== 'boolean') {
    return NextResponse.json({ error: 'Missing "verified" boolean' }, { status: 400 });
  }
  
  const priceId = parseInt(params.id);
  
  const { data, error } = await supabase
    .from('medicine_prices')
    .update({
      verified: verified,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    })
    .eq('id', priceId)
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true, data });
}
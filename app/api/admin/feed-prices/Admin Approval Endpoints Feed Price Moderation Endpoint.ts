// app/api/admin/feed-prices/[id]/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  
  // 1. Get current user and check admin role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { data: profile } = await supabase
    .from('farmers')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  
  // 2. Parse request body
  const { verified } = await req.json(); // true = approve, false = reject
  if (typeof verified !== 'boolean') {
    return NextResponse.json({ error: 'Missing "verified" boolean' }, { status: 400 });
  }
  
  const priceId = parseInt(params.id);
  
  // 3. Update the feed price submission
  const { data, error } = await supabase
    .from('feed_prices')
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
  
  // 4. (Optional) Notify the farmer who submitted it
  if (data.submitted_by) {
    // You could send an SMS or in-app notification here
    // For MVP, just log it
    console.log(`Feed price ${priceId} ${verified ? 'approved' : 'rejected'}`);
  }
  
  return NextResponse.json({ success: true, data });
}
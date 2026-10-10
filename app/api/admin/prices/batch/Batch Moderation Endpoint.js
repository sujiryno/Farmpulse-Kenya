import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  
  // Admin check
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
  
  const { type, ids, verified } = await req.json(); // type: 'feed' or 'medicine'
  
  if (!['feed', 'medicine'].includes(type) || !Array.isArray(ids) || ids.length === 0 || typeof verified !== 'boolean') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  
  const table = type === 'feed' ? 'feed_prices' : 'medicine_prices';
  
  const { data, error } = await supabase
    .from(table)
    .update({
      verified: verified,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    })
    .in('id', ids);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true, updatedCount: data?.length || 0 });
}
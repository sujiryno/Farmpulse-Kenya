import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
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
  
  const url = new URL(req.url);
  const type = url.searchParams.get('type'); // 'feed' or 'medicine'
  
  if (!type || !['feed', 'medicine'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  }
  
  const table = type === 'feed' ? 'feed_prices' : 'medicine_prices';
  
  const { data, error } = await supabase
    .from(table)
    .select(`
      *,
      farmers!submitted_by (name, phone)
    `)
    .eq('verified', false)
    .order('submitted_at', { ascending: false });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ submissions: data });
}
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const GET = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.from('categories').select('*').order('sort_order');
  if (error) {
    return NextResponse.json({ error: error.message });
  }
  return NextResponse.json(data);
};

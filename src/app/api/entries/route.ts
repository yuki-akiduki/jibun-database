import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const supabase = await createClient();

  const { url, site_type, title, thumbnail_url } = body;
  const { error } = await supabase.from('entries').insert({
    url,
    site_type,
    title,
    thumbnail_url,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
};

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const POST = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { url, site_type, title, thumbnail_url, category_id, memo } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: '無効なURLです' }, { status: 400 });
    }

    if (!site_type) {
      return NextResponse.json({ error: 'site_type is required' }, { status: 400 });
    }

    const { error } = await supabase.from('entries').insert({
      url,
      site_type,
      title,
      thumbnail_url,
      category_id,
      memo,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '登録中にエラーが発生しました' }, { status: 500 });
  }
};

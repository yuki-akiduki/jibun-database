import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectSiteType } from '@/lib/utils';
import * as cheerio from 'cheerio';

export const POST = async (request: NextRequest) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await request.json();
  const { url } = body;

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return NextResponse.json({ error: '無効なURLスキームです' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: '無効なURLです' }, { status: 400 });
  }

  const siteType = detectSiteType(url);

  try {
    if (siteType === 'youtube') {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      );
      if (!res.ok) {
        return NextResponse.json({ error: 'YouTube メタデータの取得に失敗しました' }, { status: 502 });
      }
      const data = await res.json();
      const urlObj = new URL(url);
      const videoId =
        urlObj.hostname === 'youtu.be'
          ? urlObj.pathname.slice(1)
          : urlObj.searchParams.get('v');
      const thumbnail_url = videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : data.thumbnail_url;
      return NextResponse.json({
        title: data.title,
        thumbnail_url,
        site_type: siteType,
      });
    } else if (siteType === 'x') {
      const res = await fetch(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`);
      if (!res.ok) {
        return NextResponse.json({ error: 'X のメタデータの取得に失敗しました' }, { status: 502 });
      }
      const data = await res.json();
      return NextResponse.json({
        html: data.html,
        site_type: siteType,
      });
    } else {
      const res = await fetch(url);
      if (!res.ok) {
        return NextResponse.json({ error: 'ページの取得に失敗しました' }, { status: 502 });
      }
      const html = await res.text();
      const $ = cheerio.load(html);
      const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
      const thumbnail_url = $('meta[property="og:image"]').attr('content') || '';
      return NextResponse.json({ title, thumbnail_url, site_type: siteType });
    }
  } catch {
    return NextResponse.json({ error: 'メタデータの取得中にエラーが発生しました' }, { status: 500 });
  }
};

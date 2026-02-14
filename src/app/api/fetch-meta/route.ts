import { NextRequest, NextResponse } from 'next/server';
import { detectSiteType } from '@/lib/utils';
export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const { url } = body;
  const siteType = detectSiteType(url);
  if (siteType === 'youtube') {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    );
    const data = await res.json();
    return NextResponse.json({ title: data.title, thumbnail_url: data.thumbnail_url });
  } else {
    return null;
  }
};

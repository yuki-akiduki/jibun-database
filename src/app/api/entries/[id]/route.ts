import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const { id } = await params;
    const { category_id, memo, is_favorite, is_archived } = body;

    // お気に入り/アーカイブの排他チェック
    if (is_favorite !== undefined || is_archived !== undefined) {
      const { data: entry } = await supabase.from('entries').select('is_favorite, is_archived').eq('id', id).single();
      if (entry) {
        const newFavorite = is_favorite ?? entry.is_favorite;
        const newArchived = is_archived ?? entry.is_archived;
        if (newFavorite && newArchived) {
          return NextResponse.json({ error: 'お気に入りとアーカイブは同時に設定できません' }, { status: 400 });
        }
      }
    }

    const updateData: Record<string, unknown> = {};
    if (category_id !== undefined) updateData.category_id = category_id;
    if (memo !== undefined) updateData.memo = memo;
    if (is_favorite !== undefined) updateData.is_favorite = is_favorite;
    if (is_archived !== undefined) updateData.is_archived = is_archived;

    const { error } = await supabase.from('entries').update(updateData).eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '更新中にエラーが発生しました' }, { status: 500 });
  }
};

export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { id } = await params;
    const { error } = await supabase.from('entries').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '削除中にエラーが発生しました' }, { status: 500 });
  }
};

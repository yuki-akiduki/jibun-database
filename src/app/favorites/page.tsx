import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import EntryList from '@/components/entry/EntryList';
import type { Entry } from '@/lib/types';

export const metadata: Metadata = {
  title: 'お気に入り',
};

export default async function FavoritesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .eq('is_favorite', true)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm no-underline">
          ← 戻る
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="material-icons text-yellow-500">star</span>
          お気に入り
        </h1>
        <span className="text-sm text-gray-400">{entries?.length ?? 0}件</span>
      </div>

      <EntryList
        entries={(entries ?? []) as Entry[]}
        categories={categories ?? []}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}

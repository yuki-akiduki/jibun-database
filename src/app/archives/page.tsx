import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/auth';
import { getCategories } from '@/lib/supabase/categories';
import { ENTRY_LIST_COLUMNS } from '@/lib/supabase/queries';
import EntryList from '@/components/entry/EntryList';
import type { Entry } from '@/lib/types';

export const metadata: Metadata = {
  title: 'アーカイブ',
};

export default async function ArchivesPage() {
  const supabase = await createClient();
  const entriesPromise = supabase
    .from('entries')
    .select(ENTRY_LIST_COLUMNS)
    .eq('is_archived', true)
    .order('created_at', { ascending: false });

  const [user, categories, { data: entries }] = await Promise.all([
    getUser(),
    getCategories(),
    entriesPromise,
  ]);
  const isLoggedIn = !!user;

  return (
    <div>
      <header className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-stone-400 transition-colors hover:text-stone-700"
        >
          <span className="material-icons text-[14px]">arrow_back</span>
          すべて
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-stone-900">
            <span className="material-icons text-stone-400">archive</span>
            アーカイブ
          </h1>
          <span className="text-sm tabular-nums text-stone-400">
            {entries?.length ?? 0}件
          </span>
        </div>
      </header>

      <EntryList
        entries={(entries ?? []) as Entry[]}
        categories={categories ?? []}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}

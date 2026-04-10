import EntryForm from '@/components/entry/EntryForm';
import EntryList from '@/components/entry/EntryList';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/auth';
import { getCategories } from '@/lib/supabase/categories';
import { ENTRY_LIST_COLUMNS } from '@/lib/supabase/queries';
import type { Entry } from '@/lib/types';

export default async function Home() {
  const supabase = await createClient();
  const entriesPromise = supabase
    .from('entries')
    .select(ENTRY_LIST_COLUMNS)
    .neq('site_type', 'x')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(20);

  const [user, categories, { data: entries }] = await Promise.all([
    getUser(),
    getCategories(),
    entriesPromise,
  ]);
  const isLoggedIn = !!user;

  return (
    <div>
      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
          Recent
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
          最近の登録
        </h1>
      </header>
      {isLoggedIn && <EntryForm categories={categories ?? []} />}
      <EntryList
        entries={(entries ?? []) as Entry[]}
        categories={categories ?? []}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}

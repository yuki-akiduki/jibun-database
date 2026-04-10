import EntryForm from '@/components/entry/EntryForm';
import EntryList from '@/components/entry/EntryList';
import { createClient } from '@/lib/supabase/server';
import type { Entry } from '@/lib/types';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .neq('site_type', 'x')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');

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

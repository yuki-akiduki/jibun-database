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
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">最近の登録</h1>
      {isLoggedIn && <EntryForm categories={categories ?? []} />}
      <EntryList
        entries={(entries ?? []) as Entry[]}
        categories={categories ?? []}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}

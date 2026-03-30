import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import BulkDeleteSection from '@/components/entry/BulkDeleteSection';
import Pagination from '@/components/ui/Pagination';
import { notFound } from 'next/navigation';
import type { Entry } from '@/lib/types';

const PER_PAGE = 40;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: categories } = await supabase.from('categories').select('name').eq('id', id).single();
  return { title: categories?.name ?? 'カテゴリ' };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const currentPage = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  const { data: categories } = await supabase.from('categories').select('*').order('sort_order');
  const category = categories?.find((cat) => cat.id === id);
  if (!category) {
    notFound();
  }

  const from = (currentPage - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  const { data: entries, count } = await supabase
    .from('entries')
    .select('*', { count: 'exact' })
    .eq('category_id', category.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count ?? 0) / PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm no-underline">
            ← 戻る
          </Link>
          <h1 className="text-xl font-bold">{category.name}</h1>
          {count !== null && (
            <span className="text-sm text-gray-400">{count}件</span>
          )}
        </div>
        </div>

      <BulkDeleteSection
        entries={(entries ?? []) as Entry[]}
        categories={categories ?? []}
        isLoggedIn={isLoggedIn}
        isXCategory={category.name === 'X'}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath={`/categories/${id}`}
      />
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/auth';
import { getCategories } from '@/lib/supabase/categories';
import { ENTRY_LIST_COLUMNS } from '@/lib/supabase/queries';
import BulkDeleteSection from '@/components/entry/BulkDeleteSection';
import Pagination from '@/components/ui/Pagination';
import { notFound } from 'next/navigation';
import { categoryStyles, defaultCategoryStyle } from '@/lib/constants/categories';
import type { Entry } from '@/lib/types';

const PER_PAGE = 40;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const categories = await getCategories();
  const category = categories.find((cat) => cat.id === id);
  return { title: category?.name ?? 'カテゴリ' };
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

  const [user, categories] = await Promise.all([getUser(), getCategories()]);
  const isLoggedIn = !!user;

  const category = categories.find((cat) => cat.id === id);
  if (!category) {
    notFound();
  }

  const supabase = await createClient();
  const from = (currentPage - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  const { data: entries, count } = await supabase
    .from('entries')
    .select(ENTRY_LIST_COLUMNS, { count: 'exact' })
    .eq('category_id', category.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count ?? 0) / PER_PAGE);
  const style = categoryStyles[category.name] ?? defaultCategoryStyle;

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
        <div className="mt-2 flex items-baseline gap-3">
          <span className={`h-2.5 w-2.5 shrink-0 translate-y-[-3px] rounded-full ${style.dot}`} />
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            {category.name}
          </h1>
          {count !== null && (
            <span className="text-sm tabular-nums text-stone-400">{count}件</span>
          )}
        </div>
      </header>

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

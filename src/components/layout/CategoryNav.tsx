'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Categories } from '@/lib/types';
import { categoryStyles, defaultCategoryStyle } from '@/lib/constants/categories';

type Props = {
  categories: Categories;
};

const navItemBase =
  'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors';
const navItemActive = 'bg-white text-stone-900 font-medium shadow-sm ring-1 ring-stone-200';
const navItemInactive = 'text-stone-600 hover:bg-stone-100/70 hover:text-stone-900';

export default function CategoryNav({ categories }: Props) {
  const pathname = usePathname();
  const match = pathname.match(/^\/categories\/(.+)/);
  const activeCategoryId = match ? match[1] : undefined;
  const isFavoritesPage = pathname === '/favorites';
  const isArchivesPage = pathname === '/archives';
  const isTopPage = pathname === '/' && !activeCategoryId;

  return (
    <nav className="flex flex-col gap-0.5">
      <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
        Library
      </p>
      <Link
        href="/"
        className={`${navItemBase} ${isTopPage ? navItemActive : navItemInactive}`}
      >
        <span className="material-icons text-[18px] text-stone-400 group-hover:text-stone-600">
          inbox
        </span>
        すべて
      </Link>

      <p className="mt-4 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
        Categories
      </p>
      {categories.map((cat) => {
        const isActive = activeCategoryId === cat.id;
        const style = categoryStyles[cat.name] ?? defaultCategoryStyle;
        return (
          <Link
            key={cat.id}
            href={`/categories/${cat.id}`}
            className={`${navItemBase} ${isActive ? navItemActive : navItemInactive}`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
            <span className="truncate">{cat.name}</span>
          </Link>
        );
      })}

      <p className="mt-4 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
        Saved
      </p>
      <Link
        href="/favorites"
        className={`${navItemBase} ${isFavoritesPage ? navItemActive : navItemInactive}`}
      >
        <span className="material-icons text-[18px] text-amber-500">star</span>
        お気に入り
      </Link>
      <Link
        href="/archives"
        className={`${navItemBase} ${isArchivesPage ? navItemActive : navItemInactive}`}
      >
        <span className="material-icons text-[18px] text-stone-400 group-hover:text-stone-500">
          archive
        </span>
        アーカイブ
      </Link>
    </nav>
  );
}

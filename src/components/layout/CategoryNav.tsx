'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Categories } from '@/lib/types';
import { categoryColors } from '@/lib/constants/categories';

type Props = {
  categories: Categories;
};

export default function CategoryNav({ categories }: Props) {
  const pathname = usePathname();
  const match = pathname.match(/^\/categories\/(.+)/);
  const activeCategoryId = match ? match[1] : undefined;
  const isFavoritesPage = pathname === '/favorites';
  const isArchivesPage = pathname === '/archives';
  const isTopPage = pathname === '/' && !activeCategoryId;

  return (
    <nav className="flex flex-col gap-1">
      <Link
        href="/"
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm no-underline transition-colors ${
          isTopPage
            ? 'bg-gray-100 text-gray-900 font-medium'
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        すべて
      </Link>
      {categories.map((cat) => {
        const isActive = activeCategoryId === cat.id;
        const color = categoryColors[cat.name];
        return (
          <Link
            key={cat.id}
            href={`/categories/${cat.id}`}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm no-underline transition-colors ${
              isActive
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {color && (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
            )}
            {cat.name}
          </Link>
        );
      })}

      <hr className="my-2 border-gray-200" />

      <Link
        href="/favorites"
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm no-underline transition-colors ${
          isFavoritesPage
            ? 'bg-gray-100 text-gray-900 font-medium'
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        <span className="material-icons text-base text-yellow-500">star</span>
        お気に入り
      </Link>
      <Link
        href="/archives"
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm no-underline transition-colors ${
          isArchivesPage
            ? 'bg-gray-100 text-gray-900 font-medium'
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        <span className="material-icons text-base text-gray-400">archive</span>
        アーカイブ
      </Link>
    </nav>
  );
}

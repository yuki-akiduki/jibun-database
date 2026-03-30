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

  return (
    <nav className="flex flex-col gap-1">
      <Link
        href="/"
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm no-underline transition-colors ${
          !activeCategoryId
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
    </nav>
  );
}

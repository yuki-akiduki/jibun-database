import Link from 'next/link';

type Props = {
  currentPage: number;
  totalPages: number;
  basePath: string;
};

function getVisiblePages(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [1];

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('...');
  }

  pages.push(total);
  return pages;
}

const linkBase =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-xs font-medium transition-colors';

export default function Pagination({ currentPage, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(currentPage, totalPages);
  const separator = basePath.includes('?') ? '&' : '?';

  return (
    <nav className="mt-10 flex items-center justify-center gap-1">
      {currentPage > 1 && (
        <Link
          href={`${basePath}${separator}page=${currentPage - 1}`}
          className={`${linkBase} text-stone-600 hover:bg-stone-100 hover:text-stone-900`}
        >
          ← 前へ
        </Link>
      )}
      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="px-1 text-xs text-stone-400">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={`${basePath}${separator}page=${page}`}
            className={`${linkBase} ${
              page === currentPage
                ? 'bg-stone-900 text-stone-50 shadow-sm shadow-stone-900/20'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            {page}
          </Link>
        ),
      )}
      {currentPage < totalPages && (
        <Link
          href={`${basePath}${separator}page=${currentPage + 1}`}
          className={`${linkBase} text-stone-600 hover:bg-stone-100 hover:text-stone-900`}
        >
          次へ →
        </Link>
      )}
    </nav>
  );
}

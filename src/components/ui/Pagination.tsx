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

export default function Pagination({ currentPage, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(currentPage, totalPages);
  const separator = basePath.includes('?') ? '&' : '?';

  return (
    <nav className="flex items-center gap-1 mt-8">
      {currentPage > 1 && (
        <Link
          href={`${basePath}${separator}page=${currentPage - 1}`}
          className="px-3 py-2 text-sm rounded-md hover:bg-gray-100 text-gray-600"
        >
          前へ
        </Link>
      )}
      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 py-2 text-sm text-gray-400">
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={`${basePath}${separator}page=${page}`}
            className={`px-3 py-2 text-sm rounded-md ${
              page === currentPage
                ? 'bg-gray-900 text-white'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            {page}
          </Link>
        ),
      )}
      {currentPage < totalPages && (
        <Link
          href={`${basePath}${separator}page=${currentPage + 1}`}
          className="px-3 py-2 text-sm rounded-md hover:bg-gray-100 text-gray-600"
        >
          次へ
        </Link>
      )}
    </nav>
  );
}

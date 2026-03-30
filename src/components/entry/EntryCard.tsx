'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import CategoryBadge from './CategoryBadge';
import EntryCardMenu from './EntryCardMenu';
import EntryEditModal from './EntryEditModal';
import { deleteEntry } from '@/lib/api/entries';
import { Entry, Categories } from '@/lib/types';

type Props = {
  entry: Entry;
  categories: Categories;
  categoryName?: string;
  isLoggedIn: boolean;
};

const EntryCard = ({ entry, categories, categoryName, isLoggedIn }: Props) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (window.confirm('削除しますか？')) {
      try {
        await deleteEntry(entry.id);
        router.refresh();
      } catch (e) {
        console.error(e instanceof Error ? e.message : '削除に失敗しました');
      }
    }
  };

  return (
    <>
      <div className="flex gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
        {entry.thumbnail_url && (
          <a
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <img
              src={entry.thumbnail_url}
              alt=""
              className="w-40 h-24 object-cover rounded-md"
            />
          </a>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-900 no-underline hover:underline line-clamp-2"
            >
              {entry.title}
            </a>
            {isLoggedIn && (
              <EntryCardMenu
                onEdit={() => setIsEditOpen(true)}
                onDelete={handleDelete}
              />
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            {categoryName && <CategoryBadge name={categoryName} />}
            <span className="text-xs text-gray-400">
              {dayjs(entry.created_at).format('YYYY/MM/DD')}
            </span>
          </div>
          {entry.memo && (
            <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap line-clamp-2">
              {entry.memo}
            </p>
          )}
        </div>
      </div>

      {isLoggedIn && (
        <EntryEditModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          entryId={entry.id}
          currentCategoryId={entry.category_id}
          currentMemo={entry.memo}
          categories={categories}
        />
      )}
    </>
  );
};

export default EntryCard;

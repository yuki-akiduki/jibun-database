'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import EntryCard from './EntryCard';
import { deleteEntry } from '@/lib/api/entries';
import { Entry, Categories } from '@/lib/types';

type Props = {
  entries: Entry[];
  categories: Categories;
  isLoggedIn: boolean;
  isXCategory?: boolean;
};

export default function BulkDeleteSection({ entries, categories, isLoggedIn, isXCategory = false }: Props) {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm('本当に削除しますか？')) return;

    setIsDeleting(true);
    try {
      await Promise.all([...selectedIds].map((id) => deleteEntry(id)));
      exitSelectMode();
      router.refresh();
    } catch (e) {
      console.error(e instanceof Error ? e.message : '削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  if (entries.length === 0) {
    return <p className="text-gray-500 text-sm py-8 text-center">エントリがありません</p>;
  }

  return (
    <>
      {isLoggedIn && (
        <div className="flex items-center gap-2 mb-3">
          {isSelectMode ? (
            <>
              <Button variant="secondary" onClick={exitSelectMode}>
                キャンセル
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={selectedIds.size === 0 || isDeleting}
              >
                {isDeleting ? '削除中...' : `${selectedIds.size}件を削除`}
              </Button>
            </>
          ) : (
            <Button variant="danger" onClick={() => setIsSelectMode(true)}>
              一括削除
            </Button>
          )}
        </div>
      )}

      <div className={`grid gap-3 ${
        isXCategory
          ? 'grid-cols-1 lg:grid-cols-2'
          : 'grid-cols-1'
      }`}>
        {entries.map((entry) => {
          const categoryName = categories.find((c) => c.id === entry.category_id)?.name;
          return (
            <div key={entry.id} className="relative">
              {isSelectMode && (
                <input
                  type="checkbox"
                  checked={selectedIds.has(entry.id)}
                  onChange={() => toggleSelect(entry.id)}
                  className="absolute top-2 left-2 z-10 w-4 h-4 cursor-pointer accent-red-500"
                />
              )}
              <EntryCard
                entry={entry}
                categories={categories}
                categoryName={categoryName}
                isLoggedIn={isLoggedIn && !isSelectMode}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}

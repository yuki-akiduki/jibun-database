'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { updateEntry } from '@/lib/api/entries';
import { Categories } from '@/lib/types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  entryId: string;
  currentCategoryId: string;
  currentMemo: string;
  categories: Categories;
};

export default function EntryEditModal({
  isOpen,
  onClose,
  entryId,
  currentCategoryId,
  currentMemo,
  categories,
}: Props) {
  const categoryRef = useRef<HTMLSelectElement>(null);
  const memoRef = useRef<HTMLTextAreaElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await updateEntry(entryId, {
        category_id: categoryRef.current?.value,
        memo: memoRef.current?.value,
      });
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="エントリを編集">
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
          <select
            ref={categoryRef}
            defaultValue={currentCategoryId}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
          <textarea
            ref={memoRef}
            defaultValue={currentMemo}
            rows={4}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-y"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

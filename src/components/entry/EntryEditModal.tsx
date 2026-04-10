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
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
            カテゴリ
          </label>
          <select
            ref={categoryRef}
            defaultValue={currentCategoryId}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 transition-colors focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
            メモ
          </label>
          <textarea
            ref={memoRef}
            defaultValue={currentMemo}
            rows={4}
            className="w-full resize-y rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
          />
        </div>
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-rose-600">
            <span className="material-icons text-[16px]">error_outline</span>
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? '保存中…' : '保存'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

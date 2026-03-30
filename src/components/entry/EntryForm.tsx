'use client';
import { metaAtom } from '@/lib/jotai/atoms';
import { useAtom } from 'jotai';
import { useRef, useState } from 'react';
import UrlInput from './UrlInput';
import MetaPreview from './MetaPreview';
import { useRouter } from 'next/navigation';
import { Categories } from '@/lib/types';
import { createEntry } from '@/lib/api/entries';
import Button from '@/components/ui/Button';

const EntryForm = ({ categories }: { categories: Categories }) => {
  const [meta, setMeta] = useAtom(metaAtom);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const isXPost = meta?.site_type === 'x';

  const submitEntry = async () => {
    if (!meta) return;

    setSubmitStatus('loading');
    setErrorMessage(null);

    const xCategory = categories.find((cat) => cat.name === 'X');
    const category_id = isXPost ? xCategory?.id : categoryRef.current?.value;
    const memo = isXPost ? undefined : textAreaRef.current?.value;

    try {
      await createEntry({ ...meta, category_id, memo });
      setSubmitStatus('success');
      setMeta(null);
      inputRef.current!.value = '';
      router.refresh();
    } catch (e) {
      setSubmitStatus('error');
      setErrorMessage(e instanceof Error ? e.message : '登録中にエラーが発生しました');
    }
  };

  return (
    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex gap-2">
        <UrlInput inputRef={inputRef} />
        <Button
          onClick={submitEntry}
          disabled={!meta || submitStatus === 'loading'}
        >
          {submitStatus === 'loading' ? '登録中...' : '登録する'}
        </Button>
      </div>

      <MetaPreview />

      {meta && !isXPost && (
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
            <select
              ref={categoryRef}
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
              ref={textAreaRef}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-y"
              placeholder="メモを入力..."
            />
          </div>
        </div>
      )}

      {submitStatus === 'success' && (
        <p className="mt-2 text-sm text-green-600">登録しました</p>
      )}
      {submitStatus === 'error' && (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
};

export default EntryForm;

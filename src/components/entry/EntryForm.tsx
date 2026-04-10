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
    <div className="mb-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-900/[0.03]">
      <div className="mb-3 flex items-center gap-2">
        <span className="material-icons text-[18px] text-stone-400">add_link</span>
        <h2 className="text-[13px] font-semibold tracking-tight text-stone-900">
          新しいエントリ
        </h2>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <UrlInput inputRef={inputRef} />
        <Button
          onClick={submitEntry}
          disabled={!meta || submitStatus === 'loading'}
          className="shrink-0"
        >
          {submitStatus === 'loading' ? '登録中…' : '登録する'}
        </Button>
      </div>

      <MetaPreview />

      {meta && !isXPost && (
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-stone-500">
              カテゴリ
            </label>
            <select
              ref={categoryRef}
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
              ref={textAreaRef}
              rows={3}
              className="w-full resize-y rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
              placeholder="メモを入力..."
            />
          </div>
        </div>
      )}

      {submitStatus === 'success' && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600">
          <span className="material-icons text-[16px]">check_circle</span>
          登録しました
        </p>
      )}
      {submitStatus === 'error' && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-rose-600">
          <span className="material-icons text-[16px]">error_outline</span>
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default EntryForm;

'use client';
import { metaAtom } from '@/lib/jotai/atoms';
import { useSetAtom } from 'jotai';
import { useState } from 'react';
import { fetchMeta } from '@/lib/api/entries';
import Spinner from '@/components/ui/Spinner';

type Props = {
  inputRef: React.RefObject<HTMLInputElement | null>;
};

const UrlInput = ({ inputRef }: Props) => {
  const setMeta = useSetAtom(metaAtom);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFetchMeta = async (url: string) => {
    if (!url.trim()) {
      setMeta(null);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const data = await fetchMeta(url);
      setMeta({
        title: data.title,
        thumbnail_url: data.thumbnail_url,
        url,
        site_type: data.site_type,
        html: data.html,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'メタデータの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1">
      <div className="relative">
        <span className="material-icons pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-stone-400">
          link
        </span>
        <input
          type="text"
          placeholder="https://..."
          onBlur={(e) => handleFetchMeta(e.target.value)}
          onPaste={(e) => handleFetchMeta(e.clipboardData.getData('text'))}
          ref={inputRef}
          className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-10 pr-10 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner size="sm" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-600">
          <span className="material-icons text-[14px]">error_outline</span>
          {error}
        </p>
      )}
    </div>
  );
};

export default UrlInput;

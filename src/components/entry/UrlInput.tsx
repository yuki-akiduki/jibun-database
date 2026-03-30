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
        <input
          type="text"
          placeholder="URLを入力"
          onBlur={(e) => handleFetchMeta(e.target.value)}
          onPaste={(e) => handleFetchMeta(e.clipboardData.getData('text'))}
          ref={inputRef}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner size="sm" />
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default UrlInput;

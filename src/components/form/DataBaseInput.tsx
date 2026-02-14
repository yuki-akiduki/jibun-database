'use client';
import { metaAtom } from '@/lib/jotai/atoms';
import { useAtom } from 'jotai';
import { detectSiteType } from '@/lib/utils';
export const DataBaseInput = () => {
  const [meta, setMeta] = useAtom(metaAtom);

  const fetchMeta = async (url: string) => {
    const res = await fetch('/api/fetch-meta', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    const siteType = detectSiteType(url);
    setMeta({
      title: data.title,
      thumbnail_url: data.thumbnail_url,
      url: url,
      site_type: siteType,
    });
  };

  const submitEntry = async () => {
    const res = await fetch('/api/entries', {
      method: 'POST',
      body: JSON.stringify(meta),
    });
  };
  return (
    <div>
      <input
        type="text"
        placeholder="URLを入力"
        onBlur={(e) => fetchMeta(e.target.value)}
        onPaste={(e) => fetchMeta(e.clipboardData.getData('text'))}
      />
      <button onClick={submitEntry}>登録</button>
    </div>
  );
};

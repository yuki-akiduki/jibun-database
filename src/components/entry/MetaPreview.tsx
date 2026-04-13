'use client';

import { useAtom } from 'jotai';
import { metaAtom } from '@/lib/jotai/atoms';
import { useEffect } from 'react';

const MetaPreview = () => {
  const [meta] = useAtom(metaAtom);

  useEffect(() => {
    if (meta?.site_type === 'x' && meta.html) {
      (window as unknown as { twttr?: { widgets: { load: () => void } } }).twttr?.widgets.load();
    }
  }, [meta]);

  if (!meta) return null;

  return (
    <div className="mt-4">
      {meta.site_type === 'x' && meta.html ? (
        <div
          className="rounded-xl border border-stone-200 bg-stone-50/50 p-3"
          dangerouslySetInnerHTML={{ __html: meta.html }}
        />
      ) : (
        <div className="flex flex-wrap gap-3 rounded-xl border border-stone-200 bg-stone-50/50 p-3">
          {meta.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={meta.thumbnail_url}
              alt=""
              className="h-20 w-32 shrink-0 rounded-lg object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            {meta.title ? (
              <p className="line-clamp-2 text-[13px] font-medium leading-snug text-stone-900">
                {meta.title}
              </p>
            ) : (
              <p className="text-[12px] text-stone-500">
                メタデータを取得できませんでした。URL のみで登録できます。
              </p>
            )}
            <p className="mt-1 truncate text-[11px] text-stone-400">{meta.url}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetaPreview;

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
    <div className="mt-3">
      {meta.site_type === 'x' && meta.html ? (
        <div dangerouslySetInnerHTML={{ __html: meta.html }} />
      ) : (
        <div className="flex gap-3 p-3 border border-gray-200 rounded-md bg-white flex-wrap">
          {meta.thumbnail_url && (
            <img
              src={meta.thumbnail_url}
              alt=""
              className="w-32 h-20 object-cover rounded shrink-0"
            />
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">{meta.title}</p>
            <p className="text-xs text-gray-400 mt-1">{meta.url}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetaPreview;

'use client';

import { useAtom } from 'jotai';
import { metaAtom } from '@/lib/jotai/atoms';

export const MetaPreview = () => {
  const [meta] = useAtom(metaAtom);

  if (!meta) return null;

  // TODO: metaの中身（title, thumbnail_url）を画面に表示する
  return (
    <div>
      <h1>{meta.title}</h1>
      <img src={meta.thumbnail_url} alt={meta.title} />
    </div>
  );
};
